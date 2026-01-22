// rollback - drops everything, use with caution

require('dotenv').config();

const { Pool } = require('pg');
const logger = require('../utils/logger');
const config = require('../config');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password
});

// reverse order of migrations
const rollbacks = [
  'DROP TABLE IF EXISTS auth_audit_log CASCADE;',
  'DROP TABLE IF EXISTS users CASCADE;',
  'DROP TYPE IF EXISTS user_role CASCADE;',
  'DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;'
];

async function runRollback() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting database rollback...');
    
    await client.query('BEGIN');
    
    for (const rollback of rollbacks) {
      logger.info(`Executing rollback: ${rollback}`);
      await client.query(rollback);
    }
    
    await client.query('COMMIT');
    
    logger.info('All rollbacks completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Rollback failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run rollback if this file is executed directly
if (require.main === module) {
  runRollback()
    .then(() => {
      logger.info('Rollback script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Rollback script failed:', error);
      process.exit(1);
    });
}

module.exports = { runRollback };
