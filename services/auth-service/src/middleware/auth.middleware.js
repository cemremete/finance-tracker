// auth middleware - checks jwt tokens and handles rbac

const AuthService = require('../services/auth.service');
const logger = require('../utils/logger');

// pull token from "Bearer xxx" header
function extractToken(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

// main auth middleware - verifies token and adds user to req
async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }
    
    // Verify token
    const decoded = await AuthService.verifyAccessToken(token);
    
    // Attach user info and token to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    req.token = token;
    
    next();
  } catch (error) {
    logger.debug('Authentication failed:', error.message);
    
    return res.status(error.statusCode || 401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
}

// optional auth - doesnt fail if no token, just doesnt set req.user
async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = await AuthService.verifyAccessToken(token);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      req.token = token;
    }
    
    next();
  } catch (error) {
    // just continue without user, its optional
    next();
  }
}

// role check - pass in allowed roles
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role}`);
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
}

// shortcuts for common role checks
const adminOnly = authorize('admin');
const premiumOrAdmin = authorize('premium', 'admin');

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  adminOnly,
  premiumOrAdmin,
  extractToken
};
