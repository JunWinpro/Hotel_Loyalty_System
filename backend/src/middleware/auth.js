const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token is missing or invalid'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'local-jwt-access-secret-key-123456789');
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid access token'
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required'
    });
  }
  return next();
};

const requireGuest = (req, res, next) => {
  if (!req.user || req.user.role !== 'guest') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Guest access required'
    });
  }
  return next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireGuest
};
