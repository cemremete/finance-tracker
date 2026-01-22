const logger = require('../utils/logger');

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

function errorHandler(err, req, res, next) {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Handle known errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    });
  }

  // Handle validation errors (Joi)
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details.map(d => d.message)
    });
  }

  // Handle database errors
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Resource already exists'
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Referenced resource not found'
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error'
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
}

module.exports = { ApiError, errorHandler, notFoundHandler };
