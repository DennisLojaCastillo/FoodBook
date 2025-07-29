import jwt from 'jsonwebtoken';

// JWT token verification middleware - implementeres senere
const verifyToken = (req, res, next) => {
  // Placeholder - vil blive implementeret senere
  console.log('JWT middleware - implementeres snart!');
  next();
};

const verifyRefreshToken = (req, res, next) => {
  // Placeholder - vil blive implementeret senere
  console.log('JWT refresh middleware - implementeres snart!');
  next();
};

export {
  verifyToken,
  verifyRefreshToken
}; 