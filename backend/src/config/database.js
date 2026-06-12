const { Pool } = require('pg');
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
});

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

// Helper for query execution
const query = (text, params) => pool.query(text, params);

// Connection verification with simple retry logic
const connectWithRetry = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      logger.info('Successfully connected to PostgreSQL');
      client.release();
      return pool;
    } catch (err) {
      logger.warn(`PostgreSQL connection attempt ${i + 1} failed. Retrying in ${delay}ms...`);
      logger.error(err.message);
      if (i === retries - 1) {
        throw err;
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

module.exports = {
  pool,
  query,
  connectWithRetry
};
