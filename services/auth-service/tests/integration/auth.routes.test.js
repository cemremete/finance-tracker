/**
 * Auth Routes Integration Tests
 * Tests API endpoints with mocked database
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock database and redis before requiring app
jest.mock('../../src/db/connection', () => ({
  connectDatabase: jest.fn().mockResolvedValue(true),
  query: jest.fn(),
  getClient: jest.fn(),
  getPool: jest.fn().mockReturnValue({
    query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] })
  })
}));

jest.mock('../../src/db/redis', () => ({
  connectRedis: jest.fn().mockResolvedValue(true),
  getRedis: jest.fn().mockReturnValue({
    ping: jest.fn().mockResolvedValue('PONG')
  }),
  storeRefreshToken: jest.fn().mockResolvedValue(true),
  validateRefreshToken: jest.fn().mockResolvedValue(true),
  revokeRefreshToken: jest.fn().mockResolvedValue(true),
  revokeAllUserTokens: jest.fn().mockResolvedValue(true),
  blacklistToken: jest.fn().mockResolvedValue(true),
  isTokenBlacklisted: jest.fn().mockResolvedValue(false)
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

const { query } = require('../../src/db/connection');
const redis = require('../../src/db/redis');
const bcrypt = require('bcrypt');

// Create test app
const authRoutes = require('../../src/routes/auth.routes');
const healthRoutes = require('../../src/routes/health.routes');
const { errorHandler, notFoundHandler } = require('../../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'newuser@example.com',
        first_name: 'New',
        last_name: 'User',
        role: 'user',
        is_active: true,
        is_email_verified: false,
        created_at: new Date().toISOString()
      };

      // Mock: user doesn't exist
      query.mockResolvedValueOnce({ rows: [] });
      // Mock: create user
      query.mockResolvedValueOnce({ rows: [mockUser] });
      // Mock: audit log
      query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'TestPass123!@#',
          firstName: 'New',
          lastName: 'User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    it('should return 409 if user already exists', async () => {
      query.mockResolvedValueOnce({ rows: [{ id: '123', email: 'existing@example.com' }] });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'TestPass123!@#'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPass123!@#'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      password_hash: '$2b$12$hashedpassword',
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
      is_active: true,
      is_email_verified: true,
      failed_login_attempts: 0,
      locked_until: null
    };

    it('should login successfully with valid credentials', async () => {
      // Mock: find user
      query.mockResolvedValueOnce({ rows: [mockUser] });
      // Mock: update last login
      query.mockResolvedValueOnce({ rows: [] });
      // Mock: audit log
      query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid credentials', async () => {
      query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(false);
      query.mockResolvedValueOnce({ rows: [{ failed_login_attempts: 1 }] });
      query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!@#'
        });

      expect(response.status).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123!@#'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'user',
        is_active: true
      };

      const refreshToken = jwt.sign(
        { userId: mockUser.id },
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key',
        { expiresIn: '1h' }
      );

      redis.validateRefreshToken.mockResolvedValueOnce(true);
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        is_active: true
      };

      const accessToken = jwt.sign(
        { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
        process.env.JWT_ACCESS_SECRET || 'test-access-secret-key',
        { expiresIn: '15m' }
      );

      redis.isTokenBlacklisted.mockResolvedValueOnce(false);
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'user'
      };

      const accessToken = jwt.sign(
        { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
        process.env.JWT_ACCESS_SECRET || 'test-access-secret-key',
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: mockUser.id },
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key',
        { expiresIn: '1h' }
      );

      redis.isTokenBlacklisted.mockResolvedValueOnce(false);
      query.mockResolvedValueOnce({ rows: [] }); // audit log

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
      expect(redis.blacklistToken).toHaveBeenCalled();
    });
  });
});

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('GET /health/live', () => {
    it('should return alive status', async () => {
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('alive');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status when all services are up', async () => {
      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });
  });
});
