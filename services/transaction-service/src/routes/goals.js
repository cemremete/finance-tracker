const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const goalService = require('../services/goalService');

router.use(authenticate);

// GET /api/goals - Get all goals
router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status || 'active';
    const goals = await goalService.getGoals(req.user.id, status);
    res.json(goals);
  } catch (err) {
    next(err);
  }
});

// GET /api/goals/summary - Get goals summary for dashboard
router.get('/summary', async (req, res, next) => {
  try {
    const summary = await goalService.getGoalSummary(req.user.id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// GET /api/goals/:id - Get single goal
router.get('/:id', async (req, res, next) => {
  try {
    const goal = await goalService.getGoal(req.user.id, req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

// GET /api/goals/:id/contributions - Get contribution history
router.get('/:id/contributions', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const contributions = await goalService.getContributions(req.user.id, req.params.id, limit);
    res.json(contributions);
  } catch (err) {
    next(err);
  }
});

// POST /api/goals - Create goal
router.post('/', validate(schemas.createGoal), async (req, res, next) => {
  try {
    const goal = await goalService.createGoal(req.user.id, req.body);
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
});

// POST /api/goals/:id/contribute - Add contribution
router.post('/:id/contribute', validate(schemas.addContribution), async (req, res, next) => {
  try {
    const result = await goalService.addContribution(req.user.id, req.params.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// PUT /api/goals/:id - Update goal
router.put('/:id', validate(schemas.updateGoal), async (req, res, next) => {
  try {
    const goal = await goalService.updateGoal(req.user.id, req.params.id, req.body);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/goals/:id - Delete goal
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await goalService.deleteGoal(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
