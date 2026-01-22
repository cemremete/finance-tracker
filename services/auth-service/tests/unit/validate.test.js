/**
 * Validation Middleware Unit Tests
 * Tests request validation rules
 */

const { validationResult } = require('express-validator');

// Create mock request/response
const mockRequest = (body = {}) => ({
  body
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

// Helper to run validation
async function runValidation(validations, req) {
  for (const validation of validations) {
    if (typeof validation === 'function') {
      await validation(req, {}, () => {});
    } else {
      await validation.run(req);
    }
  }
  return validationResult(req);
}

const {
  registerValidation,
  loginValidation,
  refreshValidation,
  changePasswordValidation
} = require('../../src/middleware/validate');

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerValidation', () => {
    // Get only the validation rules (exclude the error handler)
    const validationRules = registerValidation.slice(0, -1);

    it('should pass with valid registration data', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'TestPass123!@#',
        firstName: 'Test',
        lastName: 'User'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid email', async () => {
      const req = mockRequest({
        email: 'invalid-email',
        password: 'TestPass123!@#'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(false);
      expect(result.array().some(e => e.path === 'email')).toBe(true);
    });

    it('should fail with weak password', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'weak'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(false);
      expect(result.array().some(e => e.path === 'password')).toBe(true);
    });

    it('should fail with password missing uppercase', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'testpass123!@#'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with password missing special character', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'TestPass123'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(false);
    });

    it('should pass without optional firstName/lastName', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'TestPass123!@#'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid firstName characters', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'TestPass123!@#',
        firstName: 'Test123'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(false);
      expect(result.array().some(e => e.path === 'firstName')).toBe(true);
    });
  });

  describe('loginValidation', () => {
    const validationRules = loginValidation.slice(0, -1);

    it('should pass with valid login data', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'anypassword'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with missing email', async () => {
      const req = mockRequest({
        password: 'anypassword'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with missing password', async () => {
      const req = mockRequest({
        email: 'test@example.com'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('refreshValidation', () => {
    const validationRules = refreshValidation.slice(0, -1);

    it('should pass with valid refresh token', async () => {
      const req = mockRequest({
        refreshToken: 'valid-refresh-token'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with missing refresh token', async () => {
      const req = mockRequest({});

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('changePasswordValidation', () => {
    const validationRules = changePasswordValidation.slice(0, -1);

    it('should pass with valid password change data', async () => {
      const req = mockRequest({
        currentPassword: 'OldPass123!@#',
        newPassword: 'NewPass456!@#'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail if new password same as current', async () => {
      const req = mockRequest({
        currentPassword: 'SamePass123!@#',
        newPassword: 'SamePass123!@#'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with weak new password', async () => {
      const req = mockRequest({
        currentPassword: 'OldPass123!@#',
        newPassword: 'weak'
      });

      const result = await runValidation(validationRules, req);

      expect(result.isEmpty()).toBe(false);
    });
  });
});
