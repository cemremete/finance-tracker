require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./utils/logger');
const { connectDatabase } = require('./db/connection');
const { connectRedis } = require('./db/redis');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Routes
const healthRoutes = require('./routes/health');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const subscriptionRoutes = require('./routes/subscriptions');
const goalRoutes = require('./routes/goals');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Security
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

// Rate limiting - skip in development
const isDev = config.env !== 'production';
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
  });
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDatabase();
    logger.info('PostgreSQL connected');

    await connectRedis();
    logger.info('Redis connected');

    app.listen(config.port, () => {
      logger.info(`Transaction service running on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  logger.error('Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

startServer();

module.exports = app;
