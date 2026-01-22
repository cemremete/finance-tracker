const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const budgetService = require('../services/budgetService');

router.use(authenticate);

// GET /api/budgets - Get all budgets with spending
router.get('/', async (req, res, next) => {
  try {
    const budgets = await budgetService.getBudgets(req.user.id);
    res.json(budgets);
  } catch (err) {
    next(err);
  }
});

// GET /api/budgets/progress - Get budget progress for dashboard
router.get('/progress', async (req, res, next) => {
  try {
    const progress = await budgetService.getBudgetProgress(req.user.id);
    res.json(progress);
  } catch (err) {
    next(err);
  }
});

// GET /api/budgets/alerts - Get unread budget alerts
router.get('/alerts', async (req, res, next) => {
  try {
    const alerts = await budgetService.getUnreadAlerts(req.user.id);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

// POST /api/budgets/alerts/read - Mark alerts as read
router.post('/alerts/read', async (req, res, next) => {
  try {
    const { alertIds } = req.body;
    await budgetService.markAlertsRead(req.user.id, alertIds);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/budgets/:category - Get budget for specific category
router.get('/:category', async (req, res, next) => {
  try {
    const budget = await budgetService.getBudgetByCategory(req.user.id, req.params.category);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json(budget);
  } catch (err) {
    next(err);
  }
});

// POST /api/budgets - Create or update budget
router.post('/', validate(schemas.createBudget), async (req, res, next) => {
  try {
    const budget = await budgetService.upsertBudget(req.user.id, req.body);
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await budgetService.deleteBudget(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
