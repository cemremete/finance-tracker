// error handling middleware

const logger = require('../utils/logger');

// custom error class with status code
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 handler
function notFoundHandler(req, res, next) {
  const error = new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`);
  next(error);
}

// main error handler - catches everything
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;
  
  // handle different error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.details || err.message;
  }
  
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }
  
  // postgres errors - these codes are kinda cryptic but whatever
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Resource already exists';
  }
  
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced resource not found';
  }
  
  // log it
  if (statusCode >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    });
  } else {
    logger.warn({
      message: err.message,
      statusCode,
      method: req.method,
      url: req.originalUrl
    });
  }
  
  const response = {
    error: message,
    statusCode
  };
  
  // show more info in dev
  if (process.env.NODE_ENV !== 'production') {
    if (details) {
      response.details = details;
    }
    if (statusCode >= 500) {
      response.stack = err.stack;
    }
  }
  
  res.status(statusCode).json(response);
}

// wraps async handlers so we dont need try/catch everywhere
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler
};
