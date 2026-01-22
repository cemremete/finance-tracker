# Auth Service Dockerfile
# Multi-stage build for optimized production image

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:18-alpine AS deps

WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# ============================================
# Stage 2: Production dependencies only
# ============================================
FROM node:18-alpine AS prod-deps

WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# ============================================
# Stage 3: Production image
# ============================================
FROM node:18-alpine AS production

# Add labels for container metadata
LABEL maintainer="Finance Tracker Team"
LABEL service="auth-service"
LABEL version="1.0.0"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy production dependencies from prod-deps stage
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application source code
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs healthcheck.js ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the service port
EXPOSE 3001

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Start the application
CMD ["node", "src/index.js"]
