// app config - pulls from env vars

const config = {
  port: parseInt(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // db config
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'finance_tracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
    poolMax: parseInt(process.env.DB_POOL_MAX) || 10
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0
  },
  
  // jwt stuff - CHANGE THESE IN PROD
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'finance-tracker-auth'
  },
  
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
};

// make sure we have the important stuff in prod
function validateConfig() {
  if (config.nodeEnv === 'production') {
    const required = [
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'DB_PASSWORD'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    // dont let people run with default secrets in prod
    if (config.jwt.accessSecret.includes('change-in-production')) {
      throw new Error('JWT_ACCESS_SECRET must be changed in production');
    }
  }
}

validateConfig();

module.exports = config;
