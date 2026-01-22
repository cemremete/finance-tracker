# API Gateway Dockerfile
# Multi-stage build for smaller image

FROM node:20-alpine AS builder

WORKDIR /app

# copy package files
COPY package*.json ./

# install all deps (including dev for potential build steps)
RUN npm ci --only=production

# ============================================
# Production image
# ============================================
FROM node:20-alpine

WORKDIR /app

# create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# remove dev files
RUN rm -rf tests .eslintrc.js

# switch to non-root user
USER nodejs

# expose port
EXPOSE 3000

# health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/live || exit 1

# start
CMD ["node", "src/index.js"]
