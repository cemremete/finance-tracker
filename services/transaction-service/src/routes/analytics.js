const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

router.use(authenticate);

// GET /api/analytics/trends - Get spending trends
router.get('/trends', async (req, res, next) => {
  try {
    const period = req.query.period || 'monthly';
    const trends = await analyticsService.getSpendingTrends(req.user.id, period);
    res.json(trends);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/history - Get spending history for charts
router.get('/history', async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const history = await analyticsService.getSpendingHistory(req.user.id, months);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/health-score - Get financial health score
router.get('/health-score', async (req, res, next) => {
  try {
    const healthScore = await analyticsService.calculateHealthScore(req.user.id);
    res.json(healthScore);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/health-score/history - Get health score history
router.get('/health-score/history', async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const history = await analyticsService.getHealthScoreHistory(req.user.id, months);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
