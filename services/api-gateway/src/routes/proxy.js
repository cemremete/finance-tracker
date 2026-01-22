// proxy routes - forwards requests to backend services

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const router = express.Router();
const config = require('../config');
const logger = require('../utils/logger');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');
const { authLimiter, apiLimiter } = require('../middleware/rateLimit');
const { getBreaker } = require('../services/circuitBreaker');
const { ApiError } = require('../middleware/errorHandler');

// helper to create proxy with circuit breaker
function createServiceProxy(serviceName, serviceUrl, options = {}) {
  return createProxyMiddleware({
    target: serviceUrl,
    changeOrigin: true,
    pathRewrite: options.pathRewrite || {},
    timeout: config.circuitBreaker.timeout,
    proxyTimeout: config.circuitBreaker.timeout,
    onProxyReq: (proxyReq, req) => {
      // forward correlation id
      if (req.correlationId) {
        proxyReq.setHeader('x-correlation-id', req.correlationId);
      }
      // forward user info if authenticated
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-email', req.user.email);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
      // forward original ip
      proxyReq.setHeader('x-forwarded-for', req.ip);
      
      logger.debug(`Proxying ${req.method} ${req.originalUrl} to ${serviceName}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // add service header for debugging
      proxyRes.headers['x-served-by'] = serviceName;
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${serviceName}:`, err.message);
      
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Service unavailable',
          message: `${serviceName} is currently unavailable`,
          correlationId: req.correlationId
        });
      }
    }
  });
}

// ============================================
// Auth Service Routes (public + protected)
// ============================================

// public auth routes - with rate limiting
router.use('/auth/register', authLimiter);
router.use('/auth/login', authLimiter);
router.use('/auth/refresh', apiLimiter);

// proxy all auth routes
router.use('/auth', createServiceProxy('auth-service', config.services.auth, {
  pathRewrite: { '^/api/auth': '/api/auth' }
}));

// ============================================
// Transaction Service Routes (protected)
// ============================================

// all transaction routes require auth
router.use('/transactions', authenticate, apiLimiter);

router.use('/transactions', createServiceProxy('transaction-service', config.services.transaction, {
  pathRewrite: { '^/api/transactions': '/api/transactions' }
}));

// ============================================
// Budget Service Routes (protected)
// ============================================

router.use('/budgets', authenticate, apiLimiter);

router.use('/budgets', createServiceProxy('budget-service', config.services.budget, {
  pathRewrite: { '^/api/budgets': '/api/budgets' }
}));

// ============================================
// Analytics Service Routes (protected)
// ============================================

router.use('/analytics', authenticate, apiLimiter);

router.use('/analytics', createServiceProxy('analytics-service', config.services.analytics, {
  pathRewrite: { '^/api/analytics': '/api/analytics' }
}));

// ============================================
// Notification Service Routes (protected)
// ============================================

router.use('/notifications', authenticate, apiLimiter);

router.use('/notifications', createServiceProxy('notification-service', config.services.notification, {
  pathRewrite: { '^/api/notifications': '/api/notifications' }
}));

// ============================================
// Admin Routes (admin only)
// ============================================

router.use('/admin', authenticate, authorize('admin'), apiLimiter);

// admin can access all services
router.use('/admin/users', createServiceProxy('auth-service', config.services.auth, {
  pathRewrite: { '^/api/admin/users': '/api/admin/users' }
}));

module.exports = router;
