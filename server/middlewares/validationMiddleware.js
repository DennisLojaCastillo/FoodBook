import { validationResult, body } from 'express-validator';

// Validation middleware - implementeres senere
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Pre-built validation rules - kan genbruges
const validateSignup = () => {
  return [
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
};

const validateLogin = () => {
  return [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ];
};

const validateRecipe = () => {
  return [
    // Core recipe data - Required
    body('title')
      .isLength({ min: 2, max: 200 })
      .withMessage('Recipe title must be between 2 and 200 characters'),
    
    body('description')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Recipe description must be between 10 and 1000 characters'),
    
    body('ingredients')
      .isArray({ min: 1 })
      .withMessage('Recipe must have at least one ingredient'),
    
    body('instructions') // Changed from 'steps' for unified structure
      .isArray({ min: 1 })
      .withMessage('Recipe must have at least one instruction'),

    // Media & Visual - Optional
    body('thumbnail')
      .optional()
      .isURL()
      .withMessage('Thumbnail must be a valid URL'),
    
    body('videoUrl')
      .optional()
      .isURL()
      .withMessage('Video URL must be a valid URL'),

    // Recipe metadata - Optional
    body('servings')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Servings must be between 1 and 50'),
    
    body('totalTimeCookingMinutes')
      .optional()
      .isInt({ min: 1, max: 1440 }) // Max 24 hours
      .withMessage('Cooking time must be between 1 and 1440 minutes'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),

    // Nutrition - Optional, simplified validation
    body('nutrition')
      .optional()
      .isObject()
      .withMessage('Nutrition must be an object')
  ];
};

export {
  handleValidationErrors,
  validateSignup,
  validateLogin,
  validateRecipe
}; 