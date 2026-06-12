const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
});

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || null;

  res.status(status).json({
    success: false,
    message,
    errors
  });
};

module.exports = errorHandler;
