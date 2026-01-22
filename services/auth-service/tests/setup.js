/**
 * Jest Test Setup
 * Configures test environment and global utilities
 */

require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  /**
   * Generate a random email for testing
   * @returns {string} Random email
   */
  randomEmail: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
  
  /**
   * Generate a valid password for testing
   * @returns {string} Valid password
   */
  validPassword: () => 'TestPass123!@#',
  
  /**
   * Wait for a specified duration
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Clean up after all tests
afterAll(async () => {
  // Give time for connections to close
  await new Promise(resolve => setTimeout(resolve, 500));
});
