// database migrations - run with npm run migrate

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

const migrations = [
  // uuid extension
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
  
  // roles enum
  `DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'premium');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;`,
  
  // users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // indexes
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
  `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`,
  
  // auto-update updated_at column
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';`,
  
  `DROP TRIGGER IF EXISTS update_users_updated_at ON users;
   CREATE TRIGGER update_users_updated_at
   BEFORE UPDATE ON users
   FOR EACH ROW
   EXECUTE FUNCTION update_updated_at_column();`,
  
  // audit log - tracks login attempts etc
  `CREATE TABLE IF NOT EXISTS auth_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,
  
  `CREATE INDEX IF NOT EXISTS idx_auth_audit_user_id ON auth_audit_log(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON auth_audit_log(created_at);`
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting database migrations...');
    
    await client.query('BEGIN');
    
    for (const migration of migrations) {
      logger.info(`Executing migration: ${migration.substring(0, 50)}...`);
      await client.query(migration);
    }
    
    await client.query('COMMIT');
    
    logger.info('All migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
