const { query, getClient } = require('../db/connection');
const { cacheGet, cacheSet, cacheClearPattern } = require('../db/redis');
const { differenceInDays, differenceInMonths, addMonths, format } = require('date-fns');
const logger = require('../utils/logger');

class GoalService {
  /**
   * Create a new savings goal
   */
  async createGoal(userId, data) {
    const {
      name,
      target_amount,
      current_amount = 0,
      currency = 'TRY',
      deadline,
      priority = 'medium',
      auto_round_enabled = false,
      icon,
      color
    } = data;

    const result = await query(
      `INSERT INTO goals 
       (user_id, name, target_amount, current_amount, currency, deadline, priority, auto_round_enabled, icon, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, name, target_amount, current_amount, currency, deadline, priority, auto_round_enabled, icon, color]
    );

    await cacheClearPattern(`goals:${userId}:*`);
    return this.enrichGoal(result.rows[0]);
  }

  /**
   * Get all goals for user
   */
  async getGoals(userId, status = 'active') {
    const cacheKey = `goals:${userId}:${status}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    let whereClause = 'WHERE user_id = $1';
    if (status !== 'all') {
      whereClause += ` AND status = '${status}'`;
    }

    const result = await query(
      `SELECT g.*, 
        COALESCE(c.total_contributions, 0) as total_contributions,
        COALESCE(c.contribution_count, 0) as contribution_count
       FROM goals g
       LEFT JOIN (
         SELECT goal_id, SUM(amount) as total_contributions, COUNT(*) as contribution_count
         FROM goal_contributions
         GROUP BY goal_id
       ) c ON g.id = c.goal_id
       ${whereClause}
       ORDER BY 
         CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         deadline ASC NULLS LAST`,
      [userId]
    );

    const goals = result.rows.map(g => this.enrichGoal(g));
    await cacheSet(cacheKey, goals, 120);
    return goals;
  }

  /**
   * Enrich goal with calculated fields
   */
  enrichGoal(goal) {
    const current = parseFloat(goal.current_amount);
    const target = parseFloat(goal.target_amount);
    const percentage = target > 0 ? (current / target) * 100 : 0;
    
    let estimatedCompletion = null;
    let monthsRemaining = null;
    let onTrack = true;
    let behindBy = 0;

    if (goal.deadline) {
      const deadline = new Date(goal.deadline);
      const now = new Date();
      const daysRemaining = differenceInDays(deadline, now);
      monthsRemaining = differenceInMonths(deadline, now);

      // Calculate if on track
      const totalDays = differenceInDays(deadline, new Date(goal.created_at));
      const daysPassed = totalDays - daysRemaining;
      const expectedProgress = totalDays > 0 ? (daysPassed / totalDays) * target : 0;
      
      if (current < expectedProgress) {
        onTrack = false;
        behindBy = Math.round(expectedProgress - current);
      }

      // Estimate completion based on current rate
      if (goal.contribution_count > 0 && goal.total_contributions > 0) {
        const avgContribution = parseFloat(goal.total_contributions) / parseInt(goal.contribution_count);
        const remaining = target - current;
        const contributionsNeeded = remaining / avgContribution;
        estimatedCompletion = addMonths(now, Math.ceil(contributionsNeeded / 2)); // Assuming ~2 contributions/month
      }
    }

    return {
      ...goal,
      current_amount: current,
      target_amount: target,
      percentage: Math.round(percentage * 10) / 10,
      remaining: Math.max(0, target - current),
      monthsRemaining,
      estimatedCompletion,
      onTrack,
      behindBy,
      status_display: this.getGoalStatus(percentage, goal.status)
    };
  }

  getGoalStatus(percentage, status) {
    if (status === 'completed') return { label: 'Completed', color: '#27AE60', icon: '🎉' };
    if (status === 'cancelled') return { label: 'Cancelled', color: '#95A5A6', icon: '❌' };
    if (percentage >= 100) return { label: 'Goal Reached!', color: '#27AE60', icon: '🎯' };
    if (percentage >= 75) return { label: 'Almost There', color: '#F1C40F', icon: '🔥' };
    if (percentage >= 50) return { label: 'Halfway', color: '#3498DB', icon: '💪' };
    if (percentage >= 25) return { label: 'Good Start', color: '#9B59B6', icon: '🚀' };
    return { label: 'Just Started', color: '#E67E22', icon: '🌱' };
  }

  /**
   * Get single goal
   */
  async getGoal(userId, goalId) {
    const result = await query(
      `SELECT g.*, 
        COALESCE(c.total_contributions, 0) as total_contributions,
        COALESCE(c.contribution_count, 0) as contribution_count
       FROM goals g
       LEFT JOIN (
         SELECT goal_id, SUM(amount) as total_contributions, COUNT(*) as contribution_count
         FROM goal_contributions
         GROUP BY goal_id
       ) c ON g.id = c.goal_id
       WHERE g.id = $1 AND g.user_id = $2`,
      [goalId, userId]
    );
    return result.rows[0] ? this.enrichGoal(result.rows[0]) : null;
  }

  /**
   * Update goal
   */
  async updateGoal(userId, goalId, data) {
    const fields = [];
    const values = [goalId, userId];
    let paramIndex = 3;

    const allowedFields = ['name', 'target_amount', 'deadline', 'priority', 'auto_round_enabled', 'status', 'icon', 'color'];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex++}`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return null;

    const result = await query(
      `UPDATE goals SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      values
    );

