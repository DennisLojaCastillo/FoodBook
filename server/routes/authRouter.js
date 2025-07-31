import express from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { ObjectId } from 'mongodb';
import UserModel from '../models/userModel.js';
import { verifyToken } from '../middlewares/jwtMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// JWT token generation funktioner
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

// Validation rules
const signupValidation = [
  body('username')
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscore and dash'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// POST /api/auth/signup - Opret ny bruger
router.post('/signup', signupValidation, handleValidationErrors, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Opret UserModel instance med database forbindelse
    const userModel = new UserModel(req.db);
    
    // Opret bruger med hashed password
    const newUser = await userModel.createUser({
      username,
      email,
      password,
      role: 'user'
    });

    // Generer JWT tokens
    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    console.log(`✅ New user signed up: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: newUser,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    
    if (error.message === 'Email already exists') {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during signup'
    });
  }
});

// POST /api/auth/login - Log ind eksisterende bruger
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const userModel = new UserModel(req.db);
    
    // Find bruger med email
    const user = await userModel.findUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verificer password
    const isPasswordValid = await userModel.verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generer JWT tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Returner bruger uden password
    const { password: _, ...userWithoutPassword } = user;

    console.log(`✅ User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// POST /api/auth/refresh - Forny access token med refresh token
router.post('/refresh', async (req, res) => {
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

    // Generer ny access token
    const newAccessToken = generateAccessToken(decoded.userId);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken
      }
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during token refresh'
    });
  }
});

// GET /api/auth/me - Hent current user info (protected)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userModel = new UserModel(req.db);
    const user = await userModel.findUserById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('❌ Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/auth/profile - Hent bruger profil med favoritter (protected)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userModel = new UserModel(req.db);
    const user = await userModel.getUserWithFavorites(req.userId);

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/auth/profile - Opdater bruger profil (protected)
router.put('/profile', verifyToken, [
  body('username')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscore and dash')
], handleValidationErrors, async (req, res) => {
  try {
    const { username } = req.body;
    const userModel = new UserModel(req.db);

    await userModel.updateUser(req.userId, { username });

    // Hent opdateret bruger
    const updatedUser = await userModel.findUserById(req.userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/auth/my-recipes - Hent brugerens egne opskrifter (protected)
router.get('/my-recipes', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const recipesCollection = req.db.collection('recipes');
    const userObjectId = new ObjectId(req.userId);

    // Hent brugerens opskrifter med pagination
    const recipes = await recipesCollection.find({
      createdBy: userObjectId
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

    // Få total count for pagination
    const totalRecipes = await recipesCollection.countDocuments({
      createdBy: userObjectId
    });

    const totalPages = Math.ceil(totalRecipes / limit);

    res.json({
      success: true,
      data: {
        recipes,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecipes,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Get user recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/logout - Log ud (placeholder - tokens håndteres client-side)
router.post('/logout', verifyToken, (req, res) => {
  // I en production app ville vi blackliste refresh token her
  console.log(`✅ User logged out: ${req.userId}`);
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

export default router; 