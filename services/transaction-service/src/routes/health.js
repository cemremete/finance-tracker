const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');
const { getRedisClient } = require('../db/redis');

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'transaction-service',
    timestamp: new Date().toISOString()
  });
});

// Liveness probe
router.get('/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe - checks dependencies
router.get('/ready', async (req, res) => {
  const checks = {
    database: false,
    redis: false
  };

  try {
    // Check database
    const dbResult = await pool.query('SELECT 1');
    checks.database = dbResult.rows.length > 0;
  } catch (err) {
    checks.database = false;
  }

  try {
    // Check Redis
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = true;
  } catch (err) {
    checks.redis = false;
  }

  const allHealthy = Object.values(checks).every(v => v);
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not ready',
    checks
  });
});

module.exports = router;
