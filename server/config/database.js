import { MongoClient } from 'mongodb';

class Database {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      console.log('🔌 Connecting to MongoDB Atlas...');
      
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
      
      // Brug 'foodbook' som database navn
      this.db = this.client.db('foodbook');
      
      console.log('✅ MongoDB Atlas connection established!');
      
      // Test forbindelsen
      await this.db.admin().ping();
      console.log('🏓 Database ping successful!');
      
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
        console.log('🔌 MongoDB connection closed');
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
      console.log('\n🔄 Received SIGINT. Closing database connection...');
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🔄 Received SIGTERM. Closing database connection...');
      await this.disconnect();
      process.exit(0);
    });
  }
}

// Singleton instance
const database = new Database();

export default database; 