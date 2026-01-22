const { query } = require('../db/connection');
const { cacheGet, cacheSet, cacheClearPattern } = require('../db/redis');
const logger = require('../utils/logger');

class BudgetService {
  /**
   * Create or update a budget
   */
  async upsertBudget(userId, data) {
    const {
      category,
      amount,
      period = 'monthly',
      start_date,
      alert_threshold_80 = true,
      alert_threshold_90 = true,
      alert_threshold_100 = true
    } = data;

    const result = await query(
      `INSERT INTO budgets 
       (user_id, category, amount, period, start_date, alert_threshold_80, alert_threshold_90, alert_threshold_100)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, category, period)
       DO UPDATE SET
         amount = $3,
         alert_threshold_80 = $6,
         alert_threshold_90 = $7,
         alert_threshold_100 = $8,
         updated_at = NOW()
       RETURNING *`,
      [userId, category, amount, period, start_date || new Date(), alert_threshold_80, alert_threshold_90, alert_threshold_100]
    );

    await cacheClearPattern(`budgets:${userId}:*`);
    return result.rows[0];
  }

  /**
   * Get all budgets for user
   */
  async getBudgets(userId) {
    const cacheKey = `budgets:${userId}:all`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await query(
      `SELECT b.*, 
        COALESCE(spent.total, 0) as spent_amount,
        CASE WHEN b.amount > 0 THEN ROUND((COALESCE(spent.total, 0) / b.amount * 100)::numeric, 2) ELSE 0 END as percentage_used
       FROM budgets b
       LEFT JOIN (
         SELECT category, SUM(amount) as total
         FROM transactions
         WHERE user_id = $1 
           AND type = 'expense'
           AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
           AND transaction_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
         GROUP BY category
       ) spent ON b.category = spent.category
       WHERE b.user_id = $1 AND b.is_active = true
       ORDER BY percentage_used DESC`,
      [userId]
    );

    await cacheSet(cacheKey, result.rows, 60);
    return result.rows;
  }

  /**
   * Get budget for specific category
   */
  async getBudgetByCategory(userId, category) {
    const result = await query(
      `SELECT b.*, 
        COALESCE(spent.total, 0) as spent_amount
       FROM budgets b
       LEFT JOIN (
         SELECT SUM(amount) as total
         FROM transactions
         WHERE user_id = $1 
           AND category = $2
           AND type = 'expense'
           AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
       ) spent ON true
       WHERE b.user_id = $1 AND b.category = $2 AND b.is_active = true`,
      [userId, category]
    );
    return result.rows[0];
  }

  /**
   * Check if budget threshold is exceeded and create alert
   */
  async checkBudgetAlert(userId, category, newAmount) {
    const budget = await this.getBudgetByCategory(userId, category);
    if (!budget) return null;

    const totalSpent = parseFloat(budget.spent_amount) + parseFloat(newAmount);
    const percentageUsed = (totalSpent / parseFloat(budget.amount)) * 100;

    let threshold = null;
    let message = '';

    if (percentageUsed >= 100 && budget.alert_threshold_100) {
      threshold = 100;
      const overAmount = totalSpent - parseFloat(budget.amount);
      message = `❌ Budget exceeded! You're ${overAmount.toFixed(2)}₺ over your ${category} limit`;
    } else if (percentageUsed >= 90 && budget.alert_threshold_90) {
      threshold = 90;
      const remaining = parseFloat(budget.amount) - totalSpent;
      message = `🚨 90% of ${category} budget spent! Only ${remaining.toFixed(2)}₺ left`;
    } else if (percentageUsed >= 80 && budget.alert_threshold_80) {
      threshold = 80;
      message = `⚠️ You've used 80% of your ${category} budget (${totalSpent.toFixed(2)}₺ / ${budget.amount}₺)`;
    }

    if (threshold) {
      // Check if we already sent this alert today
      const existingAlert = await query(
        `SELECT id FROM budget_alerts 
         WHERE user_id = $1 AND budget_id = $2 AND threshold = $3
         AND created_at >= CURRENT_DATE`,
        [userId, budget.id, threshold]
      );

      if (existingAlert.rows.length === 0) {
        await query(
          `INSERT INTO budget_alerts 
           (user_id, budget_id, threshold, percentage_used, amount_spent, amount_limit, message)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, budget.id, threshold, percentageUsed, totalSpent, budget.amount, message]
        );

        logger.info({ userId, category, threshold, percentageUsed }, 'Budget alert created');

        return {
          type: 'budget_alert',
          threshold,
          category,
          percentageUsed: Math.round(percentageUsed),
          spent: totalSpent,
          limit: parseFloat(budget.amount),
          message
        };
      }
    }

    return null;
  }

  /**
   * Get unread budget alerts
   */
  async getUnreadAlerts(userId) {
    const result = await query(
      `SELECT ba.*, b.category
       FROM budget_alerts ba
       JOIN budgets b ON ba.budget_id = b.id
       WHERE ba.user_id = $1 AND ba.is_read = false
       ORDER BY ba.created_at DESC
       LIMIT 10`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Mark alerts as read
   */
  async markAlertsRead(userId, alertIds) {
    await query(
      `UPDATE budget_alerts SET is_read = true
       WHERE user_id = $1 AND id = ANY($2)`,
      [userId, alertIds]
    );
  }

  /**
   * Delete budget
   */
  async deleteBudget(userId, budgetId) {
    const result = await query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [budgetId, userId]
    );
    await cacheClearPattern(`budgets:${userId}:*`);
    return result.rows[0] ? true : false;
  }

  /**
   * Get budget progress for all categories
   */
  async getBudgetProgress(userId) {
    const budgets = await this.getBudgets(userId);
    
    return budgets.map(b => ({
      id: b.id,
      category: b.category,
      limit: parseFloat(b.amount),
      spent: parseFloat(b.spent_amount),
      remaining: Math.max(0, parseFloat(b.amount) - parseFloat(b.spent_amount)),
      percentageUsed: parseFloat(b.percentage_used),
      status: this.getBudgetStatus(parseFloat(b.percentage_used))
    }));
  }

  getBudgetStatus(percentage) {
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 90) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'healthy';
  }
}

module.exports = new BudgetService();
