// main entry point for auth service

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// Rate limiting disabled for development - uncomment for production
// const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const { connectDatabase } = require('./db/connection');
const { connectRedis } = require('./db/redis');

const app = express();
const PORT = process.env.PORT || 3001;

// security stuff
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002', 
    'http://localhost:5173',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
}));

// Rate limiting DISABLED for development
// Uncomment below for production use
/*
const isDev = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
*/

// body parsing - keep it small to avoid abuse
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// request logging middleware
// TODO: maybe add request ID for tracing?
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);

// error handling - this catches everything
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDatabase();
    logger.info('PostgreSQL connected');

    await connectRedis();
    logger.info('Redis connected');

    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
      // console.log('debug: server started at', new Date().toISOString());
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// graceful shutdown handlers
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  logger.error('Uncaught Exception:', err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

startServer();

module.exports = app;
