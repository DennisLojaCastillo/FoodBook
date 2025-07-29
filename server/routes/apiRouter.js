import express from 'express';
import { query, body } from 'express-validator';
import tastyApiService from '../services/tastyApiService.js';
import UserModel from '../models/userModel.js';
import { verifyToken } from '../middlewares/jwtMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationMiddleware.js';
import { apiLimit } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

// External favorites model (simplified - kun i memory for nu)
class ExternalFavoriteModel {
  constructor(db) {
    this.collection = db.collection('external_favorites');
  }

  async saveExternalFavorite(userId, recipeData) {
    try {
      const favorite = {
        userId,
        externalId: recipeData.externalId,
        title: recipeData.title,
        thumbnail: recipeData.thumbnail,
        source: recipeData.source,
        savedAt: new Date()
      };

      // Tjek om allerede gemt
      const existing = await this.collection.findOne({
        userId,
        externalId: recipeData.externalId
      });

      if (existing) {
        throw new Error('Recipe already in favorites');
      }

      const result = await this.collection.insertOne(favorite);
      return { ...favorite, _id: result.insertedId };

    } catch (error) {
      console.error('❌ Error saving external favorite:', error);
      throw error;
    }
  }

  async removeExternalFavorite(userId, externalId) {
    try {
      const result = await this.collection.deleteOne({
        userId,
        externalId
      });

      if (result.deletedCount === 0) {
        throw new Error('Favorite not found');
      }

      return result;

    } catch (error) {
      console.error('❌ Error removing external favorite:', error);
      throw error;
    }
  }

  async getUserExternalFavorites(userId) {
    try {
      const favorites = await this.collection.find({ userId })
        .sort({ savedAt: -1 })
        .toArray();

      return favorites;

    } catch (error) {
      console.error('❌ Error getting external favorites:', error);
      throw error;
    }
  }
}

// GET /api/search - Søg i Tasty API
router.get('/search', [
  apiLimit, // Rate limiting for external API
  query('q')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query is required and must be between 1 and 100 characters'),
  
  query('from')
    .optional()
    .isInt({ min: 0 })
    .withMessage('From must be a non-negative integer'),
  
  query('size')
    .optional()
    .isInt({ min: 1, max: 40 })
    .withMessage('Size must be between 1 and 40')
], handleValidationErrors, async (req, res) => {
  try {
    const { q: query } = req.query;
    const from = parseInt(req.query.from) || 0;
    const size = parseInt(req.query.size) || 20;

    console.log(`🔍 External API search: "${query}" (from: ${from}, size: ${size})`);

    const results = await tastyApiService.searchRecipes(query, from, size);

    res.json({
      success: true,
      data: {
        ...results,
        source: 'tasty',
        cached: false // Vi kunne track dette if needed
      }
    });

  } catch (error) {
    console.error('❌ External search error:', error);
    
    if (error.message.includes('API request failed')) {
      return res.status(503).json({
        success: false,
        message: 'External recipe service is temporarily unavailable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during external search'
    });
  }
});

// GET /api/external/recipe/:id - Hent detaljer for ekstern opskrift
router.get('/external/recipe/:id', [
  apiLimit
], async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📖 Getting external recipe details: ${id}`);

    const recipe = await tastyApiService.getRecipeDetails(id);

    res.json({
      success: true,
      data: {
        recipe
      }
    });

  } catch (error) {
    console.error('❌ Get external recipe error:', error);
    
    if (error.message === 'Recipe not found') {
      return res.status(404).json({
        success: false,
        message: 'External recipe not found'
      });
    }

    if (error.message.includes('API request failed')) {
      return res.status(503).json({
        success: false,
        message: 'External recipe service is temporarily unavailable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching external recipe'
    });
  }
});

// GET /api/autocomplete - Auto-complete søgning
router.get('/autocomplete', [
  apiLimit,
  query('prefix')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .withMessage('Prefix is required and must be between 1 and 50 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { prefix } = req.query;

    const suggestions = await tastyApiService.autocomplete(prefix);

    res.json({
      success: true,
      data: {
        suggestions
      }
    });

  } catch (error) {
    console.error('❌ Autocomplete error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during autocomplete'
    });
  }
});

// GET /api/tags - Hent tilgængelige tags/kategorier
router.get('/tags', [apiLimit], async (req, res) => {
  try {
    const tags = await tastyApiService.getTags();

    res.json({
      success: true,
      data: {
        tags
      }
    });

  } catch (error) {
    console.error('❌ Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching tags'
    });
  }
});

// POST /api/external/favorite - Gem ekstern opskrift som favorit (protected)
router.post('/external/favorite', verifyToken, [
  body('externalId')
    .notEmpty()
    .withMessage('External recipe ID is required'),
  
  body('title')
    .notEmpty()
    .withMessage('Recipe title is required'),
  
  body('thumbnail')
    .optional()
    .isURL()
    .withMessage('Thumbnail must be a valid URL'),
  
  body('source')
    .equals('tasty')
    .withMessage('Source must be tasty')
], handleValidationErrors, async (req, res) => {
  try {
    const { externalId, title, thumbnail, source } = req.body;
    const userId = req.userId;

    const externalFavoriteModel = new ExternalFavoriteModel(req.db);
    const userModel = new UserModel(req.db);

    // Gem ekstern favorit
    const favorite = await externalFavoriteModel.saveExternalFavorite(userId, {
      externalId,
      title,
      thumbnail,
      source
    });

    // Tilføj til brugerens favoritter (external format)
    await userModel.addFavorite(userId, `external_${externalId}`);

    console.log(`✅ External recipe saved as favorite: ${title} by user ${userId}`);

    // Emit Socket.io event
    if (req.io) {
      req.io.emit('externalFavoriteAdded', {
        userId,
        favorite,
        message: `External recipe "${title}" saved as favorite`
      });
    }

    res.status(201).json({
      success: true,
      message: 'External recipe saved as favorite successfully',
      data: {
        favorite
      }
    });

  } catch (error) {
    console.error('❌ Save external favorite error:', error);
    
    if (error.message === 'Recipe already in favorites') {
      return res.status(400).json({
        success: false,
        message: 'Recipe is already in your favorites'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while saving favorite'
    });
  }
});

// DELETE /api/external/favorite/:id - Fjern ekstern favorit (protected)
router.delete('/external/favorite/:id', verifyToken, async (req, res) => {
  try {
    const { id: externalId } = req.params;
    const userId = req.userId;

    const externalFavoriteModel = new ExternalFavoriteModel(req.db);
    const userModel = new UserModel(req.db);

    // Fjern ekstern favorit
    await externalFavoriteModel.removeExternalFavorite(userId, externalId);

    // Fjern fra brugerens favoritter
    await userModel.removeFavorite(userId, `external_${externalId}`);

    console.log(`✅ External favorite removed: ${externalId} by user ${userId}`);

    // Emit Socket.io event
    if (req.io) {
      req.io.emit('externalFavoriteRemoved', {
        userId,
        externalId,
        message: 'External favorite removed'
      });
    }

    res.json({
      success: true,
      message: 'External favorite removed successfully'
    });

  } catch (error) {
    console.error('❌ Remove external favorite error:', error);
    
    if (error.message === 'Favorite not found') {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while removing favorite'
    });
  }
});

// GET /api/cache/stats - Cache statistikker (debug endpoint)
router.get('/cache/stats', (req, res) => {
  try {
    const stats = tastyApiService.getCacheStats();
    
    res.json({
      success: true,
      data: {
        cache: stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching cache stats'
    });
  }
});

export default router; 