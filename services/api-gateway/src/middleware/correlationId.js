// correlation id middleware
// adds unique id to each request for tracing across services

const { v4: uuidv4 } = require('uuid');

const CORRELATION_HEADER = 'x-correlation-id';

function correlationIdMiddleware(req, res, next) {
  // use existing correlation id or generate new one
  const correlationId = req.headers[CORRELATION_HEADER] || uuidv4();
  
  // attach to request
  req.correlationId = correlationId;
  
  // add to response headers
  res.setHeader(CORRELATION_HEADER, correlationId);
  
  next();
}

module.exports = correlationIdMiddleware;
