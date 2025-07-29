import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

// User model - MongoDB collection handler
class UserModel {
  constructor(db) {
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

  // Hent bruger med favoritter (til profil)
  async getUserWithFavorites(userId) {
    try {
      const objectId = new ObjectId(userId);
      const user = await this.collection.findOne({ _id: objectId });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Returner uden password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('❌ Error getting user with favorites:', error);
      throw error;
    }
  }
}

export default UserModel; 