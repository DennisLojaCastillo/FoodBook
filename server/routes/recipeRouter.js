import express from 'express';
const router = express.Router();

// Placeholder routes - vil blive implementeret senere
router.get('/', (req, res) => {
  res.json({ message: 'Get all recipes endpoint - kommer snart!' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get recipe ${req.params.id} endpoint - kommer snart!` });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create recipe endpoint - kommer snart!' });
});

router.put('/:id', (req, res) => {
  res.json({ message: `Update recipe ${req.params.id} endpoint - kommer snart!` });
});

router.delete('/:id', (req, res) => {
  res.json({ message: `Delete recipe ${req.params.id} endpoint - kommer snart!` });
});

router.get('/:id/comments', (req, res) => {
  res.json({ message: `Get comments for recipe ${req.params.id} - kommer snart!` });
});

router.post('/:id/comment', (req, res) => {
  res.json({ message: `Add comment to recipe ${req.params.id} - kommer snart!` });
});

router.post('/:id/favorite', (req, res) => {
  res.json({ message: `Add recipe ${req.params.id} to favorites - kommer snart!` });
});

router.delete('/:id/favorite', (req, res) => {
  res.json({ message: `Remove recipe ${req.params.id} from favorites - kommer snart!` });
});

export default router; 