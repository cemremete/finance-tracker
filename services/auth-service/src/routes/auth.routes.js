// auth routes

const express = require('express');
const router = express.Router();

const AuthService = require('../services/auth.service');
const UserModel = require('../models/user.model');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  registerValidation,
  loginValidation,
  refreshValidation,
  updateProfileValidation,
  changePasswordValidation
} = require('../middleware/validate');

// helper to get ip/user agent for audit logs
function getRequestInfo(req) {
  return {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  };
}

// POST /api/auth/register
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  const result = await AuthService.register(
    { email, password, firstName, lastName },
    getRequestInfo(req)
  );
  
  res.status(201).json({
    message: 'User registered successfully',
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn
  });
}));

// POST /api/auth/login
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const result = await AuthService.login(
    email,
    password,
    getRequestInfo(req)
  );
  
  res.json({
    message: 'Login successful',
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn
  });
}));

// POST /api/auth/refresh
router.post('/refresh', refreshValidation, asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  const tokens = await AuthService.refresh(refreshToken);
  
  res.json({
    message: 'Token refreshed successfully',
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn
  });
}));

// POST /api/auth/logout
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  await AuthService.logout(
    req.user.id,
    req.token,
    refreshToken,
    getRequestInfo(req)
  );
  
  res.json({
    message: 'Logged out successfully'
  });
}));

// POST /api/auth/logout-all - logs out everywhere
router.post('/logout-all', authenticate, asyncHandler(async (req, res) => {
  await AuthService.logoutAll(
    req.user.id,
    req.token,
    getRequestInfo(req)
  );
  
  res.json({
    message: 'Logged out from all devices successfully'
  });
}));

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await AuthService.getProfile(req.user.id);
  
  res.json({
    user
  });
}));

// PUT /api/auth/me
router.put('/me', authenticate, updateProfileValidation, asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;
  
  const user = await UserModel.updateProfile(req.user.id, {
    firstName,
    lastName
  });
  
  await UserModel.logAudit({
    userId: req.user.id,
    action: 'PROFILE_UPDATE',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    details: { firstName, lastName }
  });
  
  res.json({
    message: 'Profile updated successfully',
    user: UserModel.sanitizeUser(user)
  });
}));

// POST /api/auth/change-password
router.post('/change-password', authenticate, changePasswordValidation, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await UserModel.findById(req.user.id);
  
  // check current password first
  const isValid = await UserModel.verifyPassword(currentPassword, user.password_hash);
  if (!isValid) {
    return res.status(401).json({
      error: 'Current password is incorrect'
    });
  }
  
  await UserModel.changePassword(req.user.id, newPassword);
  
  // logout everywhere after password change for security
  await AuthService.logoutAll(
    req.user.id,
    req.token,
    getRequestInfo(req)
  );
  
  await UserModel.logAudit({
    userId: req.user.id,
    action: 'PASSWORD_CHANGE',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.json({
    message: 'Password changed successfully. Please login again.'
  });
}));

module.exports = router;
