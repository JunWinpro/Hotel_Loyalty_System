const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const guest = await authService.registerGuest(req.body);
    return res.status(201).json({
      success: true,
      data: guest,
      message: 'Registration successful'
    });
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginGuest(email, password);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Login successful'
    });
  } catch (err) {
    return next(err);
  }
};

const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginAdmin(email, password);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Admin login successful'
    });
  } catch (err) {
    return next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await authService.refreshToken(token);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Token refreshed successfully'
    });
  } catch (err) {
    return next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    // We need decoded info including tokenId. Let's make sure our token decode in verifyToken handles this.
    // If logout is requested, they can send the refreshToken to be deleted, or use the tokenId from the access token.
    // Since access token might not have tokenId, we can also extract tokenId if we put it in the access token,
    // or let the user pass the refresh token to logout.
    // Let's check how logout was defined in auth.service: logoutGuest(guestId, tokenId).
    // In generateTokens, we stored refresh:userId:tokenId in Redis. So to logout, the guest can send their refresh token
    // or we can decode the refresh token (or pass it in body) to find the tokenId and delete it.
    // Let's support both: if they call logout, they pass the refreshToken in the body, or we extract it.
    // Let's modify logout to take token from body to find the tokenId and guestId, and revoke it.
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required to logout'
      });
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'local-jwt-refresh-secret-key-123456789');
    await authService.logoutGuest(decoded.id, decoded.tokenId);
    
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  register,
  login,
  loginAdmin,
  refresh,
  logout
};
