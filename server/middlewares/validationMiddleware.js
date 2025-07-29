import { validationResult } from 'express-validator';

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

// Validation rules - implementeres senere
const validateSignup = () => {
  // Placeholder
  return [];
};

const validateLogin = () => {
  // Placeholder
  return [];
};

const validateRecipe = () => {
  // Placeholder
  return [];
};

export {
  handleValidationErrors,
  validateSignup,
  validateLogin,
  validateRecipe
}; 