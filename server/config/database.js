import { MongoClient } from 'mongodb';

class Database {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
      
      // Brug 'foodbook' som database navn
      this.db = this.client.db('foodbook');
      
      // Test forbindelsen
      await this.db.admin().ping();
      
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
      }
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  // Graceful shutdown
  setupGracefulShutdown() {
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }
}

// Singleton instance
const database = new Database();

export default database; 