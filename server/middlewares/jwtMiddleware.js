import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';

// JWT token verification middleware - Verificer access token
const verifyToken = (req, res, next) => {
  try {
    // Hent token fra Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Tjek om token har Bearer format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verificer token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Tilføj userId til request object
    req.userId = decoded.userId;
    next();

  } catch (error) {
    console.error('❌ JWT verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error during token verification'
    });
  }
};

// JWT refresh token verification middleware - Verificer refresh token
const verifyRefreshToken = (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verificer refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Tilføj userId til request object
    req.userId = decoded.userId;
    next();

  } catch (error) {
    console.error('❌ Refresh token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error during refresh token verification'
    });
  }
};

// Admin role verification middleware - Tjek om bruger er admin
const verifyAdmin = async (req, res, next) => {
  try {
    // Dette kræver at verifyToken kører først
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Hent bruger fra database og tjek role
    const userModel = new UserModel(req.db);
    const user = await userModel.findUserById(req.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Tjek om bruger er slettet eller inaktiv
    if (user.isDeleted === true) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deleted'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account has been blocked'
      });
    }

    // Tjek om bruger har admin rolle
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required. This incident will be logged.'
      });
    }

    // Tilføj user data til request for brug i admin endpoints
    req.user = user;
    req.adminUser = user; // Ekstra reference for admin-specific logic
    next();

  } catch (error) {
    console.error('❌ Admin verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during admin verification'
    });
  }
};

export {
  verifyToken,
  verifyRefreshToken,
  verifyAdmin
}; 