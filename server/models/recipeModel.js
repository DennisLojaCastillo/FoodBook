import { ObjectId } from 'mongodb';

// Recipe model - MongoDB collection handler
class RecipeModel {
  constructor(db) {
    this.collection = db.collection('recipes');
  }

  // Opret ny opskrift
  async createRecipe(recipeData) {
    try {
      const { 
        title, 
        description, 
        ingredients, 
        instructions, // Changed from 'steps' to match external API
        createdBy,
        // New fields for unified structure
        thumbnail,
        videoUrl,
        servings,
        totalTimeCookingMinutes,
        tags,
        nutrition
      } = recipeData;

      const newRecipe = {
        // Core recipe data
        title,
        description, 
        ingredients, // Array af strings
        instructions, // Array af strings (renamed from 'steps')
        
        // Media & Visual
        thumbnail: thumbnail || null,
        videoUrl: videoUrl || null,
        
        // Recipe metadata
        servings: servings || null,
        totalTimeCookingMinutes: totalTimeCookingMinutes || null,
        tags: tags || [],
        
        // Nutrition info (optional)
        nutrition: nutrition || null,
        
        // Source & Attribution  
        source: 'local', // Always 'local' for user-created recipes
        originalUrl: null, // Not applicable for local recipes
        
        // Local-specific fields
        createdBy: new ObjectId(createdBy), // User ID som ObjectId
        createdAt: new Date(),
        favoriteCount: 0 // Start med 0 favoritter
      };

      const result = await this.collection.insertOne(newRecipe);
      
      // Returner opskrift med generated ID
      newRecipe._id = result.insertedId;
      
      console.log(`✅ Unified recipe created: ${title} by user ${createdBy}`);
      return newRecipe;

    } catch (error) {
      console.error('❌ Error creating recipe:', error);
      throw error;
    }
  }

