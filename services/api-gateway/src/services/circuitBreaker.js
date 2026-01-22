// circuit breaker using opossum
// prevents cascading failures when services are down

const CircuitBreaker = require('opossum');
const config = require('../config');
const logger = require('../utils/logger');

// store circuit breakers per service
const breakers = new Map();

// default options
const defaultOptions = {
  timeout: config.circuitBreaker.timeout,
  errorThresholdPercentage: config.circuitBreaker.errorThresholdPercentage,
  resetTimeout: config.circuitBreaker.resetTimeout,
  volumeThreshold: 5 // min requests before tripping
};

// create or get circuit breaker for a service
function getBreaker(serviceName, asyncFn, options = {}) {
  if (breakers.has(serviceName)) {
    return breakers.get(serviceName);
  }

  const breakerOptions = { ...defaultOptions, ...options };
  const breaker = new CircuitBreaker(asyncFn, breakerOptions);

  // event handlers
  breaker.on('open', () => {
    logger.warn(`Circuit breaker OPEN for ${serviceName}`);
  });

  breaker.on('halfOpen', () => {
    logger.info(`Circuit breaker HALF-OPEN for ${serviceName}`);
  });

  breaker.on('close', () => {
    logger.info(`Circuit breaker CLOSED for ${serviceName}`);
  });

  breaker.on('fallback', () => {
    logger.debug(`Circuit breaker fallback triggered for ${serviceName}`);
  });

  breakers.set(serviceName, breaker);
  return breaker;
}

// get stats for all breakers
function getAllStats() {
  const stats = {};
  
  for (const [name, breaker] of breakers) {
    stats[name] = {
      state: breaker.opened ? 'open' : (breaker.halfOpen ? 'half-open' : 'closed'),
      stats: breaker.stats
    };
  }
  
  return stats;
}

// reset a specific breaker
function resetBreaker(serviceName) {
  const breaker = breakers.get(serviceName);
  if (breaker) {
    breaker.close();
    logger.info(`Circuit breaker reset for ${serviceName}`);
  }
}

// reset all breakers
function resetAllBreakers() {
  for (const [name, breaker] of breakers) {
    breaker.close();
  }
  logger.info('All circuit breakers reset');
}

module.exports = {
  getBreaker,
  getAllStats,
  resetBreaker,
  resetAllBreakers
};
