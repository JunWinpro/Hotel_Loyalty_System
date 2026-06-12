const Redis = require('ioredis');
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
});

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis reconnecting... Attempt ${times}. Retrying in ${delay}ms`);
    return delay;
  }
});

redis.on('connect', () => {
  logger.info('Successfully connected to Redis');
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

module.exports = redis;