  // Hent alle opskrifter med pagination
  async getAllRecipes(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      // Aggregation pipeline for at få bruger info med
      const recipes = await this.collection.aggregate([
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
            title: 1,
            description: 1,
            ingredients: 1,
            steps: 1,
            createdAt: 1,
            favoriteCount: 1,
            'author.username': 1,
            'author._id': 1
          }
        },
        {
          $sort: { createdAt: -1 } // Nyeste først
        },
        {
          $skip: skip
        },
        {
          $limit: parseInt(limit)
        }
      ]).toArray();

      // Få total count for pagination
      const totalCount = await this.collection.countDocuments();
      
      console.log(`✅ Fetched ${recipes.length} recipes (page ${page})`);
      
      return {
        recipes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalRecipes: totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('❌ Error fetching recipes:', error);
      throw error;
    }
  }

  // Hent enkelt opskrift med bruger info
  async getRecipeById(id) {
    try {
      const objectId = new ObjectId(id);
      
      const recipe = await this.collection.aggregate([
        {
          $match: { _id: objectId }
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
            title: 1,
            description: 1,
            ingredients: 1,
            steps: 1,
            createdAt: 1,
            favoriteCount: 1,
            'author.username': 1,
            'author._id': 1
          }
        }
      ]).toArray();

      if (recipe.length === 0) {
        return null;
      }

      console.log(`✅ Fetched recipe: ${recipe[0].title}`);
      return recipe[0];

    } catch (error) {
      console.error('❌ Error fetching recipe by ID:', error);
      throw error;
    }
  }

  // Opdater opskrift (kun ejeren kan opdatere)
  async updateRecipe(id, updateData, userId) {
    try {
      const objectId = new ObjectId(id);
      const userObjectId = new ObjectId(userId);

      // Tjek om brugeren ejer opskriften
      const existingRecipe = await this.collection.findOne({
        _id: objectId,
        createdBy: userObjectId
      });

      if (!existingRecipe) {
        throw new Error('Recipe not found or access denied');
      }

      // Tillad kun certain felter at blive opdateret (unified structure)
      const { 
        title, 
        description, 
        ingredients, 
        instructions, // Changed from 'steps'
        thumbnail,
        videoUrl,
        servings,
        totalTimeCookingMinutes,
        tags,
        nutrition
      } = updateData;
      
      const updateFields = {
        // Core recipe data
        ...(title && { title }),
        ...(description && { description }),
        ...(ingredients && { ingredients }),
        ...(instructions && { instructions }), // Changed from 'steps'
        
        // Media & Visual
        ...(thumbnail !== undefined && { thumbnail }),
        ...(videoUrl !== undefined && { videoUrl }),
        
        // Recipe metadata
        ...(servings !== undefined && { servings }),
        ...(totalTimeCookingMinutes !== undefined && { totalTimeCookingMinutes }),
        ...(tags && { tags }),
        
        // Nutrition info
        ...(nutrition !== undefined && { nutrition }),
        
        // Always update timestamp
        updatedAt: new Date()
      };

      const result = await this.collection.updateOne(
        { _id: objectId },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        throw new Error('Recipe not found');
      }

      console.log(`✅ Recipe updated: ${id} by user ${userId}`);
      return result;

    } catch (error) {
      console.error('❌ Error updating recipe:', error);
      throw error;
    }
  }

  // Slet opskrift (kun ejeren kan slette)
  async deleteRecipe(id, userId) {
    try {
      const objectId = new ObjectId(id);
      const userObjectId = new ObjectId(userId);

      // Tjek om brugeren ejer opskriften
      const result = await this.collection.deleteOne({
        _id: objectId,
        createdBy: userObjectId
      });

      if (result.deletedCount === 0) {
        throw new Error('Recipe not found or access denied');
      }

      console.log(`✅ Recipe deleted: ${id} by user ${userId}`);
      return result;

    } catch (error) {
      console.error('❌ Error deleting recipe:', error);
      throw error;
    }
  }

  // Hent opskrifter fra specifik bruger
  async getRecipesByUser(userId) {
    try {
      const userObjectId = new ObjectId(userId);
      
      const recipes = await this.collection.find({
        createdBy: userObjectId
      })
      .sort({ createdAt: -1 })
      .toArray();

      console.log(`✅ Fetched ${recipes.length} recipes for user ${userId}`);
      return recipes;

    } catch (error) {
      console.error('❌ Error fetching recipes by user:', error);
      throw error;
    }
  }

  // Øg favorit tæller
  async incrementFavoriteCount(recipeId) {
    try {
      const objectId = new ObjectId(recipeId);
      
      const result = await this.collection.updateOne(
        { _id: objectId },
        { 
          $inc: { favoriteCount: 1 },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Recipe not found');
      }

      console.log(`✅ Favorite count incremented for recipe: ${recipeId}`);
      return result;

    } catch (error) {
      console.error('❌ Error incrementing favorite count:', error);
      throw error;
    }
  }

  // Reducer favorit tæller
  async decrementFavoriteCount(recipeId) {
    try {
      const objectId = new ObjectId(recipeId);
      
      const result = await this.collection.updateOne(
        { _id: objectId },
        { 
          $inc: { favoriteCount: -1 },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Recipe not found');
      }

      console.log(`✅ Favorite count decremented for recipe: ${recipeId}`);
      return result;

    } catch (error) {
      console.error('❌ Error decrementing favorite count:', error);
      throw error;
    }
  }

  // Søg opskrifter (til search funktionalitet)
  async searchRecipes(query, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const searchRegex = new RegExp(query, 'i'); // Case-insensitive
      
      const recipes = await this.collection.aggregate([
        {
          $match: {
            $or: [
              { title: searchRegex },
              { description: searchRegex },
              { ingredients: { $elemMatch: { $regex: searchRegex } } }
            ]
          }
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
            title: 1,
            description: 1,
            ingredients: 1,
            steps: 1,
            createdAt: 1,
            favoriteCount: 1,
            'author.username': 1,
            'author._id': 1
          }
        },
        {
          $sort: { favoriteCount: -1, createdAt: -1 } // Sorter efter popularitet, så nyeste
        },
        {
          $skip: skip
        },
        {
          $limit: parseInt(limit)
        }
      ]).toArray();

      console.log(`✅ Search found ${recipes.length} recipes for query: "${query}"`);
      return recipes;

    } catch (error) {
      console.error('❌ Error searching recipes:', error);
      throw error;
    }
  }
}

export default RecipeModel; 