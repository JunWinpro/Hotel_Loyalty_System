require('dotenv').config();
const app = require('./app');
const { connectWithRetry, pool } = require('./config/database');
const { verifyEmailConfig } = require('./config/email');
const redis = require('./config/redis');
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
});

const PORT = process.env.PORT || 3001;
let server;

const startServer = async () => {
  try {
    // 1. Verify DB Connection
    await connectWithRetry();

    // 2. Verify Email Connection
    await verifyEmailConfig();

    // 3. Start Listening
    server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

const gracefulShutdown = () => {
  logger.info('Received shutdown signal. Starting graceful shutdown...');

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');

      try {
        // Close DB connections
        await pool.end();
        logger.info('PostgreSQL pool closed.');

        // Close Redis connection
        await redis.quit();
        logger.info('Redis client disconnected.');

        process.exit(0);
      } catch (err) {
        logger.error('Error during graceful shutdown:', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();
