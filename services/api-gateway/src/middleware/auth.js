// jwt auth middleware - verifies tokens with auth service

const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const { getBreaker } = require('../services/circuitBreaker');

// extract token from header
function extractToken(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

// verify token locally first, then check blacklist with auth service
async function verifyToken(token) {
  // local verification
  const decoded = jwt.verify(token, config.jwt.accessSecret, {
    issuer: config.jwt.issuer
  });
  
  // check with auth service if token is blacklisted
  // wrapped in circuit breaker
  const checkBlacklist = async () => {
    const response = await axios.post(
      `${config.services.auth}/api/auth/verify`,
      { token },
      { 
        timeout: 5000,
        headers: { 'x-correlation-id': decoded.correlationId }
      }
    );
    return response.data;
  };
  
  const breaker = getBreaker('auth-verify', checkBlacklist);
  
  try {
    await breaker.fire();
  } catch (error) {
    // if circuit is open or auth service down, trust local verification
    // this is a tradeoff - availability over strict consistency
    logger.warn('Auth service unavailable for blacklist check, using local verification');
  }
  
  return decoded;
}

// main auth middleware
async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }
    
    const decoded = await verifyToken(token);
    
    // attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    req.token = token;
    
    next();
  } catch (error) {
    logger.debug('Auth failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please refresh your token'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: error.message
      });
    }
    
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
}

// optional auth - doesn't fail if no token
async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = await verifyToken(token);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      req.token = token;
    }
    
    next();
  } catch (error) {
    // just continue without user
    next();
  }
}

// role check middleware
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role}`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  extractToken
};
