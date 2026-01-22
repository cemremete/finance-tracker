// redis connection for sessions and token blacklisting

const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

let redisClient = null;

async function connectRedis() {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    db: config.redis.db,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('error', (error) => {
    logger.error('Redis client error:', error.message);
  });

  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });

  try {
    await redisClient.ping();
    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error.message);
    throw error;
  }
}

function getRedis() {
  if (!redisClient) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
}

// store refresh token with expiry
async function storeRefreshToken(userId, token, expiresInSeconds) {
  const key = `refresh_token:${userId}:${token}`;
  await getRedis().setex(key, expiresInSeconds, 'valid');
}

// check if refresh token is still valid
async function validateRefreshToken(userId, token) {
  const key = `refresh_token:${userId}:${token}`;
  const result = await getRedis().get(key);
  return result === 'valid';
}

// delete a specific refresh token
async function revokeRefreshToken(userId, token) {
  const key = `refresh_token:${userId}:${token}`;
  await getRedis().del(key);
}

// nuke all tokens for a user (logout everywhere)
async function revokeAllUserTokens(userId) {
  const pattern = `refresh_token:${userId}:*`;
  const keys = await getRedis().keys(pattern);
  if (keys.length > 0) {
    await getRedis().del(...keys);
  }
}

// blacklist access token on logout
async function blacklistToken(token, expiresInSeconds) {
  const key = `blacklist:${token}`;
  await getRedis().setex(key, expiresInSeconds, 'blacklisted');
}

// check if token was revoked
async function isTokenBlacklisted(token) {
  const key = `blacklist:${token}`;
  const result = await getRedis().get(key);
  return result === 'blacklisted';
}

async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

module.exports = {
  connectRedis,
  getRedis,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  blacklistToken,
  isTokenBlacklisted,
  closeRedis
};
