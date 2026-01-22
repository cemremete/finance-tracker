// api gateway - main entry point

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const config = require('./config');
const logger = require('./utils/logger');
const { connectRedis, closeRedis } = require('./utils/redis');
const { startHealthChecks, stopHealthChecks } = require('./services/serviceRegistry');

// middleware
const correlationId = require('./middleware/correlationId');
const requestLogger = require('./middleware/requestLogger');
const createCorsMiddleware = require('./middleware/cors');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// routes
const healthRoutes = require('./routes/health');
const proxyRoutes = require('./routes/proxy');
const swaggerRoutes = require('./routes/swagger');

const app = express();

// trust proxy for correct ip detection behind load balancer
app.set('trust proxy', 1);

// security headers
app.use(helmet({
  contentSecurityPolicy: false // disable for swagger ui
}));

// cors
app.use(createCorsMiddleware());

// correlation id for request tracing
app.use(correlationId);

// request logging
app.use(requestLogger);

// metrics
app.use(metricsMiddleware);

// parse json for non-proxied routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// Routes
// ============================================

// health checks (no auth needed)
app.use('/health', healthRoutes);

// metrics endpoint
app.get('/metrics', metricsHandler);

// api docs
app.use('/docs', swaggerRoutes);

// api routes - proxied to backend services
app.use('/api', proxyRoutes);

// root redirect to docs
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// 404 handler
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

// ============================================
// Server startup
// ============================================

async function startServer() {
  try {
    // connect to redis
    await connectRedis();
    logger.info('Redis connected');

    // start health checks for backend services
    startHealthChecks(30000); // every 30s

    // start server
    const server = app.listen(config.port, () => {
      logger.info(`API Gateway running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Docs available at http://localhost:${config.port}/docs`);
    });

    // graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        stopHealthChecks();
        await closeRedis();
        
        logger.info('Cleanup complete, exiting');
        process.exit(0);
      });

      // force exit after 30s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; // for testing
