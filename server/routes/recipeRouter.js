import express from 'express';
import { body, query } from 'express-validator';
import RecipeModel from '../models/recipeModel.js';
import UserModel from '../models/userModel.js';
import CommentModel from '../models/commentModel.js';
import { verifyToken } from '../middlewares/jwtMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationMiddleware.js';
import { 
  uploadRecipeImage, 
  handleUploadError, 
  generateImageUrl 
} from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Validation rules for recipe (unified structure)
const recipeValidation = [
  // Core recipe data - Required
  body('title')
    .isLength({ min: 2, max: 200 })
    .withMessage('Recipe title must be between 2 and 200 characters'),
  
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Recipe description must be between 10 and 1000 characters'),
  
  body('ingredients')
    .custom((value) => {
      // Handle both JSON string (form-data) and array (JSON)
      let ingredients;
      if (typeof value === 'string') {
        try {
          ingredients = JSON.parse(value);
        } catch (e) {
          throw new Error('Ingredients must be a valid JSON array');
        }
      } else {
        ingredients = value;
      }
      
      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        throw new Error('Recipe must have at least one ingredient');
      }
      
      return true;
    }),
  
  body('instructions') // Changed from 'steps' for unified structure
    .custom((value) => {
      // Handle both JSON string (form-data) and array (JSON)
      let instructions;
      if (typeof value === 'string') {
        try {
          instructions = JSON.parse(value);
        } catch (e) {
          throw new Error('Instructions must be a valid JSON array');
        }
      } else {
        instructions = value;
      }
      
      if (!Array.isArray(instructions) || instructions.length === 0) {
        throw new Error('Recipe must have at least one instruction');
      }
      
      return true;
    }),

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
    .isInt({ min: 1, max: 1440 })
    .withMessage('Cooking time must be between 1 and 1440 minutes'),
  
  body('tags')
    .optional()
    .custom((value) => {
      if (!value) return true; // Optional field
      
      // Handle both JSON string (form-data) and array (JSON)
      let tags;
      if (typeof value === 'string') {
        try {
          tags = JSON.parse(value);
        } catch (e) {
          throw new Error('Tags must be a valid JSON array');
        }
      } else {
        tags = value;
      }
      
      if (!Array.isArray(tags)) {
        throw new Error('Tags must be an array');
      }
      
      return true;
    }),

  // Nutrition - Optional
  body('nutrition')
    .optional()
    .custom((value) => {
      if (!value) return true; // Optional field
      
      // Handle both JSON string (form-data) and object (JSON)
      let nutrition;
      if (typeof value === 'string') {
        try {
          nutrition = JSON.parse(value);
        } catch (e) {
          throw new Error('Nutrition must be a valid JSON object');
        }
      } else {
        nutrition = value;
      }
      
      if (typeof nutrition !== 'object' || Array.isArray(nutrition)) {
        throw new Error('Nutrition must be an object');
      }
      
      return true;
    })
];

// GET /api/recipes - Hent alle opskrifter med pagination
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const recipeModel = new RecipeModel(req.db);
    const result = await recipeModel.getAllRecipes(page, limit);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Get recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching recipes'
    });
  }
});

// GET /api/recipes/search - Søg opskrifter
router.get('/search', [
  query('q')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query is required and must be between 1 and 100 characters'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res) => {
  try {
    const { q: query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const recipeModel = new RecipeModel(req.db);
    const recipes = await recipeModel.searchRecipes(query, page, limit);

    res.json({
      success: true,
      data: {
        recipes,
        searchQuery: query
      }
    });

  } catch (error) {
    console.error('❌ Search recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while searching recipes'
    });
  }
});

// GET /api/recipes/:id - Hent enkelt opskrift
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const recipeModel = new RecipeModel(req.db);
    const recipe = await recipeModel.getRecipeById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.json({
      success: true,
      data: {
        recipe
      }
    });

  } catch (error) {
    console.error('❌ Get recipe by ID error:', error);
    
    if (error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching recipe'
    });
  }
});

