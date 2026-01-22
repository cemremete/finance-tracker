const { createClient } = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

let client = null;

async function connectRedis() {
  if (client) return client;

  client = createClient({
    socket: {
      host: config.redis.host,
      port: config.redis.port
    },
    password: config.redis.password || undefined,
    database: config.redis.db
  });

  client.on('error', (err) => {
    logger.error('Redis client error:', err.message);
  });

  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('reconnecting', () => {
    logger.warn('Redis client reconnecting...');
  });

  await client.connect();
  return client;
}

function getRedisClient() {
  if (!client || !client.isOpen) {
    throw new Error('Redis client not connected');
  }
  return client;
}

async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
    logger.info('Redis connection closed');
  }
}

// Cache helpers
async function cacheGet(key) {
  const data = await getRedisClient().get(key);
  return data ? JSON.parse(data) : null;
}

async function cacheSet(key, value, ttlSeconds = 300) {
  await getRedisClient().setEx(key, ttlSeconds, JSON.stringify(value));
}

async function cacheDelete(key) {
  await getRedisClient().del(key);
}

async function cacheClearPattern(pattern) {
  const keys = await getRedisClient().keys(pattern);
  if (keys.length > 0) {
    await getRedisClient().del(keys);
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheClearPattern
};
