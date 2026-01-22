const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  min: config.db.poolMin,
  max: config.db.poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error:', err);
});

async function connectDatabase() {
  try {
    const client = await pool.connect();
    logger.info('Database connected at ' + new Date().toString());
    client.release();
    return true;
  } catch (err) {
    logger.error('Database connection failed:', err.message);
    throw err;
  }
}

async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 100) {
      logger.warn({ query: text.substring(0, 100), duration: `${duration}ms` }, 'Slow query detected');
    }
    return result;
  } catch (err) {
    logger.error({ query: text.substring(0, 100), error: err.message }, 'Query failed');
    throw err;
  }
}

async function getClient() {
  return pool.connect();
}

async function closePool() {
  await pool.end();
  logger.info('Database pool closed');
}

module.exports = {
  connectDatabase,
  query,
  getClient,
  closePool,
  pool
};
