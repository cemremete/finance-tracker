// redis client for rate limiting

const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

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
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected for rate limiting');
  });

  redisClient.on('error', (error) => {
    logger.error('Redis error:', error.message);
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
    throw new Error('Redis not connected');
  }
  return redisClient;
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
  closeRedis
};
