// gateway config - pulls from env vars

const config = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // jwt config - must match auth service
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key-change-in-production',
    issuer: process.env.JWT_ISSUER || 'finance-tracker-auth'
  },
  
  // redis for rate limiting
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 1 // different db than auth service
  },
  
  // rate limiting defaults
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 min
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // cors
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  
  // service urls - these get overridden in k8s
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    transaction: process.env.TRANSACTION_SERVICE_URL || 'http://localhost:3002',
    budget: process.env.BUDGET_SERVICE_URL || 'http://localhost:3003',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3005'
  },
  
  // circuit breaker settings
  circuitBreaker: {
    timeout: parseInt(process.env.CB_TIMEOUT) || 10000, // 10s
    errorThresholdPercentage: parseInt(process.env.CB_ERROR_THRESHOLD) || 50,
    resetTimeout: parseInt(process.env.CB_RESET_TIMEOUT) || 30000 // 30s
  },
  
  // metrics
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    path: '/metrics'
  }
};

// validate in prod
function validateConfig() {
  if (config.nodeEnv === 'production') {
    if (config.jwt.accessSecret.includes('change-in-production')) {
      throw new Error('JWT_ACCESS_SECRET must be set in production');
    }
  }
}

validateConfig();

module.exports = config;
