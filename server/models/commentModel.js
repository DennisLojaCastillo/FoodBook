import { ObjectId } from 'mongodb';

// Comment model - MongoDB collection handler
class CommentModel {
  constructor(db) {
    this.collection = db.collection('comments');
  }

  // Opret ny kommentar
  async createComment(commentData) {
    try {
      const { text, recipeId, createdBy } = commentData;

      const newComment = {
        text,
        recipeId: new ObjectId(recipeId), // Recipe ID som ObjectId
        createdBy: new ObjectId(createdBy), // User ID som ObjectId
        createdAt: new Date()
      };

      const result = await this.collection.insertOne(newComment);
      
      // Returner kommentar med generated ID
      newComment._id = result.insertedId;
      
      return newComment;

    } catch (error) {
      console.error('❌ Error creating comment:', error);
      throw error;
    }
  }

  // Hent alle kommentarer for en opskrift med bruger info
  async getCommentsByRecipe(recipeId) {
    try {
      const recipeObjectId = new ObjectId(recipeId);
      
      // Aggregation pipeline for at få bruger info med
      const comments = await this.collection.aggregate([
        {
          $match: { recipeId: recipeObjectId }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'author'
          }
        },
        {
          $unwind: '$author'
        },
        {
          $project: {
            text: 1,
            recipeId: 1,
            createdAt: 1,
            'author.username': 1,
            'author._id': 1
          }
        },
        {
          $sort: { createdAt: -1 } // Nyeste først
        }
      ]).toArray();

      return comments;

    } catch (error) {
      console.error('❌ Error fetching comments by recipe:', error);
      throw error;
    }
  }

  // Opdater kommentar (kun ejeren kan opdatere)
  async updateComment(id, updateData, userId) {
    try {
      const objectId = new ObjectId(id);
      const userObjectId = new ObjectId(userId);

      // Tjek om brugeren ejer kommentaren
      const existingComment = await this.collection.findOne({
        _id: objectId,
        createdBy: userObjectId
      });

      if (!existingComment) {
        throw new Error('Comment not found or access denied');
      }

      // Opdater kun text feltet
      const { text } = updateData;
      const updateFields = {
        text,
        updatedAt: new Date()
      };

      const result = await this.collection.updateOne(
        { _id: objectId },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        throw new Error('Comment not found');
      }

      return result;

    } catch (error) {
      console.error('❌ Error updating comment:', error);
      throw error;
    }
  }

  // Slet kommentar (kun ejeren kan slette)
  async deleteComment(id, userId) {
    try {
      const objectId = new ObjectId(id);
      const userObjectId = new ObjectId(userId);

      // Tjek om brugeren ejer kommentaren
      const result = await this.collection.deleteOne({
        _id: objectId,
        createdBy: userObjectId
      });

      if (result.deletedCount === 0) {
        throw new Error('Comment not found or access denied');
      }

      return result;

    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      throw error;
    }
  }

  // Slet alle kommentarer for en opskrift (når opskrift slettes)
  async deleteCommentsByRecipe(recipeId) {
    try {
      const recipeObjectId = new ObjectId(recipeId);
      
      const result = await this.collection.deleteMany({
        recipeId: recipeObjectId
      });

      return result;

    } catch (error) {
      console.error('❌ Error deleting comments by recipe:', error);
      throw error;
    }
  }

  // Hent kommentarer fra en bruger (til profil)
  async getCommentsByUser(userId) {
    try {
      const userObjectId = new ObjectId(userId);
      
      const comments = await this.collection.aggregate([
        {
          $match: { createdBy: userObjectId }
        },
        {
          $lookup: {
            from: 'recipes',
            localField: 'recipeId',
            foreignField: '_id',
            as: 'recipe'
          }
        },
        {
          $unwind: '$recipe'
        },
        {
          $project: {
            text: 1,
            createdAt: 1,
            'recipe.title': 1,
            'recipe._id': 1
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ]).toArray();

      return comments;

    } catch (error) {
      console.error('❌ Error fetching comments by user:', error);
      throw error;
    }
  }

  // Tæl kommentarer for en opskrift
  async getCommentCount(recipeId) {
    try {
      const recipeObjectId = new ObjectId(recipeId);
      
      const count = await this.collection.countDocuments({
        recipeId: recipeObjectId
      });

      return count;

    } catch (error) {
      console.error('❌ Error counting comments:', error);
      throw error;
    }
  }

  // Hent seneste kommentarer (til dashboard/feed)
  async getRecentComments(limit = 10) {
    try {
      const comments = await this.collection.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'author'
          }
        },
        {
          $unwind: '$author'
        },
        {
          $lookup: {
            from: 'recipes',
            localField: 'recipeId',
            foreignField: '_id',
            as: 'recipe'
          }
        },
        {
          $unwind: '$recipe'
        },
        {
          $project: {
            text: 1,
            createdAt: 1,
            'author.username': 1,
            'author._id': 1,
            'recipe.title': 1,
            'recipe._id': 1
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]).toArray();

      return comments;

    } catch (error) {
      console.error('❌ Error fetching recent comments:', error);
      throw error;
    }
  }
}

export default CommentModel; 