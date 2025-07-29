import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routers
import authRouter from './routes/authRouter.js';
import recipeRouter from './routes/recipeRouter.js';
import apiRouter from './routes/apiRouter.js';

// Import middlewares
import errorMiddleware from './middlewares/errorMiddleware.js';
import rateLimitMiddleware from './middlewares/rateLimitMiddleware.js';

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

// Global middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimitMiddleware);

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/recipes', recipeRouter);
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'FoodBook API is running!' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user-specific room when authenticated
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

server.listen(PORT, () => {
  console.log(`🚀 FoodBook API server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled on port ${PORT}`);
});

export { app, io }; 