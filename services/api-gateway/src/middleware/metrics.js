// prometheus metrics middleware

const promClient = require('prom-client');
const config = require('../config');

// create registry
const register = new promClient.Registry();

// add default metrics
promClient.collectDefaultMetrics({ register });

// custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections'
});

const circuitBreakerState = new promClient.Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
  labelNames: ['service']
});

// register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(circuitBreakerState);

// middleware to track requests
function metricsMiddleware(req, res, next) {
  if (!config.metrics.enabled) {
    return next();
  }

  // skip metrics endpoint itself
  if (req.path === config.metrics.path) {
    return next();
  }

  activeConnections.inc();
  const start = Date.now();

  res.on('finish', () => {
    activeConnections.dec();
    const duration = (Date.now() - start) / 1000;
    
    // normalize route for labels (avoid high cardinality)
    const route = normalizeRoute(req.route?.path || req.path);
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });

  next();
}

// normalize route to avoid high cardinality
function normalizeRoute(path) {
  // replace uuids and ids with placeholders
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+/g, '/:id');
}

// metrics endpoint handler
async function metricsHandler(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
}

// update circuit breaker metrics
function updateCircuitBreakerMetric(service, state) {
  const stateValue = state === 'closed' ? 0 : state === 'half-open' ? 1 : 2;
  circuitBreakerState.set({ service }, stateValue);
}

module.exports = {
  register,
  metricsMiddleware,
  metricsHandler,
  updateCircuitBreakerMetric,
  httpRequestDuration,
  httpRequestTotal
};
