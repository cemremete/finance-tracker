// error handling middleware

const logger = require('../utils/logger');

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function notFoundHandler(req, res, next) {
  const error = new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`);
  next(error);
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // axios errors from proxied requests
  if (err.response) {
    statusCode = err.response.status;
    message = err.response.data?.error || err.response.data?.message || message;
    details = err.response.data?.details || null;
  }

  // circuit breaker errors
  if (err.code === 'EOPENBREAKER') {
    statusCode = 503;
    message = 'Service temporarily unavailable';
  }

  // timeout errors
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    statusCode = 504;
    message = 'Service timeout';
  }

  // connection refused
  if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable';
  }

  // log it
  const logData = {
    message: err.message,
    statusCode,
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl
  };

  if (statusCode >= 500) {
    logData.stack = err.stack;
    logger.error(logData);
  } else {
    logger.warn(logData);
  }

  const response = {
    error: message,
    statusCode,
    correlationId: req.correlationId
  };

  if (process.env.NODE_ENV !== 'production') {
    if (details) response.details = details;
    if (statusCode >= 500) response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler
};
