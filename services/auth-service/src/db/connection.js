// postgres connection with pooling

const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');

let pool = null;

function createPool() {
  return new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    min: config.database.poolMin,
    max: config.database.poolMax,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
}

// connect and verify
async function connectDatabase() {
  if (pool) {
    return pool;
  }

  pool = createPool();

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info(`Database connected at ${result.rows[0].now}`);
    client.release();
    return pool;
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
}

// run a query
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;
    
    // console.log('query took', duration, 'ms');
    logger.debug({
      query: text,
      params,
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    logger.error('Query error:', { query: text, error: error.message });
    throw error;
  }
}

// get client for transactions
async function getClient() {
  return getPool().connect();
}

async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
}

module.exports = {
  connectDatabase,
  getPool,
  query,
  getClient,
  closeDatabase
};
