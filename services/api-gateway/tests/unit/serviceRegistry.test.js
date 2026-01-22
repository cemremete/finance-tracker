// service registry tests

jest.mock('axios');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const axios = require('axios');
const { 
  checkServiceHealth, 
  getServiceUrl, 
  getServicesStatus 
} = require('../../src/services/serviceRegistry');

describe('Service Registry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkServiceHealth', () => {
    it('should return healthy for successful health check', async () => {
      axios.get.mockResolvedValue({ status: 200 });

      const status = await checkServiceHealth('auth');

      expect(status).toBe('healthy');
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({ timeout: 5000 })
      );
    });

    it('should return unhealthy for failed health check', async () => {
      axios.get.mockRejectedValue(new Error('Connection refused'));

      const status = await checkServiceHealth('auth');

      expect(status).toBe('unhealthy');
    });

    it('should return null for unknown service', async () => {
      const status = await checkServiceHealth('unknown-service');

      expect(status).toBeNull();
    });
  });

  describe('getServiceUrl', () => {
    it('should return url for known service', () => {
      const url = getServiceUrl('auth');

      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
    });

    it('should throw for unknown service', () => {
      expect(() => getServiceUrl('unknown')).toThrow('Unknown service');
    });
  });

  describe('getServicesStatus', () => {
    it('should return status for all services', () => {
      const status = getServicesStatus();

      expect(status).toHaveProperty('auth');
      expect(status).toHaveProperty('transaction');
      expect(status.auth).toHaveProperty('name');
      expect(status.auth).toHaveProperty('url');
      expect(status.auth).toHaveProperty('status');
    });
  });
});
