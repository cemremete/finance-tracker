const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, validateQuery, schemas } = require('../middleware/validate');
const transactionService = require('../services/transactionService');
const categorizationService = require('../services/categorizationService');

// All routes require authentication
router.use(authenticate);

// GET /api/transactions - List transactions with filters
router.get('/', validateQuery(schemas.transactionQuery), async (req, res, next) => {
  try {
    const result = await transactionService.getTransactions(req.user.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/summary - Get category summary
router.get('/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().setDate(1)).toISOString();
    const end = endDate || new Date().toISOString();
    
    const summary = await transactionService.getCategorySummary(req.user.id, start, end);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/monthly - Get monthly totals
router.get('/monthly', async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const totals = await transactionService.getMonthlyTotals(req.user.id, months);
    res.json(totals);
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/categories - Get available categories
router.get('/categories', (req, res) => {
  const categories = categorizationService.getCategories();
  res.json(categories);
});

// POST /api/transactions/categorize - Preview auto-categorization
router.post('/categorize', async (req, res, next) => {
  try {
    const { merchant_name } = req.body;
    const result = await categorizationService.categorize(merchant_name, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/:id - Get single transaction
router.get('/:id', async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransaction(req.user.id, req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions - Create transaction
router.post('/', validate(schemas.createTransaction), async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(req.user.id, req.body);
    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
});

// PUT /api/transactions/:id - Update transaction
router.put('/:id', validate(schemas.updateTransaction), async (req, res, next) => {
  try {
    const transaction = await transactionService.updateTransaction(
      req.user.id,
      req.params.id,
      req.body
    );
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await transactionService.deleteTransaction(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
