const { query, getClient } = require('../db/connection');
const { cacheGet, cacheSet, cacheDelete, cacheClearPattern } = require('../db/redis');
const categorizationService = require('./categorizationService');
const budgetService = require('./budgetService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class TransactionService {
  /**
   * Create a new transaction with auto-categorization
   */
  async createTransaction(userId, data) {
    const {
      amount,
      type,
      category: userCategory,
      merchant_name,
      description,
      transaction_date,
      is_recurring,
      recurring_id,
      metadata
    } = data;

    // Auto-categorize if no category provided
    let category = userCategory;
    let autoCategorized = false;

    if (!category || category === 'uncategorized') {
      const result = await categorizationService.categorize(
        merchant_name || description,
        userId
      );
      category = result.category;
      autoCategorized = result.method !== 'default';
    }

    const result = await query(
      `INSERT INTO transactions 
       (user_id, amount, type, category, merchant_name, description, 
        transaction_date, is_recurring, recurring_id, auto_categorized, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userId,
        amount,
        type,
        category,
        merchant_name,
        description,
        transaction_date || new Date(),
        is_recurring || false,
        recurring_id,
        autoCategorized,
        metadata || {}
      ]
    );

    const transaction = result.rows[0];

    // Clear user's transaction cache
    await cacheClearPattern(`transactions:${userId}:*`);

    // Check budget alerts for expense transactions
    if (type === 'expense') {
      await budgetService.checkBudgetAlert(userId, category, amount);
    }

    logger.info({ transactionId: transaction.id, userId, category, autoCategorized }, 'Transaction created');

    return transaction;
  }

  /**
   * Get transactions with pagination and filters
   */
  async getTransactions(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      category,
      type,
      startDate,
      endDate,
      search,
      sortBy = 'transaction_date',
      sortOrder = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    const cacheKey = `transactions:${userId}:${JSON.stringify(options)}`;

    // Check cache
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    // Build query
    let whereClause = 'WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (category) {
      whereClause += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (type) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (startDate) {
      whereClause += ` AND transaction_date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND transaction_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    if (search) {
      whereClause += ` AND (merchant_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Validate sort column
    const validSortColumns = ['transaction_date', 'amount', 'category', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'transaction_date';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM transactions ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get transactions
    params.push(limit, offset);
    const result = await query(
      `SELECT * FROM transactions ${whereClause}
       ORDER BY ${sortColumn} ${order}
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    const response = {
      transactions: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    // Cache for 1 minute
    await cacheSet(cacheKey, response, 60);

    return response;
  }

  /**
   * Get single transaction
   */
  async getTransaction(userId, transactionId) {
    const result = await query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [transactionId, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update transaction
   */
  async updateTransaction(userId, transactionId, data) {
    const {
      amount,
      type,
      category,
      merchant_name,
      description,
      transaction_date,
      is_recurring,
      metadata
    } = data;

    // Check if user is overriding auto-category
    const existing = await this.getTransaction(userId, transactionId);
    const userCategoryOverride = existing?.auto_categorized && category !== existing.category;

    // If user corrected category, save for learning
    if (userCategoryOverride && merchant_name) {
      await categorizationService.saveUserCorrection(userId, merchant_name, category);
    }

    const result = await query(
      `UPDATE transactions SET
        amount = COALESCE($3, amount),
        type = COALESCE($4, type),
        category = COALESCE($5, category),
        merchant_name = COALESCE($6, merchant_name),
        description = COALESCE($7, description),
        transaction_date = COALESCE($8, transaction_date),
        is_recurring = COALESCE($9, is_recurring),
        metadata = COALESCE($10, metadata),
        user_category_override = $11,
        updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        transactionId,
        userId,
        amount,
        type,
        category,
        merchant_name,
        description,
        transaction_date,
        is_recurring,
        metadata,
        userCategoryOverride
      ]
    );

    await cacheClearPattern(`transactions:${userId}:*`);

    return result.rows[0];
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(userId, transactionId) {
    const result = await query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [transactionId, userId]
    );

    await cacheClearPattern(`transactions:${userId}:*`);

    return result.rows[0] ? true : false;
  }

  /**
   * Get transaction summary by category
   */
  async getCategorySummary(userId, startDate, endDate) {
    const cacheKey = `summary:${userId}:${startDate}:${endDate}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await query(
      `SELECT 
        category,
        type,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
       FROM transactions
       WHERE user_id = $1 
         AND transaction_date >= $2 
         AND transaction_date <= $3
       GROUP BY category, type
       ORDER BY total_amount DESC`,
      [userId, startDate, endDate]
    );

    await cacheSet(cacheKey, result.rows, 300);
    return result.rows;
  }

  /**
   * Get monthly totals for trends
   */
  async getMonthlyTotals(userId, months = 6) {
    const result = await query(
      `SELECT 
        DATE_TRUNC('month', transaction_date) as month,
        type,
        SUM(amount) as total
       FROM transactions
       WHERE user_id = $1
         AND transaction_date >= NOW() - INTERVAL '${months} months'
       GROUP BY DATE_TRUNC('month', transaction_date), type
       ORDER BY month DESC`,
      [userId]
    );

    return result.rows;
  }
}

module.exports = new TransactionService();
