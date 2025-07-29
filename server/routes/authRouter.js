import express from 'express';
const router = express.Router();

// Placeholder routes - vil blive implementeret senere
router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - kommer snart!' });
});

router.post('/signup', (req, res) => {
  res.json({ message: 'Signup endpoint - kommer snart!' });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout endpoint - kommer snart!' });
});

router.post('/refresh', (req, res) => {
  res.json({ message: 'Refresh token endpoint - kommer snart!' });
});

router.get('/me', (req, res) => {
  res.json({ message: 'Current user endpoint - kommer snart!' });
});

router.get('/profile', (req, res) => {
  res.json({ message: 'Profile endpoint - kommer snart!' });
});

router.put('/profile', (req, res) => {
  res.json({ message: 'Update profile endpoint - kommer snart!' });
});

export default router; 