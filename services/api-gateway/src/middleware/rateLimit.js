// rate limiting middleware with redis backend

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const config = require('../config');
const logger = require('../utils/logger');
const { getRedis } = require('../utils/redis');

// create rate limiter with redis store
function createRateLimiter(options = {}) {
  const defaultOptions = {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    },
    keyGenerator: (req) => {
      // use user id if authenticated, otherwise ip
      if (req.user) {
        return `user:${req.user.id}`;
      }
      return `ip:${req.ip}`;
    },
    skip: (req) => {
      // skip health checks
      return req.path === '/health' || req.path === '/health/live';
    },
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for ${req.ip}`);
      res.status(429).json(options.message);
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // try to use redis store, fallback to memory
  try {
    const redis = getRedis();
    mergedOptions.store = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: 'rl:'
    });
    logger.info('Rate limiter using Redis store');
  } catch (error) {
    logger.warn('Redis not available, using memory store for rate limiting');
  }

  return rateLimit(mergedOptions);
}

// stricter limit for auth endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min
  message: {
    error: 'Too many login attempts',
    message: 'Please try again in 15 minutes'
  }
});

// general api limiter
const apiLimiter = createRateLimiter();

// very strict for password reset etc
const strictLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    error: 'Too many attempts',
    message: 'Please try again in an hour'
  }
});

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  strictLimiter
};
