const { query } = require('../db/connection');
const { cacheGet, cacheSet, cacheClearPattern } = require('../db/redis');
const { addDays, addWeeks, addMonths, addYears, differenceInDays, format } = require('date-fns');
const logger = require('../utils/logger');

class SubscriptionService {
  /**
   * Create a new subscription
   */
  async createSubscription(userId, data) {
    const {
      name,
      amount,
      currency = 'TRY',
      frequency,
      category = 'entertainment',
      next_payment_date,
      reminder_days = 3,
      notes
    } = data;

    const result = await query(
      `INSERT INTO subscriptions 
       (user_id, name, amount, currency, frequency, category, next_payment_date, reminder_days, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, name, amount, currency, frequency, category, next_payment_date, reminder_days, notes]
    );

    await cacheClearPattern(`subscriptions:${userId}:*`);
    return result.rows[0];
  }

  /**
   * Get all subscriptions for user
   */
  async getSubscriptions(userId, includeInactive = false) {
    const cacheKey = `subscriptions:${userId}:${includeInactive}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    let whereClause = 'WHERE user_id = $1';
    if (!includeInactive) {
      whereClause += " AND status = 'active'";
    }

    const result = await query(
      `SELECT * FROM subscriptions ${whereClause} ORDER BY next_payment_date ASC`,
      [userId]
    );

    const subscriptions = result.rows.map(sub => ({
      ...sub,
      days_until_payment: differenceInDays(new Date(sub.next_payment_date), new Date()),
      monthly_cost: this.calculateMonthlyCost(parseFloat(sub.amount), sub.frequency)
    }));

    await cacheSet(cacheKey, subscriptions, 120);
    return subscriptions;
  }

  /**
   * Calculate monthly equivalent cost
   */
  calculateMonthlyCost(amount, frequency) {
    switch (frequency) {
      case 'weekly': return amount * 4.33;
      case 'monthly': return amount;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  }

  /**
   * Get subscription summary
   */
  async getSubscriptionSummary(userId) {
    const subscriptions = await this.getSubscriptions(userId);
    
    const monthlyTotal = subscriptions.reduce((sum, sub) => sum + sub.monthly_cost, 0);
    const yearlyTotal = monthlyTotal * 12;

    const byCategory = subscriptions.reduce((acc, sub) => {
      acc[sub.category] = (acc[sub.category] || 0) + sub.monthly_cost;
      return acc;
    }, {});

    const upcomingPayments = subscriptions
      .filter(sub => sub.days_until_payment <= 7 && sub.days_until_payment >= 0)
      .map(sub => ({
        name: sub.name,
        amount: parseFloat(sub.amount),
        date: sub.next_payment_date,
        days_until: sub.days_until_payment
      }));

    return {
      totalSubscriptions: subscriptions.length,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
      byCategory,
      upcomingPayments
    };
  }

  /**
   * Update subscription
   */
  async updateSubscription(userId, subscriptionId, data) {
    const fields = [];
    const values = [subscriptionId, userId];
    let paramIndex = 3;

    const allowedFields = ['name', 'amount', 'frequency', 'category', 'next_payment_date', 'status', 'reminder_days', 'notes'];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex++}`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return null;

    const result = await query(
      `UPDATE subscriptions SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      values
    );

    await cacheClearPattern(`subscriptions:${userId}:*`);
    return result.rows[0];
  }

  /**
   * Delete subscription
   */
  async deleteSubscription(userId, subscriptionId) {
    const result = await query(
      'DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING id',
      [subscriptionId, userId]
    );
    await cacheClearPattern(`subscriptions:${userId}:*`);
    return result.rows[0] ? true : false;
  }

