/**
 * Jest Configuration for Auth Service
 */

module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/db/migrate.js',
    '!src/db/rollback.js',
    '!src/db/seed.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true
};
