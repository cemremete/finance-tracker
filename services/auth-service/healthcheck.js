/**
 * Docker Health Check Script
 * Used by Docker HEALTHCHECK instruction
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health/ready',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
