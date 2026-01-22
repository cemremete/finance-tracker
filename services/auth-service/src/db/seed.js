// seed script - creates test users for dev

require('dotenv').config();

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const config = require('../config');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password
});

// test users - dont use these passwords in prod obviously
const seedUsers = [
  {
    email: 'admin@financetracker.com',
    password: 'Admin123!@#',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isEmailVerified: true
  },
  {
    email: 'user@financetracker.com',
    password: 'User123!@#',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isEmailVerified: true
  },
  {
    email: 'premium@financetracker.com',
    password: 'Premium123!@#',
    firstName: 'Premium',
    lastName: 'User',
    role: 'premium',
    isEmailVerified: true
  }
];

async function runSeed() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting database seeding...');
    
    await client.query('BEGIN');
    
    for (const user of seedUsers) {
      // skip if already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );
      
      if (existingUser.rows.length > 0) {
        logger.info(`User ${user.email} already exists, skipping...`);
        continue;
      }
      
      const passwordHash = await bcrypt.hash(user.password, config.bcrypt.saltRounds);
      
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_email_verified)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.email, passwordHash, user.firstName, user.lastName, user.role, user.isEmailVerified]
      );
      
      logger.info(`Created user: ${user.email} (${user.role})`);
    }
    
    await client.query('COMMIT');
    
    logger.info('Database seeding completed successfully');
    logger.info('Test credentials:');
    seedUsers.forEach(user => {
      logger.info(`  ${user.role}: ${user.email} / ${user.password}`);
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  runSeed()
    .then(() => {
      logger.info('Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { runSeed };
