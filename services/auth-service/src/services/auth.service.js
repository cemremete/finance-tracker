// auth service - handles all the token/login logic

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const UserModel = require('../models/user.model');
const {
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  blacklistToken,
  isTokenBlacklisted
} = require('../db/redis');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

// generate access token
function generateAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    issuer: config.jwt.issuer
  });
}

// generate refresh token - longer lived
function generateRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: config.jwt.issuer
  });
}

// converts stuff like "15m" or "7d" to seconds
// probably theres a library for this but whatever
function parseExpirationToSeconds(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 min
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 900;
  }
}

// creates both access and refresh tokens for a user
async function generateTokenPair(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };
  
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user.id });
  
  // store in redis so we can revoke later
  const refreshExpiresIn = parseExpirationToSeconds(config.jwt.refreshExpiresIn);
  await storeRefreshToken(user.id, refreshToken, refreshExpiresIn);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: parseExpirationToSeconds(config.jwt.accessExpiresIn)
  };
}

// register new user
async function register(userData, requestInfo = {}) {
  const { email, password, firstName, lastName } = userData;
  
  // check if email is taken
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 409;
    throw error;
  }
  
  const user = await UserModel.create({
    email,
    password,
    firstName,
    lastName
  });
  
  const tokens = await generateTokenPair(user);
  
  // audit log for security
  await UserModel.logAudit({
    userId: user.id,
    action: 'REGISTER',
    ipAddress: requestInfo.ip,
    userAgent: requestInfo.userAgent,
    details: { email: user.email }
  });
  
  logger.info(`User registered: ${user.email}`);
  
  return {
    user: UserModel.sanitizeUser(user),
    ...tokens
  };
}

// login - this got kinda long but theres a lot of edge cases to handle
async function login(email, password, requestInfo = {}) {
  const user = await UserModel.findByEmail(email);
  
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }
  
  // check if they got locked out
  if (UserModel.isAccountLocked(user)) {
    const error = new Error('Account is temporarily locked. Please try again later.');
    error.statusCode = 423;
    throw error;
  }
  
  if (!user.is_active) {
    const error = new Error('Account has been deactivated');
    error.statusCode = 403;
    throw error;
  }
  
  const isValidPassword = await UserModel.verifyPassword(password, user.password_hash);
  
  if (!isValidPassword) {
    // track failed attempts
    const failedAttempts = await UserModel.incrementFailedAttempts(user.id);
    
    // lock em out after 5 tries
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      await UserModel.lockAccount(user.id, LOCK_DURATION_MINUTES);
      
      await UserModel.logAudit({
        userId: user.id,
        action: 'ACCOUNT_LOCKED',
        ipAddress: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        details: { reason: 'Too many failed login attempts' }
      });
      
      const error = new Error('Account locked due to too many failed attempts');
      error.statusCode = 423;
      throw error;
    }
    
    await UserModel.logAudit({
      userId: user.id,
      action: 'LOGIN_FAILED',
      ipAddress: requestInfo.ip,
      userAgent: requestInfo.userAgent,
      details: { failedAttempts }
    });
    
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }
  
  await UserModel.updateLastLogin(user.id);
  const tokens = await generateTokenPair(user);
  
  await UserModel.logAudit({
    userId: user.id,
    action: 'LOGIN',
    ipAddress: requestInfo.ip,
    userAgent: requestInfo.userAgent
  });
  
  logger.info(`User logged in: ${user.email}`);
  
  return {
    user: UserModel.sanitizeUser(user),
    ...tokens
  };
}

// refresh tokens - rotates the refresh token for security
async function refresh(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    
    // make sure its still valid in redis
    const isValid = await validateRefreshToken(decoded.userId, refreshToken);
    if (!isValid) {
      const error = new Error('Invalid refresh token');
      error.statusCode = 401;
      throw error;
    }
    
    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.is_active) {
      const error = new Error('User not found or inactive');
      error.statusCode = 401;
      throw error;
    }
    
    // revoke old one, issue new one
    await revokeRefreshToken(decoded.userId, refreshToken);
    const tokens = await generateTokenPair(user);
    
    logger.info(`Tokens refreshed for user: ${user.email}`);
    return tokens;
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      const authError = new Error('Invalid or expired refresh token');
      authError.statusCode = 401;
      throw authError;
    }
    throw error;
  }
}

// logout single session
async function logout(userId, accessToken, refreshToken, requestInfo = {}) {
  // blacklist the access token so it cant be used anymore
  const accessExpiresIn = parseExpirationToSeconds(config.jwt.accessExpiresIn);
  await blacklistToken(accessToken, accessExpiresIn);
  
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      await revokeRefreshToken(decoded.userId, refreshToken);
    } catch (err) {
      // dont care if refresh token is invalid on logout
      // console.log('refresh token invalid on logout, whatever');
    }
  }
  
  await UserModel.logAudit({
    userId,
    action: 'LOGOUT',
    ipAddress: requestInfo.ip,
    userAgent: requestInfo.userAgent
  });
  
  logger.info(`User logged out: ${userId}`);
}

// logout from everywhere - nuclear option
async function logoutAll(userId, accessToken, requestInfo = {}) {
  const accessExpiresIn = parseExpirationToSeconds(config.jwt.accessExpiresIn);
  await blacklistToken(accessToken, accessExpiresIn);
  
  // kill all refresh tokens for this user
  await revokeAllUserTokens(userId);
  
  await UserModel.logAudit({
    userId,
    action: 'LOGOUT_ALL',
    ipAddress: requestInfo.ip,
    userAgent: requestInfo.userAgent
  });
  
  logger.info(`User logged out from all devices: ${userId}`);
}

// verify access token - used by auth middleware
async function verifyAccessToken(token) {
  // check blacklist first
  const isBlacklisted = await isTokenBlacklisted(token);
  if (isBlacklisted) {
    const error = new Error('Token has been revoked');
    error.statusCode = 401;
    throw error;
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const authError = new Error('Token has expired');
      authError.statusCode = 401;
      throw authError;
    }
    const authError = new Error('Invalid token');
    authError.statusCode = 401;
    throw authError;
  }
}

// get user profile
async function getProfile(userId) {
  const user = await UserModel.findById(userId);
  
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  
  return UserModel.sanitizeUser(user);
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  verifyAccessToken,
  getProfile,
  generateTokenPair
};
