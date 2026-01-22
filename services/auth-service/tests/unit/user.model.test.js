/**
 * User Model Unit Tests
 * Tests user database operations
 */

jest.mock('../../src/db/connection', () => ({
  query: jest.fn(),
  getClient: jest.fn()
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

const UserModel = require('../../src/models/user.model');
const { query } = require('../../src/db/connection');
const bcrypt = require('bcrypt');

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        first_name: 'Test'
      };
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const user = await UserModel.findByEmail('test@example.com');

      expect(user).toEqual(mockUser);
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
    });

    it('should return null if user not found', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const user = await UserModel.findByEmail('notfound@example.com');

      expect(user).toBeNull();
    });

    it('should normalize email to lowercase', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await UserModel.findByEmail('TEST@EXAMPLE.COM');

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const user = await UserModel.findById('123');

      expect(user).toEqual(mockUser);
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['123']
      );
    });

    it('should return null if user not found', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const user = await UserModel.findById('non-existent');

      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const mockCreatedUser = {
        id: '123',
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        role: 'user'
      };
      query.mockResolvedValueOnce({ rows: [mockCreatedUser] });

      const user = await UserModel.create({
        email: 'new@example.com',
        password: 'TestPass123!@#',
        firstName: 'New',
        lastName: 'User'
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('TestPass123!@#', expect.any(Number));
      expect(user).toEqual(mockCreatedUser);
    });

    it('should use default role if not specified', async () => {
      query.mockResolvedValueOnce({ rows: [{ id: '123', role: 'user' }] });

      await UserModel.create({
        email: 'new@example.com',
        password: 'TestPass123!@#'
      });

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['user'])
      );
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching password', async () => {
      bcrypt.compare.mockResolvedValueOnce(true);

      const result = await UserModel.verifyPassword('password', 'hashed');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed');
    });

    it('should return false for non-matching password', async () => {
      bcrypt.compare.mockResolvedValueOnce(false);

      const result = await UserModel.verifyPassword('wrong', 'hashed');

      expect(result).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login and reset failed attempts', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await UserModel.updateLastLogin('123');

      expect(query).toHaveBeenCalledWith(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP, failed_login_attempts = 0 WHERE id = $1',
        ['123']
      );
    });
  });

  describe('incrementFailedAttempts', () => {
    it('should increment failed login attempts', async () => {
      query.mockResolvedValueOnce({ rows: [{ failed_login_attempts: 3 }] });

      const count = await UserModel.incrementFailedAttempts('123');

      expect(count).toBe(3);
    });
  });

  describe('isAccountLocked', () => {
    it('should return true if account is locked', () => {
      const user = {
        locked_until: new Date(Date.now() + 30 * 60 * 1000) // 30 min in future
      };

      expect(UserModel.isAccountLocked(user)).toBe(true);
    });

    it('should return false if lock has expired', () => {
      const user = {
        locked_until: new Date(Date.now() - 1000) // 1 second ago
      };

      expect(UserModel.isAccountLocked(user)).toBe(false);
    });

    it('should return false if not locked', () => {
      const user = { locked_until: null };

      expect(UserModel.isAccountLocked(user)).toBe(false);
    });
  });

  describe('sanitizeUser', () => {
    it('should remove sensitive fields from user object', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        password_hash: 'secret',
        email_verification_token: 'token',
        password_reset_token: 'reset',
        password_reset_expires: new Date(),
        failed_login_attempts: 5,
        locked_until: new Date(),
        first_name: 'Test'
      };

      const sanitized = UserModel.sanitizeUser(user);

      expect(sanitized).not.toHaveProperty('password_hash');
      expect(sanitized).not.toHaveProperty('email_verification_token');
      expect(sanitized).not.toHaveProperty('password_reset_token');
      expect(sanitized).not.toHaveProperty('password_reset_expires');
      expect(sanitized).not.toHaveProperty('failed_login_attempts');
      expect(sanitized).not.toHaveProperty('locked_until');
      expect(sanitized).toHaveProperty('id');
      expect(sanitized).toHaveProperty('email');
      expect(sanitized).toHaveProperty('first_name');
    });

    it('should return null for null input', () => {
      expect(UserModel.sanitizeUser(null)).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update allowed fields', async () => {
      const updatedUser = {
        id: '123',
        first_name: 'Updated',
        last_name: 'Name'
      };
      query.mockResolvedValueOnce({ rows: [updatedUser] });

      const result = await UserModel.updateProfile('123', {
        firstName: 'Updated',
        lastName: 'Name'
      });

      expect(result).toEqual(updatedUser);
    });

    it('should throw error if no valid fields provided', async () => {
      await expect(UserModel.updateProfile('123', { invalidField: 'value' }))
        .rejects.toThrow('No valid fields to update');
    });
  });

  describe('changePassword', () => {
    it('should update password hash', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await UserModel.changePassword('123', 'NewPass123!@#');

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass123!@#', expect.any(Number));
      expect(query).toHaveBeenCalledWith(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        ['hashed_password', '123']
      );
    });
  });

  describe('logAudit', () => {
    it('should log audit entry', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await UserModel.logAudit({
        userId: '123',
        action: 'LOGIN',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        details: { success: true }
      });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO auth_audit_log'),
        expect.arrayContaining(['123', 'LOGIN', '127.0.0.1', 'Mozilla/5.0'])
      );
    });
  });
});
