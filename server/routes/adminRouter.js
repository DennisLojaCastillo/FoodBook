import express from 'express';
import { query, body } from 'express-validator';
import { ObjectId } from 'mongodb';
import UserModel from '../models/userModel.js';
import RecipeModel from '../models/recipeModel.js';
import CommentModel from '../models/commentModel.js';
import { verifyToken, verifyAdmin } from '../middlewares/jwtMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Alle admin routes kræver admin rolle
router.use(verifyToken);
router.use(verifyAdmin);

// ==== USER MANAGEMENT ====

// GET /api/admin/users - Hent alle brugere med pagination
router.get('/users', [
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
    const limit = parseInt(req.query.limit) || 20;

    const userModel = new UserModel(req.db);
    const result = await userModel.getAllUsers(page, limit);

    console.log(`✅ Admin ${req.userId} fetched users (page ${page})`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users'
    });
  }
});

// GET /api/admin/dashboard - Admin dashboard statistikker
router.get('/dashboard', async (req, res) => {
  try {
    const userModel = new UserModel(req.db);
    const recipeModel = new RecipeModel(req.db);
    const commentModel = new CommentModel(req.db);

    // Hent statistikker parallelt
    const [userStats, recipeCount, commentCount] = await Promise.all([
      userModel.getAdminDashboardStats(),
      recipeModel.collection.countDocuments(),
      commentModel.collection.countDocuments()
    ]);

    const dashboardData = {
      ...userStats,
      totalRecipes: recipeCount,
      totalComments: commentCount,
      adminInfo: {
        adminId: req.userId,
        fetchedAt: new Date()
      }
    };

    console.log(`✅ Admin ${req.userId} accessed dashboard`);

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching dashboard data'
    });
  }
});

// PUT /api/admin/users/:id/status - Blokér/aktiver bruger
router.put('/users/:id/status', [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('reason')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { isActive, reason } = req.body;
    const adminId = req.userId;

    // Forbyd admin at blokere sig selv
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own status'
      });
    }

    const userModel = new UserModel(req.db);
    await userModel.toggleUserStatus(userId, isActive);

    console.log(`✅ Admin ${adminId} ${isActive ? 'activated' : 'blocked'} user ${userId}${reason ? ` (${reason})` : ''}`);

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'blocked'} successfully`,
      data: {
        userId,
        isActive,
        reason: reason || null,
        updatedBy: adminId,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Admin toggle user status error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating user status'
    });
  }
});

// DELETE /api/admin/users/:id - Slet bruger (soft delete)
router.delete('/users/:id', [
  body('reason')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    // Forbyd admin at slette sig selv
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const userModel = new UserModel(req.db);
    await userModel.deleteUser(userId);

    console.log(`✅ Admin ${adminId} deleted user ${userId}${reason ? ` (${reason})` : ''}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        userId,
        reason: reason || null,
        deletedBy: adminId,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Admin delete user error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting user'
    });
  }
});

// PUT /api/admin/users/:id/promote - Opgradér bruger til admin
router.put('/users/:id/promote', [
  body('reason')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    const userModel = new UserModel(req.db);
    await userModel.promoteToAdmin(userId);

    console.log(`✅ Admin ${adminId} promoted user ${userId} to admin${reason ? ` (${reason})` : ''}`);

    res.json({
      success: true,
      message: 'User promoted to admin successfully',
      data: {
        userId,
        newRole: 'admin',
        reason: reason || null,
        promotedBy: adminId,
        promotedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Admin promote user error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while promoting user'
    });
  }
});

// ==== CONTENT MODERATION ====

// DELETE /api/admin/recipes/:id - Slet enhver opskrift (admin override)
router.delete('/recipes/:id', [
  body('reason')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { id: recipeId } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    const recipeModel = new RecipeModel(req.db);
    const commentModel = new CommentModel(req.db);

    // Hent recipe info først
    const recipe = await recipeModel.getRecipeById(recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    // Admin kan slette enhver opskrift (override ownership check)
    // Slet associerede kommentarer
    await commentModel.deleteCommentsByRecipe(recipeId);
    
    // Slet opskriften (admin override - direct database call)
    await recipeModel.collection.deleteOne({ _id: recipe._id });

    console.log(`✅ Admin ${adminId} deleted recipe ${recipeId} (${recipe.title})${reason ? ` (${reason})` : ''}`);

    // Emit Socket.io event
    if (req.io) {
      req.io.emit('adminRecipeDeleted', {
        recipeId,
        title: recipe.title,
        deletedBy: adminId,
        reason: reason || 'Admin moderation'
      });
    }

    res.json({
      success: true,
      message: 'Recipe deleted successfully by admin',
      data: {
        recipeId,
        title: recipe.title,
        originalAuthor: recipe.createdBy,
        reason: reason || null,
        deletedBy: adminId,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Admin delete recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting recipe'
    });
  }
});

// DELETE /api/admin/comments/:id - Slet enhver kommentar (admin override)
router.delete('/comments/:id', [
  body('reason')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    const commentModel = new CommentModel(req.db);

    // Hent comment info først
    const comment = await commentModel.collection.findOne({ _id: new ObjectId(commentId) });
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Admin kan slette enhver kommentar (override ownership check)
    await commentModel.collection.deleteOne({ _id: comment._id });

    console.log(`✅ Admin ${adminId} deleted comment ${commentId}${reason ? ` (${reason})` : ''}`);

    // Emit Socket.io event
    if (req.io) {
      req.io.emit('adminCommentDeleted', {
        commentId,
        recipeId: comment.recipeId,
        deletedBy: adminId,
        reason: reason || 'Admin moderation'
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully by admin',
      data: {
        commentId,
        recipeId: comment.recipeId,
        originalAuthor: comment.createdBy,
        reason: reason || null,
        deletedBy: adminId,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Admin delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting comment'
    });
  }
});

export default router; 