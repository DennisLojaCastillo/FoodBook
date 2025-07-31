import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

// User model - MongoDB collection handler
class UserModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('users');
  }

  // Opret ny bruger med hashed password
  async createUser(userData) {
    try {
      const { username, email, password, role = 'user' } = userData;

      // Tjek om email allerede eksisterer
      const existingUser = await this.collection.findOne({ email });
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Opret bruger objekt
      const newUser = {
        username,
        email,
        password: hashedPassword,
        role,
        favorites: [], // Array af recipe IDs
        createdAt: new Date()
      };

      // Indsæt i database
      const result = await this.collection.insertOne(newUser);
      
      // Returner bruger uden password
      const { password: _, ...userWithoutPassword } = newUser;
      userWithoutPassword._id = result.insertedId;
      
      console.log(`✅ User created: ${email}`);
      return userWithoutPassword;

    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  // Find bruger med email (til login)
  async findUserByEmail(email) {
    try {
      const user = await this.collection.findOne({ email });
      return user;
    } catch (error) {
      console.error('❌ Error finding user by email:', error);
      throw error;
    }
  }

  // Find bruger med ID (til token verification)
  async findUserById(id) {
    try {
      const objectId = new ObjectId(id);
      const user = await this.collection.findOne({ _id: objectId });
      
      if (user) {
        // Returner uden password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      return null;
    } catch (error) {
      console.error('❌ Error finding user by ID:', error);
      throw error;
    }
  }

  // Opdater bruger oplysninger
  async updateUser(id, updateData) {
    try {
      const objectId = new ObjectId(id);
      
      // Fjern følsomme felter fra update
      const { password, _id, ...safeUpdateData } = updateData;
      safeUpdateData.updatedAt = new Date();

      const result = await this.collection.updateOne(
        { _id: objectId },
        { $set: safeUpdateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      console.log(`✅ User updated: ${id}`);
      return result;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  // Tilføj favorit opskrift
  async addFavorite(userId, recipeId) {
    try {
      const userObjectId = new ObjectId(userId);
      
      // Tjek om favorit allerede eksisterer
      const user = await this.collection.findOne({ 
        _id: userObjectId,
        favorites: recipeId 
      });

      if (user) {
        throw new Error('Recipe already in favorites');
      }

      const result = await this.collection.updateOne(
        { _id: userObjectId },
        { 
          $push: { favorites: recipeId },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      console.log(`✅ Favorite added: ${recipeId} to user ${userId}`);
      return result;
    } catch (error) {
      console.error('❌ Error adding favorite:', error);
      throw error;
    }
  }

  // Fjern favorit opskrift
  async removeFavorite(userId, recipeId) {
    try {
      const userObjectId = new ObjectId(userId);
      
      const result = await this.collection.updateOne(
        { _id: userObjectId },
        { 
          $pull: { favorites: recipeId },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      console.log(`✅ Favorite removed: ${recipeId} from user ${userId}`);
      return result;
    } catch (error) {
      console.error('❌ Error removing favorite:', error);
      throw error;
    }
  }

  // Verificer password (til login)
  async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('❌ Error verifying password:', error);
      throw error;
    }
  }

  // Hent bruger med komplet profil data (til profil)
  async getUserWithFavorites(userId) {
    try {
      const objectId = new ObjectId(userId);
      const user = await this.collection.findOne({ _id: objectId });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Returner uden password
      const { password, ...userWithoutPassword } = user;

      // Hent brugerens oprettede opskrifter
      const recipesCollection = this.db.collection('recipes');
      const userRecipes = await recipesCollection.find({
        createdBy: objectId
      })
      .sort({ createdAt: -1 })
      .toArray();

      // Hent lokale favorit opskrifter (populate favorites array)
      let localFavorites = [];
      if (user.favorites && user.favorites.length > 0) {
        // Konverter favorites til ObjectIds
        const favoriteIds = user.favorites.map(id => 
          typeof id === 'string' ? new ObjectId(id) : id
        );
        
        localFavorites = await recipesCollection.find({
          _id: { $in: favoriteIds }
        }).toArray();
      }

      // Hent eksterne favorit opskrifter
      const externalFavoritesCollection = this.db.collection('external_favorites');
      const externalFavorites = await externalFavoritesCollection.find({
        userId: userId // External favorites gemmes med string userId
      })
      .sort({ savedAt: -1 })
      .toArray();

      console.log(`✅ Fetched complete profile for user ${userId}: ${userRecipes.length} recipes, ${localFavorites.length} local favorites, ${externalFavorites.length} external favorites`);

      return {
        ...userWithoutPassword,
        myRecipes: userRecipes,
        localFavorites: localFavorites,
        externalFavorites: externalFavorites,
        stats: {
          totalRecipes: userRecipes.length,
          totalLocalFavorites: localFavorites.length,
          totalExternalFavorites: externalFavorites.length
        }
      };
    } catch (error) {
      console.error('❌ Error getting user with complete profile:', error);
      throw error;
    }
  }

  // ==== ADMIN METHODS ====

  // Hent alle brugere (kun admin)
  async getAllUsers(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const users = await this.collection.aggregate([
        {
          $match: { isDeleted: { $ne: true } } // Ekskluder soft deleted users
        },
        {
          $project: {
            password: 0 // Ekskluder passwords
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: parseInt(limit)
        }
      ]).toArray();

      const totalCount = await this.collection.countDocuments({ isDeleted: { $ne: true } });

      console.log(`✅ Fetched ${users.length} users for admin (page ${page})`);

      return {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalUsers: totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('❌ Error getting all users:', error);
      throw error;
    }
  }

  // Blokér/aktiver bruger (admin)
  async toggleUserStatus(userId, isActive) {
    try {
      const objectId = new ObjectId(userId);
      
      const result = await this.collection.updateOne(
        { _id: objectId, isDeleted: { $ne: true } },
        { 
          $set: { 
            isActive: isActive,
            statusUpdatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      console.log(`✅ User ${userId} ${isActive ? 'activated' : 'blocked'}`);
      return result;

    } catch (error) {
      console.error('❌ Error toggling user status:', error);
      throw error;
    }
  }

  // Slet bruger (admin) - soft delete
  async deleteUser(userId) {
    try {
      const objectId = new ObjectId(userId);
      
      // Soft delete - marker som slettet i stedet for faktisk sletning
      const result = await this.collection.updateOne(
        { _id: objectId },
        { 
          $set: { 
            isDeleted: true,
            deletedAt: new Date(),
            email: `deleted_${Date.now()}@deleted.com` // Gør email unik
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      console.log(`✅ User ${userId} soft deleted`);
      return result;

    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  // Opgradér bruger til admin
  async promoteToAdmin(userId) {
    try {
      const objectId = new ObjectId(userId);
      
      const result = await this.collection.updateOne(
        { _id: objectId, isDeleted: { $ne: true } },
        { 
          $set: { 
            role: 'admin',
            promotedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      console.log(`✅ User ${userId} promoted to admin`);
      return result;

    } catch (error) {
      console.error('❌ Error promoting user:', error);
      throw error;
    }
  }

  // Hent admin dashboard statistikker
  async getAdminDashboardStats() {
    try {
      const totalUsers = await this.collection.countDocuments({ isDeleted: { $ne: true } });
      const activeUsers = await this.collection.countDocuments({ 
        isActive: { $ne: false }, 
        isDeleted: { $ne: true } 
      });
      const adminUsers = await this.collection.countDocuments({ 
        role: 'admin',
        isDeleted: { $ne: true }
      });
      
      // Brugere registreret i dag
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const usersToday = await this.collection.countDocuments({
        createdAt: { $gte: today },
        isDeleted: { $ne: true }
      });

      console.log(`✅ Admin dashboard stats generated`);

      return {
        totalUsers,
        activeUsers,
        adminUsers,
        blockedUsers: totalUsers - activeUsers,
        usersToday,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Error getting admin dashboard stats:', error);
      throw error;
    }
  }
}

export default UserModel; 