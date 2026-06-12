const express = require('express');
const cors = require('cors');
const pino = require('pino');
const pinoHttp = require('pino-http');
const errorHandler = require('./middleware/errorHandler');
const authRouter = require('./modules/auth/auth.routes');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
});

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Pino HTTP logger
app.use(pinoHttp({ logger }));

// Health check endpoint
app.get('/health', async (req, res) => {
  const { pool } = require('./config/database');
  const redis = require('./config/redis');

  let dbStatus = 'UP';
  let redisStatus = 'UP';

  try {
    await pool.query('SELECT 1');
  } catch (err) {
    dbStatus = 'DOWN';
  }

  try {
    await redis.ping();
  } catch (err) {
    redisStatus = 'DOWN';
  }

  const status = (dbStatus === 'UP' && redisStatus === 'UP') ? 200 : 500;

  res.status(status).json({
    status: status === 200 ? 'healthy' : 'unhealthy',
    database: dbStatus,
    redis: redisStatus
  });
});

// Mount routes
app.use('/api/auth', authRouter);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
