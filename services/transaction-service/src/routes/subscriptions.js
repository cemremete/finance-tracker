const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const subscriptionService = require('../services/subscriptionService');

router.use(authenticate);

// GET /api/subscriptions - Get all subscriptions
router.get('/', async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const subscriptions = await subscriptionService.getSubscriptions(req.user.id, includeInactive);
    res.json(subscriptions);
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions/summary - Get subscription summary
router.get('/summary', async (req, res, next) => {
  try {
    const summary = await subscriptionService.getSubscriptionSummary(req.user.id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions/detected - Detect recurring expenses
router.get('/detected', async (req, res, next) => {
  try {
    const detected = await subscriptionService.detectRecurringExpenses(req.user.id);
    res.json(detected);
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions/recommendations - Get optimization recommendations
router.get('/recommendations', async (req, res, next) => {
  try {
    const recommendations = await subscriptionService.getRecommendations(req.user.id);
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions/reminders - Get upcoming payment reminders
router.get('/reminders', async (req, res, next) => {
  try {
    const reminders = await subscriptionService.getUpcomingReminders(req.user.id);
    res.json(reminders);
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions - Create subscription
router.post('/', validate(schemas.createSubscription), async (req, res, next) => {
  try {
    const subscription = await subscriptionService.createSubscription(req.user.id, req.body);
    res.status(201).json(subscription);
  } catch (err) {
    next(err);
  }
});

// PUT /api/subscriptions/:id - Update subscription
router.put('/:id', validate(schemas.updateSubscription), async (req, res, next) => {
  try {
    const subscription = await subscriptionService.updateSubscription(
      req.user.id,
      req.params.id,
      req.body
    );
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json(subscription);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subscriptions/:id - Delete subscription
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await subscriptionService.deleteSubscription(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