  /**
   * Detect recurring expenses from transactions
   */
  async detectRecurringExpenses(userId) {
    // Find transactions with similar merchant names and amounts occurring regularly
    const result = await query(
      `WITH merchant_patterns AS (
        SELECT 
          LOWER(merchant_name) as merchant,
          AVG(amount) as avg_amount,
          COUNT(*) as occurrence_count,
          ARRAY_AGG(transaction_date ORDER BY transaction_date) as dates,
          ARRAY_AGG(amount ORDER BY transaction_date) as amounts
        FROM transactions
        WHERE user_id = $1 
          AND type = 'expense'
          AND merchant_name IS NOT NULL
          AND transaction_date >= NOW() - INTERVAL '6 months'
        GROUP BY LOWER(merchant_name)
        HAVING COUNT(*) >= 2
      )
      SELECT * FROM merchant_patterns
      WHERE occurrence_count >= 2
      ORDER BY occurrence_count DESC`,
      [userId]
    );

    const detectedSubscriptions = [];

    for (const pattern of result.rows) {
      const dates = pattern.dates.map(d => new Date(d));
      const amounts = pattern.amounts.map(a => parseFloat(a));

      // Check if amounts are consistent (within 10% variance)
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const amountVariance = amounts.every(a => Math.abs(a - avgAmount) / avgAmount <= 0.1);

      if (!amountVariance) continue;

      // Check if dates follow a pattern
      const frequency = this.detectFrequency(dates);
      if (!frequency) continue;

      // Check if not already a subscription
      const existing = await query(
        `SELECT id FROM subscriptions 
         WHERE user_id = $1 AND LOWER(name) = $2`,
        [userId, pattern.merchant]
      );

      if (existing.rows.length === 0) {
        detectedSubscriptions.push({
          name: pattern.merchant,
          amount: Math.round(avgAmount * 100) / 100,
          frequency,
          occurrences: pattern.occurrence_count,
          lastDate: dates[dates.length - 1],
          suggestedNextDate: this.calculateNextDate(dates[dates.length - 1], frequency)
        });
      }
    }

    return detectedSubscriptions;
  }

  /**
   * Detect frequency from dates
   */
  detectFrequency(dates) {
    if (dates.length < 2) return null;

    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(differenceInDays(dates[i], dates[i - 1]));
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Weekly: 6-8 days
    if (avgInterval >= 6 && avgInterval <= 8) return 'weekly';
    // Monthly: 28-32 days
    if (avgInterval >= 28 && avgInterval <= 32) return 'monthly';
    // Yearly: 360-370 days
    if (avgInterval >= 360 && avgInterval <= 370) return 'yearly';

    return null;
  }

  /**
   * Calculate next payment date
   */
  calculateNextDate(lastDate, frequency) {
    const date = new Date(lastDate);
    switch (frequency) {
      case 'weekly': return addWeeks(date, 1);
      case 'monthly': return addMonths(date, 1);
      case 'yearly': return addYears(date, 1);
      default: return addMonths(date, 1);
    }
  }

  /**
   * Get subscription recommendations
   */
  async getRecommendations(userId) {
    const subscriptions = await this.getSubscriptions(userId);
    const recommendations = [];

    // Find duplicate services (e.g., multiple music streaming)
    const byCategory = {};
    for (const sub of subscriptions) {
      if (!byCategory[sub.category]) byCategory[sub.category] = [];
      byCategory[sub.category].push(sub);
    }

    for (const [category, subs] of Object.entries(byCategory)) {
      if (subs.length > 1) {
        const totalCost = subs.reduce((sum, s) => sum + s.monthly_cost, 0);
        recommendations.push({
          type: 'duplicate_services',
          category,
          services: subs.map(s => s.name),
          totalMonthlyCost: Math.round(totalCost * 100) / 100,
          suggestion: `You have ${subs.length} ${category} subscriptions. Consider keeping only one to save ${Math.round((totalCost - subs[0].monthly_cost) * 100) / 100}₺/month`
        });
      }
    }

    // Find expensive subscriptions (over 100₺/month)
    const expensive = subscriptions.filter(s => s.monthly_cost > 100);
    for (const sub of expensive) {
      recommendations.push({
        type: 'expensive_subscription',
        service: sub.name,
        monthlyCost: sub.monthly_cost,
        suggestion: `${sub.name} costs ${sub.monthly_cost.toFixed(2)}₺/month. Consider if you're using it enough.`
      });
    }

    return recommendations;
  }

  /**
   * Get upcoming payment reminders
   */
  async getUpcomingReminders(userId) {
    const result = await query(
      `SELECT * FROM subscriptions
       WHERE user_id = $1 
         AND status = 'active'
         AND next_payment_date <= CURRENT_DATE + (reminder_days || ' days')::INTERVAL
         AND next_payment_date >= CURRENT_DATE
       ORDER BY next_payment_date ASC`,
      [userId]
    );

    return result.rows.map(sub => ({
      id: sub.id,
      name: sub.name,
      amount: parseFloat(sub.amount),
      date: sub.next_payment_date,
      daysUntil: differenceInDays(new Date(sub.next_payment_date), new Date()),
      message: `${sub.name} subscription renews in ${differenceInDays(new Date(sub.next_payment_date), new Date())} days - ${sub.amount}₺`
    }));
  }
}

module.exports = new SubscriptionService();
