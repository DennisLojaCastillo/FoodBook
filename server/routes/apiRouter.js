import express from 'express';
const router = express.Router();

// Placeholder routes for external API - vil blive implementeret senere
router.get('/search', (req, res) => {
  res.json({ message: 'Tasty API search endpoint - kommer snart!' });
});

router.post('/external/favorite', (req, res) => {
  res.json({ message: 'Save external recipe as favorite - kommer snart!' });
});

router.delete('/external/favorite/:id', (req, res) => {
  res.json({ message: `Remove external favorite ${req.params.id} - kommer snart!` });
});

export default router; 