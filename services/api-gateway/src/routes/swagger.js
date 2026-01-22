// swagger/openapi documentation

const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const router = express.Router();
const config = require('../config');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Tracker API',
      version: '1.0.0',
      description: 'API Gateway for Finance Tracker microservices',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server'
      },
      {
        url: 'https://api.financetracker.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'integer' },
            correlationId: { type: 'string' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['user', 'premium', 'admin'] }
          }
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'integer' }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            type: { type: 'string', enum: ['income', 'expense'] },
            category: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Transactions', description: 'Transaction management' },
      { name: 'Budgets', description: 'Budget management' },
      { name: 'Analytics', description: 'Analytics and reports' },
      { name: 'Health', description: 'Health check endpoints' }
    ]
  },
  apis: ['./src/routes/*.js', './src/docs/*.yaml']
};

// generate spec
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// serve swagger ui
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Finance Tracker API Docs'
}));

// serve raw spec
router.get('/spec', (req, res) => {
  res.json(swaggerSpec);
});

module.exports = router;
