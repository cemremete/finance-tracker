/**
 * Auth Service Unit Tests
 * Tests authentication business logic
 */

const jwt = require('jsonwebtoken');

// Mock dependencies before requiring the service
jest.mock('../../src/db/connection', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  connectDatabase: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../src/db/redis', () => ({
  connectRedis: jest.fn().mockResolvedValue(true),
  storeRefreshToken: jest.fn().mockResolvedValue(true),
  validateRefreshToken: jest.fn().mockResolvedValue(true),
  revokeRefreshToken: jest.fn().mockResolvedValue(true),
  revokeAllUserTokens: jest.fn().mockResolvedValue(true),
  blacklistToken: jest.fn().mockResolvedValue(true),
  isTokenBlacklisted: jest.fn().mockResolvedValue(false)
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

const AuthService = require('../../src/services/auth.service');
const UserModel = require('../../src/models/user.model');
const { query } = require('../../src/db/connection');
const redis = require('../../src/db/redis');
const bcrypt = require('bcrypt');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
      is_active: true,
      is_email_verified: false,
      created_at: new Date()
    };

    it('should register a new user successfully', async () => {
      // Mock: user doesn't exist
      query.mockResolvedValueOnce({ rows: [] });
      // Mock: user creation
      query.mockResolvedValueOnce({ rows: [mockUser] });
      // Mock: audit log
      query.mockResolvedValueOnce({ rows: [] });

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'TestPass123!@#',
        firstName: 'Test',
        lastName: 'User'
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error if user already exists', async () => {
      // Mock: user exists
      query.mockResolvedValueOnce({ rows: [mockUser] });

      await expect(AuthService.register({
        email: 'test@example.com',
        password: 'TestPass123!@#'
      })).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
      is_active: true,
      is_email_verified: true,
      failed_login_attempts: 0,
      locked_until: null
    };

    it('should login user successfully with valid credentials', async () => {
      // Mock: find user
      query.mockResolvedValueOnce({ rows: [mockUser] });
      // Mock: update last login
      query.mockResolvedValueOnce({ rows: [] });
      // Mock: audit log
      query.mockResolvedValueOnce({ rows: [] });

      const result = await AuthService.login('test@example.com', 'TestPass123!@#');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('should throw error for invalid email', async () => {
      // Mock: user not found
      query.mockResolvedValueOnce({ rows: [] });

      await expect(AuthService.login('wrong@example.com', 'TestPass123!@#'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      // Mock: find user
      query.mockResolvedValueOnce({ rows: [mockUser] });
      // Mock: password comparison fails
      bcrypt.compare.mockResolvedValueOnce(false);
      // Mock: increment failed attempts
      query.mockResolvedValueOnce({ rows: [{ failed_login_attempts: 1 }] });
      // Mock: audit log
      query.mockResolvedValueOnce({ rows: [] });

      await expect(AuthService.login('test@example.com', 'WrongPass123!@#'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw error for inactive account', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      query.mockResolvedValueOnce({ rows: [inactiveUser] });

      await expect(AuthService.login('test@example.com', 'TestPass123!@#'))
        .rejects.toThrow('Account has been deactivated');
    });

    it('should throw error for locked account', async () => {
      const lockedUser = { 
        ...mockUser, 
        locked_until: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
      };
      query.mockResolvedValueOnce({ rows: [lockedUser] });

      await expect(AuthService.login('test@example.com', 'TestPass123!@#'))
        .rejects.toThrow('Account is temporarily locked');
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'user',
        is_active: true
      };

      // Create a valid refresh token
      const refreshToken = jwt.sign(
        { userId: mockUser.id },
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key',
        { expiresIn: '1h' }
      );

      // Mock: validate refresh token in Redis
      redis.validateRefreshToken.mockResolvedValueOnce(true);
      // Mock: find user
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await AuthService.refresh(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(redis.revokeRefreshToken).toHaveBeenCalled();
      expect(redis.storeRefreshToken).toHaveBeenCalled();
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(AuthService.refresh('invalid-token'))
        .rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw error for revoked refresh token', async () => {
      const refreshToken = jwt.sign(
        { userId: '123' },
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key',
        { expiresIn: '1h' }
      );

      redis.validateRefreshToken.mockResolvedValueOnce(false);

      await expect(AuthService.refresh(refreshToken))
        .rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const accessToken = 'valid-access-token';
      const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key',
        { expiresIn: '1h' }
      );

      // Mock: audit log
      query.mockResolvedValueOnce({ rows: [] });

      await AuthService.logout(userId, accessToken, refreshToken);

      expect(redis.blacklistToken).toHaveBeenCalledWith(accessToken, expect.any(Number));
      expect(redis.revokeRefreshToken).toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', async () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'user'
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET || 'test-access-secret-key',
        { expiresIn: '15m' }
      );

      redis.isTokenBlacklisted.mockResolvedValueOnce(false);

      const decoded = await AuthService.verifyAccessToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw error for blacklisted token', async () => {
      const token = jwt.sign(
        { userId: '123' },
        process.env.JWT_ACCESS_SECRET || 'test-access-secret-key',
        { expiresIn: '15m' }
      );

      redis.isTokenBlacklisted.mockResolvedValueOnce(true);

      await expect(AuthService.verifyAccessToken(token))
        .rejects.toThrow('Token has been revoked');
    });

    it('should throw error for expired token', async () => {
      const token = jwt.sign(
        { userId: '123' },
        process.env.JWT_ACCESS_SECRET || 'test-access-secret-key',
        { expiresIn: '-1s' } // Already expired
      );

      redis.isTokenBlacklisted.mockResolvedValueOnce(false);

      await expect(AuthService.verifyAccessToken(token))
        .rejects.toThrow('Token has expired');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        is_active: true,
        password_hash: 'should_be_removed'
      };

      query.mockResolvedValueOnce({ rows: [mockUser] });

      const profile = await AuthService.getProfile(mockUser.id);

      expect(profile.email).toBe('test@example.com');
      expect(profile).not.toHaveProperty('password_hash');
    });

    it('should throw error for non-existent user', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await expect(AuthService.getProfile('non-existent-id'))
        .rejects.toThrow('User not found');
    });
  });
});
