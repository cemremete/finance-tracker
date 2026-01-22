// request logging middleware

const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();
  
  // log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      correlationId: req.correlationId,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    // add user id if authenticated
    if (req.user) {
      logData.userId = req.user.id;
    }
    
    // log level based on status
    if (res.statusCode >= 500) {
      logger.error(logData);
    } else if (res.statusCode >= 400) {
      logger.warn(logData);
    } else {
      logger.info(logData);
    }
  });
  
  next();
}

module.exports = requestLogger;
