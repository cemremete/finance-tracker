# API Gateway

Routes requests to backend microservices. Handles auth, rate limiting, and all that fun stuff.

## Quick Start

```bash
npm install
npm run dev
```

Runs on http://localhost:3000

## Features

- **JWT verification** - validates tokens with auth service
- **Rate limiting** - redis-backed, per-user or per-ip
- **Circuit breakers** - prevents cascading failures
- **Request routing** - proxies to backend services
- **Correlation IDs** - tracks requests across services
- **Prometheus metrics** - `/metrics` endpoint
- **Swagger docs** - `/docs` endpoint
- **Health checks** - `/health`, `/health/live`, `/health/ready`

## Routes

| Path | Service | Auth Required |
|------|---------|---------------|
| `/api/auth/*` | auth-service | No (mostly) |
| `/api/transactions/*` | transaction-service | Yes |
| `/api/budgets/*` | budget-service | Yes |
| `/api/analytics/*` | analytics-service | Yes |
| `/api/notifications/*` | notification-service | Yes |
| `/api/admin/*` | various | Admin only |

## Config

See `.env.example` for all options. Key ones:

- `JWT_ACCESS_SECRET` - must match auth service
- `REDIS_HOST` - for rate limiting
- `*_SERVICE_URL` - backend service urls

## Endpoints

- `GET /` - redirects to docs
- `GET /docs` - swagger ui
- `GET /docs/spec` - openapi json
- `GET /health` - basic health
- `GET /health/live` - liveness probe
- `GET /health/ready` - readiness probe
- `GET /health/details` - detailed health with all services
- `GET /metrics` - prometheus metrics

## Circuit Breakers

Uses [opossum](https://github.com/nodeshift/opossum) for circuit breakers. If a service fails too much, the circuit opens and requests fail fast instead of timing out.

Check `/health/details` to see circuit breaker states.

## Rate Limits

- General API: 100 req/min
- Auth endpoints: 10 req/15min
- Strict (password reset): 5 req/hour

Uses Redis for distributed rate limiting across gateway instances.
