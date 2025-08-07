import 'dotenv/config';
import validateEnvironmentVariables from './config/envValidation.js';

// Validate environment variables before starting anything
validateEnvironmentVariables();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import database
import database from './config/database.js';

// Import routers
import authRouter from './routes/authRouter.js';
import recipeRouter from './routes/recipeRouter.js';
import apiRouter from './routes/apiRouter.js';
import adminRouter from './routes/adminRouter.js';

// Import middlewares
import errorMiddleware from './middlewares/errorMiddleware.js';
import { apiLimit } from './middlewares/rateLimitMiddleware.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Global middleware - only parse JSON for application/json content-type
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json' // Only parse requests with Content-Type: application/json
}));
app.use(express.urlencoded({ 
  extended: true,
  type: 'application/x-www-form-urlencoded' // Only parse URL-encoded data, not multipart
}));
app.use(apiLimit);

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

// Initialize database connection
async function startServer() {
  try {
    // Connect to MongoDB
    const db = await database.connect();
    
    // Make database accessible to routes
    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    // Routes - efter database connection
    app.use('/api/auth', authRouter);
    app.use('/api/recipes', recipeRouter);
    app.use('/api/admin', adminRouter);
    app.use('/api', apiRouter);

    // Health check endpoint with database status (MUST be before catch-all)
    app.get('/health', async (req, res) => {
      try {
        const healthStatus = {
          status: 'OK',
          message: 'FoodBook API is running!',
          timestamp: new Date().toISOString(),
          database: 'unknown'
        };

        // Test database connection if available
        if (req.db) {
          try {
            await req.db.admin().ping();
            healthStatus.database = 'connected';
          } catch (dbError) {
            healthStatus.database = 'disconnected';
            healthStatus.status = 'DEGRADED';
            healthStatus.message = 'API running but database issues detected';
          }
        } else {
          healthStatus.database = 'not_initialized';
          healthStatus.status = 'STARTING';
          healthStatus.message = 'API starting up...';
        }

        // Set HTTP status based on health
        const httpStatus = healthStatus.status === 'OK' ? 200 : 503;
        res.status(httpStatus).json(healthStatus);

      } catch (error) {
        res.status(503).json({
          status: 'ERROR',
          message: 'Health check failed',
          timestamp: new Date().toISOString(),
          database: 'error'
        });
      }
    });

    // Catch-all for 404 errors (must be AFTER all routes including health check)
    app.use('*', (req, res, next) => {
      const error = new Error(`Cannot ${req.method} ${req.originalUrl}`);
      error.status = 404;
      next(error);
    });

    // Error handling middleware (must be AFTER routes and 404 handler)
    app.use(errorMiddleware);

    // Setup graceful shutdown
    database.setupGracefulShutdown();

    // Start server after database connection
    server.listen(PORT, () => {
      // Server started successfully
    });

  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  // User connected
  
  // Join user-specific room when authenticated
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on('disconnect', () => {
    // User disconnected
  });
});

// Start server with database connection
startServer();

export { app, io }; 