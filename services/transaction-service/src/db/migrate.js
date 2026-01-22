require('dotenv').config();
const { Pool } = require('pg');
const logger = require('../utils/logger');
const config = require('../config');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password
});

const migrations = [
  // Transactions table
  `CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    category VARCHAR(50) NOT NULL DEFAULT 'uncategorized',
    merchant_name VARCHAR(255),
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_id UUID,
    auto_categorized BOOLEAN DEFAULT FALSE,
    user_category_override BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Budgets table
  `CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    period VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    alert_threshold_80 BOOLEAN DEFAULT TRUE,
    alert_threshold_90 BOOLEAN DEFAULT TRUE,
    alert_threshold_100 BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, period)
  )`,

  // Subscriptions table
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
    category VARCHAR(50) DEFAULT 'entertainment',
    next_payment_date DATE NOT NULL,
    last_payment_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    auto_detected BOOLEAN DEFAULT FALSE,
    reminder_days INTEGER DEFAULT 3,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Goals table
  `CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TRY',
    deadline DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    auto_round_enabled BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    icon VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Goal contributions table
  `CREATE TABLE IF NOT EXISTS goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    source VARCHAR(50) NOT NULL CHECK (source IN ('manual', 'auto_round', 'scheduled', 'bonus')),
    transaction_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Budget alerts table
  `CREATE TABLE IF NOT EXISTS budget_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    threshold INTEGER NOT NULL,
    percentage_used DECIMAL(5, 2) NOT NULL,
    amount_spent DECIMAL(15, 2) NOT NULL,
    amount_limit DECIMAL(15, 2) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // User category mappings (for learning from corrections)
  `CREATE TABLE IF NOT EXISTS user_category_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    confidence DECIMAL(3, 2) DEFAULT 1.0,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, keyword)
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON goal_contributions(goal_id)`,
  `CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_id ON budget_alerts(user_id)`
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting database migrations...');
    
    for (const migration of migrations) {
      await client.query(migration);
    }
    
    logger.info('All migrations completed successfully');
  } catch (err) {
    logger.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
