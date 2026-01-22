const { query } = require('../db/connection');
const { cacheGet, cacheSet } = require('../db/redis');
const { startOfMonth, endOfMonth, subMonths, format } = require('date-fns');
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Get spending trends comparing current vs previous periods
   */
  async getSpendingTrends(userId, period = 'monthly') {
    const cacheKey = `trends:${userId}:${period}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const currentStart = startOfMonth(now);
    const currentEnd = endOfMonth(now);
    const previousStart = startOfMonth(subMonths(now, 1));
    const previousEnd = endOfMonth(subMonths(now, 1));

    // Get current month totals by category
    const currentResult = await query(
      `SELECT 
        category,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income
       FROM transactions
       WHERE user_id = $1 
         AND transaction_date >= $2 
         AND transaction_date <= $3
       GROUP BY category`,
      [userId, currentStart, currentEnd]
    );

    // Get previous month totals by category
    const previousResult = await query(
      `SELECT 
        category,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income
       FROM transactions
       WHERE user_id = $1 
         AND transaction_date >= $2 
         AND transaction_date <= $3
       GROUP BY category`,
      [userId, previousStart, previousEnd]
    );

    // Calculate totals
    const currentTotals = this.calculateTotals(currentResult.rows);
    const previousTotals = this.calculateTotals(previousResult.rows);

    // Build category comparison
    const categoryComparison = this.buildCategoryComparison(
      currentResult.rows,
      previousResult.rows
    );

    const trends = {
      period: {
        current: { start: currentStart, end: currentEnd, label: format(now, 'MMMM yyyy') },
        previous: { start: previousStart, end: previousEnd, label: format(subMonths(now, 1), 'MMMM yyyy') }
      },
      summary: {
        currentExpenses: currentTotals.expenses,
        previousExpenses: previousTotals.expenses,
        expenseChange: this.calculateChange(currentTotals.expenses, previousTotals.expenses),
        currentIncome: currentTotals.income,
        previousIncome: previousTotals.income,
        incomeChange: this.calculateChange(currentTotals.income, previousTotals.income),
        currentSavings: currentTotals.income - currentTotals.expenses,
        previousSavings: previousTotals.income - previousTotals.expenses
      },
      categoryBreakdown: categoryComparison
    };

    await cacheSet(cacheKey, trends, 300);
    return trends;
  }

  calculateTotals(rows) {
    return rows.reduce(
      (acc, row) => ({
        expenses: acc.expenses + parseFloat(row.expenses || 0),
        income: acc.income + parseFloat(row.income || 0)
      }),
      { expenses: 0, income: 0 }
    );
  }

  calculateChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / previous) * 100;
    return Math.round(change * 10) / 10;
  }

  buildCategoryComparison(currentRows, previousRows) {
    const categories = new Set([
      ...currentRows.map(r => r.category),
      ...previousRows.map(r => r.category)
    ]);

    const comparison = [];
    for (const category of categories) {
      const current = currentRows.find(r => r.category === category);
      const previous = previousRows.find(r => r.category === category);

      const currentAmount = parseFloat(current?.expenses || 0);
      const previousAmount = parseFloat(previous?.expenses || 0);

      comparison.push({
        category,
        current: currentAmount,
        previous: previousAmount,
        change: this.calculateChange(currentAmount, previousAmount),
        trend: currentAmount > previousAmount ? 'up' : currentAmount < previousAmount ? 'down' : 'stable'
      });
    }

    return comparison.sort((a, b) => b.current - a.current);
  }

  /**
   * Get historical spending data for charts
   */
  async getSpendingHistory(userId, months = 6) {
    const cacheKey = `history:${userId}:${months}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await query(
      `SELECT 
        DATE_TRUNC('month', transaction_date) as month,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income
       FROM transactions
       WHERE user_id = $1
         AND transaction_date >= NOW() - INTERVAL '${months} months'
       GROUP BY DATE_TRUNC('month', transaction_date)
       ORDER BY month ASC`,
      [userId]
    );

    const history = result.rows.map(row => ({
      month: format(new Date(row.month), 'MMM yyyy'),
      expenses: parseFloat(row.expenses),
      income: parseFloat(row.income),
      savings: parseFloat(row.income) - parseFloat(row.expenses)
    }));

    await cacheSet(cacheKey, history, 300);
    return history;
  }

  /**
   * Calculate Financial Health Score (0-100)
   */
  async calculateHealthScore(userId) {
    const cacheKey = `healthscore:${userId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    // Get current month data
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Get income and expenses
    const totalsResult = await query(
      `SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
       FROM transactions
       WHERE user_id = $1 
         AND transaction_date >= $2 
         AND transaction_date <= $3`,
      [userId, monthStart, monthEnd]
    );

    const income = parseFloat(totalsResult.rows[0]?.income || 0);
    const expenses = parseFloat(totalsResult.rows[0]?.expenses || 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // Get budget compliance
    const budgetResult = await query(
      `SELECT 
        COUNT(*) as total_budgets,
        SUM(CASE WHEN spent.total <= b.amount THEN 1 ELSE 0 END) as within_budget
       FROM budgets b
       LEFT JOIN (
         SELECT category, SUM(amount) as total
         FROM transactions
         WHERE user_id = $1 AND type = 'expense'
           AND transaction_date >= $2
         GROUP BY category
       ) spent ON b.category = spent.category
       WHERE b.user_id = $1 AND b.is_active = true`,
      [userId, monthStart]
    );

    const totalBudgets = parseInt(budgetResult.rows[0]?.total_budgets || 0);
    const withinBudget = parseInt(budgetResult.rows[0]?.within_budget || 0);
    const budgetCompliance = totalBudgets > 0 ? (withinBudget / totalBudgets) * 100 : 100;

    // Get recurring expenses
    const recurringResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM subscriptions
       WHERE user_id = $1 AND status = 'active' AND frequency = 'monthly'`,
      [userId]
    );
    const recurringExpenses = parseFloat(recurringResult.rows[0]?.total || 0);
    const recurringRatio = income > 0 ? (recurringExpenses / income) * 100 : 0;

    // Calculate scores
    let incomeExpenseScore = 0;
    if (savingsRate >= 20) incomeExpenseScore = 40;
    else if (savingsRate >= 10) incomeExpenseScore = 30;
    else if (savingsRate > 0) incomeExpenseScore = 20;
    else incomeExpenseScore = 0;

    const budgetScore = Math.round(budgetCompliance * 0.3);
    const savingsScore = Math.min(20, Math.round(savingsRate));
    
    let recurringScore = 10;
    if (recurringRatio > 30) {
      recurringScore = Math.max(0, Math.round((30 - recurringRatio) / 3));
    }

    const totalScore = incomeExpenseScore + budgetScore + savingsScore + recurringScore;

    // Generate suggestions
    const suggestions = [];
    if (savingsRate < 20) {
      const targetSavings = income * 0.2;
      const neededReduction = targetSavings - savings;
      if (neededReduction > 0) {
        suggestions.push(`Reduce spending by ${neededReduction.toFixed(0)}₺/month to reach 20% savings rate`);
      }
    }
    if (budgetCompliance < 100) {
      suggestions.push('Stay within all budget limits to improve your score');
    }
    if (recurringRatio > 30) {
      suggestions.push('Review subscriptions - recurring expenses are over 30% of income');
    }

    const healthScore = {
      score: Math.min(100, Math.max(0, totalScore)),
      breakdown: {
        incomeExpenseRatio: { score: incomeExpenseScore, max: 40 },
        budgetDiscipline: { score: budgetScore, max: 30 },
        savingsRate: { score: savingsScore, max: 20 },
        recurringManagement: { score: recurringScore, max: 10 }
      },
      metrics: {
        income,
        expenses,
        savings,
        savingsRate: Math.round(savingsRate * 10) / 10,
        budgetCompliance: Math.round(budgetCompliance),
        recurringExpenses,
        recurringRatio: Math.round(recurringRatio * 10) / 10
      },
      status: this.getHealthStatus(totalScore),
      suggestions
    };

    await cacheSet(cacheKey, healthScore, 300);
    return healthScore;
  }

  getHealthStatus(score) {
    if (score >= 80) return { label: 'Excellent', color: '#27AE60' };
    if (score >= 60) return { label: 'Good', color: '#F1C40F' };
    if (score >= 40) return { label: 'Fair', color: '#E67E22' };
    return { label: 'Needs Improvement', color: '#E74C3C' };
  }

  /**
   * Get health score history
   */
  async getHealthScoreHistory(userId, months = 6) {
    // This would require storing historical scores
    // For now, return current score only
    const current = await this.calculateHealthScore(userId);
    return [{ month: format(new Date(), 'MMM yyyy'), score: current.score }];
  }
}

module.exports = new AnalyticsService();
