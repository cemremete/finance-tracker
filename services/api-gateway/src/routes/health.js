// health check routes

const express = require('express');
const router = express.Router();
const { getServicesStatus, checkAllServices } = require('../services/serviceRegistry');
const { getAllStats } = require('../services/circuitBreaker');
const { getRedis } = require('../utils/redis');
const logger = require('../utils/logger');

// basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// liveness probe - just checks if process is running
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// readiness probe - checks dependencies
router.get('/ready', async (req, res) => {
  const checks = {
    redis: false
  };

  // check redis
  try {
    const redis = getRedis();
    const result = await redis.ping();
    checks.redis = result === 'PONG';
  } catch (error) {
    logger.warn('Redis health check failed:', error.message);
  }

  const isReady = checks.redis;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString()
  });
});

// detailed health with all services
router.get('/details', async (req, res) => {
  // trigger fresh health check
  await checkAllServices();
  
  const servicesStatus = getServicesStatus();
  const circuitBreakers = getAllStats();

  // check redis
  let redisStatus = 'unknown';
  try {
    const redis = getRedis();
    const start = Date.now();
    await redis.ping();
    redisStatus = `healthy (${Date.now() - start}ms)`;
  } catch (error) {
    redisStatus = `unhealthy: ${error.message}`;
  }

  res.json({
    status: 'healthy',
    service: 'api-gateway',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dependencies: {
      redis: redisStatus,
      services: servicesStatus
    },
    circuitBreakers
  });
});

module.exports = router;
