const nodemailer = require('nodemailer');
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525', 10),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    logger.info('SMTP mail server configuration verified successfully');
  } catch (err) {
    logger.warn('SMTP verification failed. Transactions email sending might fail: ' + err.message);
  }
};

module.exports = {
  transporter,
  verifyEmailConfig
};
