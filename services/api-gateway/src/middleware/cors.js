// cors configuration

const cors = require('cors');
const config = require('../config');

function createCorsMiddleware() {
  const options = {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Correlation-ID',
      'X-Requested-With'
    ],
    exposedHeaders: [
      'X-Correlation-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset'
    ],
    maxAge: 86400 // 24 hours
  };

  // handle multiple origins in prod
  if (config.nodeEnv === 'production' && config.cors.origin !== '*') {
    const origins = config.cors.origin.split(',').map(o => o.trim());
    options.origin = (origin, callback) => {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    };
  }

  return cors(options);
}

module.exports = createCorsMiddleware;
