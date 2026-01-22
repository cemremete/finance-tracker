// auth middleware tests

const jwt = require('jsonwebtoken');

// mock dependencies
jest.mock('../../src/config', () => ({
  jwt: {
    accessSecret: 'test-secret',
    issuer: 'test-issuer'
  },
  services: {
    auth: 'http://localhost:3001'
  },
  circuitBreaker: {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000
  }
}));

jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

jest.mock('axios');

const { authenticate, optionalAuth, authorize, extractToken } = require('../../src/middleware/auth');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      correlationId: 'test-correlation-id'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('extractToken', () => {
    it('should return null if no authorization header', () => {
      const token = extractToken(mockReq);
      expect(token).toBeNull();
    });

    it('should return null if header is not Bearer format', () => {
      mockReq.headers.authorization = 'Basic abc123';
      const token = extractToken(mockReq);
      expect(token).toBeNull();
    });

    it('should extract token from Bearer header', () => {
      mockReq.headers.authorization = 'Bearer mytoken123';
      const token = extractToken(mockReq);
      expect(token).toBe('mytoken123');
    });
  });

  describe('authenticate', () => {
    it('should return 401 if no token provided', async () => {
      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'No token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: '123', email: 'test@test.com', role: 'user' },
        'test-secret',
        { expiresIn: '-1h', issuer: 'test-issuer' }
      );
      mockReq.headers.authorization = `Bearer ${expiredToken}`;

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token expired'
        })
      );
    });

    it('should return 401 for invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token.here';

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should attach user to request for valid token', async () => {
      const validToken = jwt.sign(
        { userId: '123', email: 'test@test.com', role: 'user' },
        'test-secret',
        { expiresIn: '1h', issuer: 'test-issuer' }
      );
      mockReq.headers.authorization = `Bearer ${validToken}`;

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual({
        id: '123',
        email: 'test@test.com',
        role: 'user'
      });
      expect(mockReq.token).toBe(validToken);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should continue without user if no token', async () => {
      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should attach user if valid token', async () => {
      const validToken = jwt.sign(
        { userId: '456', email: 'optional@test.com', role: 'premium' },
        'test-secret',
        { expiresIn: '1h', issuer: 'test-issuer' }
      );
      mockReq.headers.authorization = `Bearer ${validToken}`;

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual({
        id: '456',
        email: 'optional@test.com',
        role: 'premium'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user if invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token';

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should return 401 if no user', () => {
      const middleware = authorize('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if user role not allowed', () => {
      mockReq.user = { id: '123', role: 'user' };
      const middleware = authorize('admin', 'premium');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next if user role is allowed', () => {
      mockReq.user = { id: '123', role: 'admin' };
      const middleware = authorize('admin', 'premium');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
