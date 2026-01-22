// health check routes for k8s probes

const express = require('express');
const router = express.Router();

const { getPool } = require('../db/connection');
const { getRedis } = require('../db/redis');
const logger = require('../utils/logger');

// basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
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

// readiness probe - checks db and redis connections
router.get('/ready', async (req, res) => {
  const checks = {
    database: false,
    redis: false
  };
  
  try {
    const pool = getPool();
    const dbResult = await pool.query('SELECT 1');
    checks.database = dbResult.rows.length > 0;
  } catch (error) {
    logger.error('Database health check failed:', error.message);
  }
  
  try {
    const redis = getRedis();
    const redisResult = await redis.ping();
    checks.redis = redisResult === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed:', error.message);
  }
  
  const isReady = checks.database && checks.redis;
  
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString()
  });
});

// detailed health info - useful for debugging
router.get('/details', async (req, res) => {
  const checks = {
    database: { status: 'unknown', latency: null },
    redis: { status: 'unknown', latency: null }
  };
  
  // postgres check with latency
  try {
    const pool = getPool();
    const start = Date.now();
    await pool.query('SELECT 1');
    checks.database = {
      status: 'healthy',
      latency: `${Date.now() - start}ms`
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error.message
    };
  }
  
  // redis check
  try {
    const redis = getRedis();
    const start = Date.now();
    await redis.ping();
    checks.redis = {
      status: 'healthy',
      latency: `${Date.now() - start}ms`
    };
  } catch (error) {
    checks.redis = {
      status: 'unhealthy',
      error: error.message
    };
  }
  
  const isHealthy = checks.database.status === 'healthy' && checks.redis.status === 'healthy';
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'auth-service',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
