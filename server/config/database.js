import { MongoClient } from 'mongodb';

class Database {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      console.log('🔌 Forbinder til MongoDB Atlas...');
      
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
      
      // Brug 'foodbook' som database navn
      this.db = this.client.db('foodbook');
      
      console.log('✅ MongoDB Atlas forbindelse etableret!');
      
      // Test forbindelsen
      await this.db.admin().ping();
      console.log('🏓 Database ping succesfil!');
      
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB forbindelsesfejl:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        console.log('🔌 MongoDB forbindelse lukket');
      }
    } catch (error) {
      console.error('❌ Fejl ved lukning af MongoDB forbindelse:', error);
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database ikke forbundet. Kald connect() først.');
    }
    return this.db;
  }

  // Graceful shutdown
  setupGracefulShutdown() {
    process.on('SIGINT', async () => {
      console.log('\n🔄 Modtog SIGINT. Lukker database forbindelse...');
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🔄 Modtog SIGTERM. Lukker database forbindelse...');
      await this.disconnect();
      process.exit(0);
    });
  }
}

// Singleton instance
const database = new Database();

export default database; 