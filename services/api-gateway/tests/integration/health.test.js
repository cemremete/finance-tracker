// health routes integration tests

const request = require('supertest');

// mock redis before requiring app
jest.mock('../../src/utils/redis', () => ({
  connectRedis: jest.fn().mockResolvedValue({}),
  getRedis: jest.fn().mockReturnValue({
    ping: jest.fn().mockResolvedValue('PONG')
  }),
  closeRedis: jest.fn().mockResolvedValue()
}));

jest.mock('../../src/services/serviceRegistry', () => ({
  startHealthChecks: jest.fn(),
  stopHealthChecks: jest.fn(),
  getServicesStatus: jest.fn().mockReturnValue({
    auth: { name: 'auth-service', status: 'healthy' }
  }),
  checkAllServices: jest.fn().mockResolvedValue({})
}));

// need to require app after mocks
const express = require('express');
const healthRoutes = require('../../src/routes/health');

const app = express();
app.use('/health', healthRoutes);

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('api-gateway');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /health/live', () => {
    it('should return alive status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready when redis is connected', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
      expect(response.body.checks.redis).toBe(true);
    });
  });

  describe('GET /health/details', () => {
    it('should return detailed health info', async () => {
      const response = await request(app)
        .get('/health/details')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.dependencies).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });
});
