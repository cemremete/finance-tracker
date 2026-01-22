const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    req.body = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    req.query = value;
    next();
  };
};

// Validation schemas
const schemas = {
  createTransaction: Joi.object({
    amount: Joi.number().positive().required(),
    type: Joi.string().valid('income', 'expense', 'transfer').required(),
    category: Joi.string().max(50),
    merchant_name: Joi.string().max(255),
    description: Joi.string().max(500),
    transaction_date: Joi.date().iso(),
    is_recurring: Joi.boolean(),
    recurring_id: Joi.string().uuid(),
    metadata: Joi.object()
  }),

  updateTransaction: Joi.object({
    amount: Joi.number().positive(),
    type: Joi.string().valid('income', 'expense', 'transfer'),
    category: Joi.string().max(50),
    merchant_name: Joi.string().max(255),
    description: Joi.string().max(500),
    transaction_date: Joi.date().iso(),
    is_recurring: Joi.boolean(),
    metadata: Joi.object()
  }),

  transactionQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    category: Joi.string(),
    type: Joi.string().valid('income', 'expense', 'transfer'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    search: Joi.string().max(100),
    sortBy: Joi.string().valid('transaction_date', 'amount', 'category'),
    sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc')
  }),

  createBudget: Joi.object({
    category: Joi.string().max(50).required(),
    amount: Joi.number().positive().required(),
    period: Joi.string().valid('weekly', 'monthly', 'yearly').default('monthly'),
    start_date: Joi.date().iso(),
    alert_threshold_80: Joi.boolean().default(true),
    alert_threshold_90: Joi.boolean().default(true),
    alert_threshold_100: Joi.boolean().default(true)
  }),

  createSubscription: Joi.object({
    name: Joi.string().max(255).required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).default('TRY'),
    frequency: Joi.string().valid('weekly', 'monthly', 'yearly').required(),
    category: Joi.string().max(50).default('entertainment'),
    next_payment_date: Joi.date().iso().required(),
    reminder_days: Joi.number().integer().min(0).max(30).default(3),
    notes: Joi.string().max(500)
  }),

  updateSubscription: Joi.object({
    name: Joi.string().max(255),
    amount: Joi.number().positive(),
    frequency: Joi.string().valid('weekly', 'monthly', 'yearly'),
    category: Joi.string().max(50),
    next_payment_date: Joi.date().iso(),
    status: Joi.string().valid('active', 'paused', 'cancelled'),
    reminder_days: Joi.number().integer().min(0).max(30),
    notes: Joi.string().max(500)
  }),

  createGoal: Joi.object({
    name: Joi.string().max(255).required(),
    target_amount: Joi.number().positive().required(),
    current_amount: Joi.number().min(0).default(0),
    currency: Joi.string().length(3).default('TRY'),
    deadline: Joi.date().iso(),
    priority: Joi.string().valid('high', 'medium', 'low').default('medium'),
    auto_round_enabled: Joi.boolean().default(false),
    icon: Joi.string().max(50),
    color: Joi.string().max(7)
  }),

  updateGoal: Joi.object({
    name: Joi.string().max(255),
    target_amount: Joi.number().positive(),
    deadline: Joi.date().iso(),
    priority: Joi.string().valid('high', 'medium', 'low'),
    auto_round_enabled: Joi.boolean(),
    status: Joi.string().valid('active', 'completed', 'cancelled'),
    icon: Joi.string().max(50),
    color: Joi.string().max(7)
  }),

  addContribution: Joi.object({
    amount: Joi.number().positive().required(),
    source: Joi.string().valid('manual', 'auto_round', 'scheduled', 'bonus').default('manual'),
    transaction_id: Joi.string().uuid(),
    notes: Joi.string().max(500)
  })
};

module.exports = { validate, validateQuery, schemas };
