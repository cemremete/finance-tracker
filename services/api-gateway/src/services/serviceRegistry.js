// service registry - keeps track of backend services and their health

const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

// service definitions
const services = {
  auth: {
    name: 'auth-service',
    url: config.services.auth,
    healthPath: '/health',
    status: 'unknown',
    lastCheck: null
  },
  transaction: {
    name: 'transaction-service',
    url: config.services.transaction,
    healthPath: '/health',
    status: 'unknown',
    lastCheck: null
  },
  budget: {
    name: 'budget-service',
    url: config.services.budget,
    healthPath: '/health',
    status: 'unknown',
    lastCheck: null
  },
  notification: {
    name: 'notification-service',
    url: config.services.notification,
    healthPath: '/health',
    status: 'unknown',
    lastCheck: null
  },
  analytics: {
    name: 'analytics-service',
    url: config.services.analytics,
    healthPath: '/health',
    status: 'unknown',
    lastCheck: null
  }
};

// check health of a single service
async function checkServiceHealth(serviceKey) {
  const service = services[serviceKey];
  if (!service) return null;

  try {
    const response = await axios.get(`${service.url}${service.healthPath}`, {
      timeout: 5000
    });
    
    service.status = response.status === 200 ? 'healthy' : 'unhealthy';
    service.lastCheck = new Date().toISOString();
    
    return service.status;
  } catch (error) {
    service.status = 'unhealthy';
    service.lastCheck = new Date().toISOString();
    logger.warn(`Service ${service.name} health check failed: ${error.message}`);
    return 'unhealthy';
  }
}

// check all services
async function checkAllServices() {
  const results = {};
  
  for (const key of Object.keys(services)) {
    results[key] = await checkServiceHealth(key);
  }
  
  return results;
}

// get service url
function getServiceUrl(serviceKey) {
  const service = services[serviceKey];
  if (!service) {
    throw new Error(`Unknown service: ${serviceKey}`);
  }
  return service.url;
}

// get all services status
function getServicesStatus() {
  const status = {};
  
  for (const [key, service] of Object.entries(services)) {
    status[key] = {
      name: service.name,
      url: service.url,
      status: service.status,
      lastCheck: service.lastCheck
    };
  }
  
  return status;
}

// start periodic health checks
let healthCheckInterval = null;

function startHealthChecks(intervalMs = 30000) {
  if (healthCheckInterval) return;
  
  // initial check
  checkAllServices();
  
  // periodic checks
  healthCheckInterval = setInterval(() => {
    checkAllServices();
  }, intervalMs);
  
  logger.info(`Service health checks started (every ${intervalMs / 1000}s)`);
}

function stopHealthChecks() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('Service health checks stopped');
  }
}

module.exports = {
  services,
  checkServiceHealth,
  checkAllServices,
  getServiceUrl,
  getServicesStatus,
  startHealthChecks,
  stopHealthChecks
};