// POST /api/recipes - Opret ny opskrift med image upload (protected)
router.post('/', verifyToken, uploadRecipeImage, handleUploadError, async (req, res) => {
  try {
    // Håndter uploaded image
    let thumbnailUrl = null;
    if (req.file) {
      thumbnailUrl = generateImageUrl(req, req.file.filename);
      console.log(`📸 Image uploaded: ${req.file.filename}`);
    }

    // Extract recipe data (unified structure)
    const { 
      title, 
      description, 
      ingredients, 
      instructions,
      videoUrl,
      servings,
      totalTimeCookingMinutes,
      tags,
      nutrition
    } = req.body;
    
    // Manual validation AFTER multer parsing
    if (!title || typeof title !== 'string' || title.trim().length < 2 || title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Recipe title must be between 2 and 200 characters'
      });
    }
    
    if (!description || typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Recipe description must be between 10 and 1000 characters'
      });
    }
    
    // Validate ingredients (can be string from FormData or array from JSON)
    let parsedIngredients;
    try {
      parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Ingredients must be a valid JSON array'
      });
    }
    
    if (!Array.isArray(parsedIngredients) || parsedIngredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipe must have at least one ingredient'
      });
    }
    
    // Validate instructions (can be string from FormData or array from JSON)
    let parsedInstructions;
    try {
      parsedInstructions = typeof instructions === 'string' ? JSON.parse(instructions) : instructions;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Instructions must be a valid JSON array'
      });
    }
    
    if (!Array.isArray(parsedInstructions) || parsedInstructions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipe must have at least one instruction'
      });
    }
    
    const createdBy = req.userId; // Fra JWT middleware
    
    // Parse JSON strings for tags and nutrition (ingredients and instructions already parsed above)
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    const parsedNutrition = typeof nutrition === 'string' ? JSON.parse(nutrition) : nutrition;
    
    const recipeModel = new RecipeModel(req.db);
    const newRecipe = await recipeModel.createRecipe({
      title,
      description,
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
      thumbnail: thumbnailUrl, // Fra uploaded file
      videoUrl: videoUrl || null,
      servings: servings ? parseInt(servings) : null,
      totalTimeCookingMinutes: totalTimeCookingMinutes ? parseInt(totalTimeCookingMinutes) : null,
      tags: parsedTags || [],
      nutrition: parsedNutrition || null,
      createdBy
    });

    console.log(`✅ New unified recipe created: ${title} by user ${createdBy}`);

    // Emit Socket.io event for real-time opdatering
    if (req.io) {
      req.io.emit('newRecipe', {
        recipe: newRecipe,
        message: `New recipe "${title}" created with image ${req.file ? '📸' : '📝'}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: {
        recipe: newRecipe
      }
    });

  } catch (error) {
    console.error('❌ Create recipe error:', error);
    
    // Cleanup uploaded file if recipe creation fails
    if (req.file) {
      const fs = await import('fs/promises');
      try {
        await fs.unlink(req.file.path);
        console.log(`🗑️ Cleaned up failed upload: ${req.file.filename}`);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating recipe'
    });
  }
});

// PUT /api/recipes/:id - Opdater opskrift (protected, kun ejeren)
router.put('/:id', verifyToken, recipeValidation, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, ingredients, steps } = req.body;
    const userId = req.userId;
    
    const recipeModel = new RecipeModel(req.db);
    await recipeModel.updateRecipe(id, {
      title,
      description,
      ingredients,
      steps
    }, userId);

    // Hent opdateret opskrift
    const updatedRecipe = await recipeModel.getRecipeById(id);

    res.json({
      success: true,
      message: 'Recipe updated successfully',
      data: {
        recipe: updatedRecipe
      }
    });

  } catch (error) {
    console.error('❌ Update recipe error:', error);
    
    if (error.message === 'Recipe not found or access denied') {
      return res.status(403).json({
        success: false,
        message: 'Recipe not found or you do not have permission to update this recipe'
      });
    }

    if (error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating recipe'
    });
  }
});

// DELETE /api/recipes/:id - Slet opskrift (protected, kun ejeren)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const recipeModel = new RecipeModel(req.db);
    const commentModel = new CommentModel(req.db);
    
    // Slet opskrift
    await recipeModel.deleteRecipe(id, userId);
    
    // Slet alle kommentarer til opskriften
    await commentModel.deleteCommentsByRecipe(id);

    res.json({
      success: true,
      message: 'Recipe deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete recipe error:', error);
    
    if (error.message === 'Recipe not found or access denied') {
      return res.status(403).json({
        success: false,
        message: 'Recipe not found or you do not have permission to delete this recipe'
      });
    }

    if (error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting recipe'
    });
  }
});

// POST /api/recipes/:id/favorite - Tilføj til favoritter (protected)
router.post('/:id/favorite', verifyToken, async (req, res) => {
  try {
    const { id: recipeId } = req.params;
    const userId = req.userId;
    
    const userModel = new UserModel(req.db);
    const recipeModel = new RecipeModel(req.db);

    // Tilføj til brugerens favoritter
    await userModel.addFavorite(userId, recipeId);
    
    // Øg opskriftens favorit tæller
    await recipeModel.incrementFavoriteCount(recipeId);

    // Emit Socket.io event
    if (req.io) {
      req.io.emit('favoriteUpdate', {
        recipeId,
        userId,
        action: 'added'
      });
    }

    res.json({
      success: true,
      message: 'Recipe added to favorites successfully'
    });

  } catch (error) {
    console.error('❌ Add favorite error:', error);
    
    if (error.message === 'Recipe already in favorites') {
      return res.status(400).json({
        success: false,
        message: 'Recipe is already in your favorites'
      });
    }

    if (error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while adding to favorites'
    });
  }
});

// DELETE /api/recipes/:id/favorite - Fjern fra favoritter (protected)
router.delete('/:id/favorite', verifyToken, async (req, res) => {
  try {
    const { id: recipeId } = req.params;
    const userId = req.userId;
    
    const userModel = new UserModel(req.db);
    const recipeModel = new RecipeModel(req.db);

    // Fjern fra brugerens favoritter
    await userModel.removeFavorite(userId, recipeId);
    
    // Reducer opskriftens favorit tæller
    await recipeModel.decrementFavoriteCount(recipeId);

    // Emit Socket.io event
    if (req.io) {
      req.io.emit('favoriteUpdate', {
        recipeId,
        userId,
        action: 'removed'
      });
    }

    res.json({
      success: true,
      message: 'Recipe removed from favorites successfully'
    });

  } catch (error) {
    console.error('❌ Remove favorite error:', error);
    
    if (error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while removing from favorites'
    });
  }
});

// GET /api/recipes/:id/comments - Hent kommentarer for opskrift
router.get('/:id/comments', async (req, res) => {
  try {
    const { id: recipeId } = req.params;
    
    const commentModel = new CommentModel(req.db);
    const comments = await commentModel.getCommentsByRecipe(recipeId);

    res.json({
      success: true,
      data: {
        comments,
        count: comments.length
      }
    });

  } catch (error) {
    console.error('❌ Get comments error:', error);
    
    if (error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching comments'
    });
  }
});

// POST /api/recipes/:id/comment - Tilføj kommentar til opskrift (protected)
router.post('/:id/comment', verifyToken, [
  body('text')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment text must be between 1 and 500 characters')
    .trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { id: recipeId } = req.params;
    const { text } = req.body;
    const createdBy = req.userId;
    
    // Tjek om opskriften eksisterer
    const recipeModel = new RecipeModel(req.db);
    const recipe = await recipeModel.getRecipeById(recipeId);
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    // Opret kommentar
    const commentModel = new CommentModel(req.db);
    const newComment = await commentModel.createComment({
      text,
      recipeId,
      createdBy
    });

    // Hent kommentar med author info
    const comments = await commentModel.getCommentsByRecipe(recipeId);
    const commentWithAuthor = comments.find(c => c._id.toString() === newComment._id.toString());

    console.log(`✅ New comment added to recipe ${recipeId} by user ${createdBy}`);

    // Emit Socket.io event for real-time opdatering
    if (req.io) {
      req.io.emit('newComment', {
        recipeId,
        comment: commentWithAuthor,
        message: `New comment on "${recipe.title}"`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: commentWithAuthor
      }
    });

  } catch (error) {
    console.error('❌ Add comment error:', error);
    
    if (error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while adding comment'
    });
  }
});

// PUT /api/comments/:id - Opdater kommentar (protected, kun ejeren)
router.put('/comments/:id', verifyToken, [
  body('text')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment text must be between 1 and 500 characters')
    .trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const { text } = req.body;
    const userId = req.userId;
    
    const commentModel = new CommentModel(req.db);
    await commentModel.updateComment(commentId, { text }, userId);
    
    res.json({
      success: true,
      message: 'Comment updated successfully'
    });

  } catch (error) {
    console.error('❌ Update comment error:', error);
    
    if (error.message === 'Comment not found or access denied') {
      return res.status(403).json({
        success: false,
        message: 'Comment not found or you do not have permission to update this comment'
      });
    }

    if (error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating comment'
    });
  }
});

// DELETE /api/comments/:id - Slet kommentar (protected, kun ejeren)
router.delete('/comments/:id', verifyToken, async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const userId = req.userId;
    
    const commentModel = new CommentModel(req.db);
    await commentModel.deleteComment(commentId, userId);

    // Emit Socket.io event
    if (req.io) {
      req.io.emit('commentDeleted', {
        commentId,
        userId
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete comment error:', error);
    
    if (error.message === 'Comment not found or access denied') {
      return res.status(403).json({
        success: false,
        message: 'Comment not found or you do not have permission to delete this comment'
      });
    }

    if (error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting comment'
    });
  }
});

export default router; 