    await cacheClearPattern(`goals:${userId}:*`);
    return result.rows[0] ? this.enrichGoal(result.rows[0]) : null;
  }

  /**
   * Add contribution to goal
   */
  async addContribution(userId, goalId, data) {
    const { amount, source = 'manual', transaction_id, notes } = data;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Add contribution
      const contribResult = await client.query(
        `INSERT INTO goal_contributions (goal_id, amount, source, transaction_id, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [goalId, amount, source, transaction_id, notes]
      );

      // Update goal current amount
      const goalResult = await client.query(
        `UPDATE goals SET 
          current_amount = current_amount + $1,
          status = CASE WHEN current_amount + $1 >= target_amount THEN 'completed' ELSE status END,
          updated_at = NOW()
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [amount, goalId, userId]
      );

      await client.query('COMMIT');

      await cacheClearPattern(`goals:${userId}:*`);

      const goal = this.enrichGoal(goalResult.rows[0]);
      const contribution = contribResult.rows[0];

      // Check for milestones
      const milestone = this.checkMilestone(goal);

      return { goal, contribution, milestone };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Check if a milestone was reached
   */
  checkMilestone(goal) {
    const milestones = [25, 50, 75, 100];
    const percentage = goal.percentage;

    for (const m of milestones) {
      // Check if we just crossed this milestone
      const previousAmount = goal.current_amount - (goal.total_contributions / goal.contribution_count || 0);
      const previousPercentage = (previousAmount / goal.target_amount) * 100;
      
      if (previousPercentage < m && percentage >= m) {
        return {
          percentage: m,
          message: m === 100 
            ? `🎉 Congratulations! You've reached your "${goal.name}" goal!`
            : `🎯 ${m}% milestone reached for "${goal.name}"!`,
          type: m === 100 ? 'goal_completed' : 'milestone_reached'
        };
      }
    }
    return null;
  }

  /**
   * Get contribution history for a goal
   */
  async getContributions(userId, goalId, limit = 20) {
    // Verify goal belongs to user
    const goal = await this.getGoal(userId, goalId);
    if (!goal) return [];

    const result = await query(
      `SELECT * FROM goal_contributions
       WHERE goal_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [goalId, limit]
    );

    return result.rows;
  }

  /**
   * Process auto-rounding for a transaction
   */
  async processAutoRound(userId, transactionAmount) {
    // Find goals with auto-round enabled
    const goals = await query(
      `SELECT * FROM goals
       WHERE user_id = $1 AND auto_round_enabled = true AND status = 'active'
       ORDER BY priority ASC
       LIMIT 1`,
      [userId]
    );

    if (goals.rows.length === 0) return null;

    const goal = goals.rows[0];
    const roundedAmount = Math.ceil(transactionAmount / 10) * 10;
    const roundUpAmount = roundedAmount - transactionAmount;

    if (roundUpAmount > 0) {
      const result = await this.addContribution(userId, goal.id, {
        amount: roundUpAmount,
        source: 'auto_round',
        notes: `Auto-rounded from ${transactionAmount}₺ transaction`
      });

      logger.info({ userId, goalId: goal.id, amount: roundUpAmount }, 'Auto-round contribution added');
      return result;
    }

    return null;
  }

  /**
   * Get goal summary for dashboard
   */
  async getGoalSummary(userId) {
    const goals = await this.getGoals(userId, 'all');
    
    const active = goals.filter(g => g.status === 'active');
    const completed = goals.filter(g => g.status === 'completed');
    
    const totalTarget = active.reduce((sum, g) => sum + g.target_amount, 0);
    const totalCurrent = active.reduce((sum, g) => sum + g.current_amount, 0);

    // Get this month's auto-round savings
    const autoRoundResult = await query(
      `SELECT COALESCE(SUM(gc.amount), 0) as total
       FROM goal_contributions gc
       JOIN goals g ON gc.goal_id = g.id
       WHERE g.user_id = $1 
         AND gc.source = 'auto_round'
         AND gc.created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );

    return {
      activeGoals: active.length,
      completedGoals: completed.length,
      totalTarget,
      totalCurrent,
      overallProgress: totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0,
      autoRoundThisMonth: parseFloat(autoRoundResult.rows[0]?.total || 0),
      topGoals: active.slice(0, 3)
    };
  }

  /**
   * Delete goal
   */
  async deleteGoal(userId, goalId) {
    const result = await query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [goalId, userId]
    );
    await cacheClearPattern(`goals:${userId}:*`);
    return result.rows[0] ? true : false;
  }
}

module.exports = new GoalService();
