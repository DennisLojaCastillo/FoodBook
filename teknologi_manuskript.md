# 🍽️ FoodBook - Teknologi Manuskript til Eksamen

## Indledning

FoodBook er en moderne fullstack webudvikling med fokus på opskriftsdeling og brugeradministration. Projektet demonstrerer implementering af avancerede webudviklingsteknologier i en real-world applikation med både frontend og backend komponenter.

---

## 🛠️ Teknologioversigt

### Backend Teknologier
- **Node.js + Express.js** - Server runtime og web framework
- **MongoDB** - NoSQL database
- **bcrypt** - Password hashing
- **JWT (JSON Web Tokens)** - Authentication
- **express-validator** - Input validering
- **express-rate-limit** - Rate limiting/sikkerhed
- **cors** - Cross-Origin Resource Sharing
- **Socket.io** - Real-time kommunikation
- **node-cache** - Caching system
- **Multer** - File upload middleware

### Frontend Teknologier
- **Svelte** - Component-based framework
- **Vite** - Build tool og development server
- **Tailwind CSS** - Utility-first CSS framework
- **Navigo** - Client-side routing
- **Socket.io-client** - Real-time client
- **Axios/Fetch API** - HTTP client

### Eksterne Integrationer
- **Tasty API (RapidAPI)** - Eksterne opskrifter
- **MongoDB Atlas** - Cloud database hosting

---

## 📋 Detaljerede Teknologi Forklaringer

### 1. Node.js + Express.js

**Hvad er det?**
Node.js er en JavaScript runtime der kører på serveren, mens Express.js er et minimalistisk web framework til Node.js.

**Hvorfor valgt?**
- JavaScript på både frontend og backend (fuld stack konsistens)
- Høj performance med event-driven, non-blocking I/O
- Stort økosystem af packages (npm)
- Perfekt til API udvikling og real-time applikationer

**Hvordan implementeret?**
```javascript
// server/app.js - Hovedserver setup
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimit); // Rate limiting

// Routes
app.use('/api/auth', authRouter);
app.use('/api/recipes', recipeRouter);
app.use('/api/admin', adminRouter);
app.use('/api', apiRouter);
```

**Arkitektur:**
- Modular route struktur (`routes/` folder)
- Middleware pattern for cross-cutting concerns
- Graceful error handling med centralized error middleware
- Environment variable validation ved startup

### 2. MongoDB med Native Driver

**Hvad er det?**
MongoDB er en NoSQL dokument-database. Jeg bruger den native MongoDB driver i stedet for Mongoose.

**Hvorfor valgt?**
- Fleksibel schema design perfekt til opskrifter med varierende struktur
- Native driver giver fuld kontrol og bedre performance
- JSON-lignende dokumenter matcher JavaScript objekter naturligt
- Skalérbar til store mængder bruger- og opskriftdata

**Hvordan implementeret?**
```javascript
// server/config/database.js - Database connection
import { MongoClient } from 'mongodb';

class Database {
  async connect() {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db('foodbook');
      
      // Test forbindelsen
      await this.db.admin().ping();
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }
}

// server/models/recipeModel.js - Model pattern
class RecipeModel {
  constructor(db) {
    this.collection = db.collection('recipes');
  }

  async createRecipe(recipeData) {
    const result = await this.collection.insertOne({
      ...recipeData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return await this.collection.findOne({ _id: result.insertedId });
  }
}
```

**Datastruktur:**
- **Users collection**: Brugerdata, roller, favoritter
- **Recipes collection**: Opskrifter med ingredienser, instruktioner, metadata
- **Comments collection**: Kommentarer til opskrifter
- **External favorites**: Cache for eksterne opskrifter fra Tasty API

### 3. bcrypt - Password Hashing

**Hvad er det?**
bcrypt er et password hashing library baseret på Blowfish cipher algoritmen.

**Hvorfor valgt?**
- Industristandard for sikker password hashing
- Adaptive hashing - kan justere kompleksitet over tid
- Salt er automatisk inkluderet
- Beskytter mod rainbow table attacks

**Hvordan implementeret?**
```javascript
// server/models/userModel.js
import bcrypt from 'bcrypt';

class UserModel {
  async createUser(userData) {
    // Hash password før gem
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    const newUser = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    const result = await this.collection.insertOne(newUser);
    return await this.findUserById(result.insertedId);
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
```

**Sikkerhedsfeatures:**
- Salt rounds: 12 (høj sikkerhed)
- Passwords gemmes aldrig i plain text
- Automatic salt generation
- Timing-safe comparison

### 4. JWT (JSON Web Tokens) Authentication

**Hvad er det?**
JWT er en åben standard for sikker transmission af information mellem parter som JSON objekter.

**Hvorfor valgt?**
- Stateless authentication (ingen session storage på server)
- Skalérbar til microservices arkitektur
- Self-contained - indeholder bruger information
- Perfekt til SPA (Single Page Applications)

**Hvordan implementeret?**
```javascript
// server/routes/authRouter.js - Token generation
import jwt from 'jsonwebtoken';

const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// server/middlewares/jwtMiddleware.js - Token verification
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};
```

**Token Strategy:**
- **Access tokens**: 15 minutter levetid, til API calls
- **Refresh tokens**: 7 dage levetid, til fornyelse
- Automatic token refresh på client-side
- Secure token storage i localStorage

### 5. Express Middleware Ecosystem

**Hvad er det?**
Middleware er funktioner der har adgang til request/response objekterne og kan modificere dem.

**Hvorfor valgt?**
- Modulær arkitektur med separation of concerns
- Genanvendelige komponenter
- Pipeline processing af requests
- Centralized cross-cutting concerns

**Hvordan implementeret?**

**Rate Limiting:**
```javascript
// server/middlewares/rateLimitMiddleware.js
import rateLimit from 'express-rate-limit';

export const apiLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutter
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

export const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Kun 5 login attempts per 15 min
  skipSuccessfulRequests: true
});
```

**Error Handling:**
```javascript
// server/middlewares/errorMiddleware.js
const errorMiddleware = (err, req, res, next) => {
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} already exists`;
    error.status = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  res.status(error.status).json(error);
};
```

**Input Validation:**
```javascript
// server/middlewares/validationMiddleware.js
import { validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};
```

### 6. Svelte Frontend Framework

**Hvad er det?**
Svelte er et moderne component-based JavaScript framework der kompilerer til vanilla JavaScript.

**Hvorfor valgt?**
- Kompileret framework = mindre bundle size og bedre performance
- Reaktivitet bygget ind i sproget
- Minimal boilerplate kode
- Excellent developer experience
- No virtual DOM overhead

**Hvordan implementeret?**
```javascript
// client/src/App.svelte - Main application component
<script>
  import { onMount } from 'svelte';
  import Navigo from 'navigo';
  import { auth } from './stores/auth.js';
  
  let currentComponent = Home;
  let router;
  let authState = { isLoggedIn: false, user: null, isLoading: true };
  
  // Reactive subscription til auth state
  const unsubscribe = auth.subscribe(state => {
    authState = state;
    if (!state.isLoading && router) {
      evaluateRoute(currentRoute, currentRouteParams);
    }
  });

  onMount(() => {
    auth.init(); // Initialize auth
    setupRouter(); // Setup routing
  });
</script>

<!-- Reactive rendering -->
<div class="min-h-screen flex flex-col">
  <Header />
  <main class="flex-1">
    {#if authState.isLoading}
      <div class="animate-spin w-8 h-8 border-4 border-blue-600"></div>
    {:else}
      <svelte:component this={currentComponent} params={currentParams} />
    {/if}
  </main>
  <Footer />
</div>
```

**Component Architecture:**
- **Pages**: Hovedsider som komponenter (`pages/` folder)
- **Components**: Genanvendelige UI komponenter (`components/` folder)
- **Stores**: Global state management (`stores/` folder)
- **Lib**: Utility funktioner og API client (`lib/` folder)

**Reactive State Management:**
```javascript
// client/src/stores/auth.js - Svelte store
import { writable } from 'svelte/store';

function createAuthStore() {
  const { subscribe, set, update } = writable({
    isLoggedIn: false,
    user: null,
    isLoading: false,
    error: null
  });

  return {
    subscribe,
    async login(email, password) {
      update(state => ({ ...state, isLoading: true }));
      try {
        const response = await api.login(email, password);
        set({
          isLoggedIn: true,
          user: response.data.user,
          isLoading: false,
          error: null
        });
      } catch (error) {
        set({ isLoggedIn: false, user: null, isLoading: false, error: error.message });
      }
    }
  };
}

export const auth = createAuthStore();
```

### 7. Vite Build Tool

**Hvad er det?**
Vite er en moderne build tool og development server der bruger ES modules og esbuild.

**Hvorfor valgt?**
- Ekstrem hurtig development server (Hot Module Replacement)
- Optimeret production builds
- Native ES modules support
- Plugin ecosystem
- Out-of-the-box TypeScript support

**Hvordan implementeret?**
```javascript
// client/vite.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```

**Development Features:**
- Instant server start
- Hot Module Replacement (HMR)
- API proxy til backend
- Source maps for debugging
- CSS preprocessing support

### 8. Tailwind CSS

**Hvad er det?**
Tailwind CSS er et utility-first CSS framework der giver low-level utility classes.

**Hvorfor valgt?**
- Rapid prototyping og development
- Konsistent design system
- Mindre CSS bundle size (kun brugte classes)
- Responsive design utilities
- Customizable design tokens

**Hvordan implementeret?**
```javascript
// client/tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,svelte}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

```css
/* client/src/app.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom global styles */
:root {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  transition: colors 0.2s ease-in-out;
}
```

**Usage Examples:**
```html
<!-- Responsive grid layout -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  
<!-- Button styling -->
<button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
  Create Recipe
</button>

<!-- Form styling med plugins -->
<input class="form-input rounded-lg border-gray-300 focus:border-blue-500" />
```

### 9. Navigo Client-Side Routing

**Hvad er det?**
Navigo er et lightweight JavaScript router til Single Page Applications.

**Hvorfor valgt?**
- Lille bundle size (kun 4KB)
- Hash-based routing (compatible med alle servere)
- Parameterized routes
- Route guards og middleware
- Simple API

**Hvordan implementeret?**
```javascript
// client/src/App.svelte - Router setup
import Navigo from 'navigo';

onMount(() => {
  router = new Navigo('/', { hash: true });
  
  router
    // Public routes
    .on('/', () => evaluateRoute('/'))
    .on('/recipes', () => evaluateRoute('/recipes'))
    .on('/recipe/:id', (match) => {
      evaluateRoute('/recipe/:id', { id: match.data.id });
    })
    
    // Protected routes
    .on('/dashboard', () => evaluateRoute('/dashboard'))
    .on('/create-recipe', () => evaluateRoute('/create-recipe'))
    
    // Admin routes
    .on('/admin', () => evaluateRoute('/admin'))
    
    .resolve();
});

// Route guards implementation
function requireAuth(component, params = {}) {
  if (!authState.isLoggedIn) {
    notifications.warning('You need to be logged in');
    router.navigate('/login');
    return;
  }
  currentComponent = component;
  currentParams = params;
}

function requireAdmin(component, params = {}) {
  if (authState.user?.role !== 'admin') {
    notifications.error('Admin access required');
    router.navigate('/dashboard');
    return;
  }
  currentComponent = component;
  currentParams = params;
}
```

**Routing Features:**
- Hash-based routing (`#/dashboard`)
- Dynamic route parameters (`/recipe/:id`)
- Route guards for authentication
- Programmatic navigation
- Browser history support

### 10. Socket.io Real-time Communication

**Hvad er det?**
Socket.io er et real-time bidirectional communication library der bruger WebSockets.

**Hvorfor valgt?**
- Real-time notifications og opdateringer
- Automatic fallback til polling hvis WebSockets ikke virker
- Room-based messaging
- Connection management
- Cross-browser compatibility

**Hvordan implementeret?**

**Server Side:**
```javascript
// server/app.js - Socket.io server setup
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user-specific room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Emit events from routes
// server/routes/recipeRouter.js
if (req.io) {
  req.io.emit('newRecipe', {
    recipe: newRecipe,
    message: `New recipe "${title}" created`
  });
}
```

**Client Side:**
```javascript
// client/package.json dependencies
"socket.io-client": "^4.8.1"

// Real-time connection (would be in a component)
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected to server');
  if (user) {
    socket.emit('join-user-room', user.id);
  }
});

socket.on('newRecipe', (data) => {
  notifications.success(data.message);
  // Update UI with new recipe
});
```

### 11. Tasty API Integration

**Hvad er det?**
Tasty API (via RapidAPI) giver adgang til tusindvis af opskrifter fra BuzzFeed's Tasty platform.

**Hvorfor valgt?**
- Rig database af professionelle opskrifter
- High-quality billeder og videoer
- Struktureret data format
- Nutrition information
- Search og autocomplete funktionalitet

**Hvordan implementeret?**
```javascript
// server/services/tastyApiService.js
import https from 'https';
import NodeCache from 'node-cache';

class TastyApiService {
  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY;
    this.apiHost = process.env.RAPIDAPI_HOST || 'tasty.p.rapidapi.com';
    this.cache = new NodeCache({ stdTTL: 900 }); // 15 min cache
  }

  async makeRequest(endpoint, queryParams = {}) {
    const queryString = Object.keys(queryParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
    
    const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    // Check cache first
    const cacheKey = `tasty_${endpoint}_${queryString}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) return cachedData;

    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': this.apiHost
      }
    };

    const data = await this.httpRequest(url, options);
    this.cache.set(cacheKey, data); // Cache result
    return data;
  }

  async searchRecipes(query, from = 0, size = 20) {
    const response = await this.makeRequest('/recipes/list', {
      from, size: Math.min(size, 40), q: query
    });
    
    // Transform til vores format
    const transformedRecipes = response.results.map(recipe => ({
      externalId: recipe.id,
      title: recipe.name || 'Untitled Recipe',
      description: recipe.description || 'No description available',
      thumbnail: recipe.thumbnail_url || null,
      videoUrl: recipe.original_video_url || null,
      source: 'tasty',
      ingredients: this.extractIngredients(recipe.sections),
      instructions: this.extractInstructions(recipe.instructions),
      nutrition: recipe.nutrition || null
    }));

    return { recipes: transformedRecipes, total: response.count };
  }
}
```

**Caching Strategy:**
- **NodeCache**: 15 minutters cache for API responses
- **Rate limiting**: Separate limits for external API calls
- **Error handling**: Graceful degradation hvis API er nede
- **Data transformation**: Konverter API format til vores interne format

### 12. File Upload med Multer

**Hvad er det?**
Multer er middleware til håndtering af multipart/form-data, primært til file uploads.

**Hvorfor valgt?**
- Sikker file upload handling
- Filetype validation
- File size limits
- Automatic file naming
- Integration med Express

**Hvordan implementeret?**
```javascript
// server/middlewares/uploadMiddleware.js
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const uploadRecipeImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: fileFilter
}).single('thumbnail');
```

**Security Features:**
- File type validation (kun billeder)
- File size limits (5MB max)
- Unique filenames for at undgå konflikter
- Separate uploads directory
- Error handling for invalid uploads

---

## 🔒 Sikkerhedsimplementering

### Authentication & Authorization
- **JWT tokens** med short-lived access tokens (15 min) og long-lived refresh tokens (7 dage)
- **bcrypt hashing** med salt rounds 12 for passwords
- **Role-based access control** (user/admin roller)
- **Route guards** på både frontend og backend

### Rate Limiting
- **General API**: 100 requests per 15 minutter
- **Authentication endpoints**: 5 attempts per 15 minutter
- **External API calls**: 10 requests per minut
- **Recipe creation**: 5 recipes per minut
- **Comments**: 10 comments per minut

### Input Validation
- **express-validator** for server-side validation
- **CORS konfiguration** for cross-origin requests
- **File upload validation** (type, size, destination)
- **SQL injection prevention** (MongoDB's natural protection)

### Error Handling
- **Centralized error middleware** for konsistent error responses
- **Graceful degradation** når eksterne services er nede
- **Logging** af sikkerhedsrelaterede events
- **Environment variable validation** ved startup

---

## 🚀 Performance Optimering

### Caching Strategies
- **NodeCache** for Tasty API responses (15 min TTL)
- **Browser caching** for static assets
- **Database indexing** på frequently queried fields

### Bundle Optimization
- **Vite's tree shaking** fjerner unused code
- **Svelte compilation** til minimal runtime
- **Tailwind CSS purging** fjerner unused styles
- **Image optimization** med file size limits

### Database Performance
- **Native MongoDB driver** for bedre performance end Mongoose
- **Efficient queries** med proper indexing
- **Connection pooling** med MongoDB client
- **Graceful shutdown** handling

---

## 🧪 Development & Testing

### Development Workflow
- **Hot Module Replacement** med Vite
- **Environment variables** for konfiguration
- **Error boundaries** for graceful error handling
- **Console logging** for debugging
- **API proxy** for seamless development

### Code Quality
- **ES6+ modules** for moderne JavaScript
- **Async/await** for clean asynchronous code
- **Error-first callbacks** pattern
- **Separation of concerns** med modular arkitektur

---

## 📊 Arkitektur Oversigt

### Backend Arkitektur
```
server/
├── app.js                 # Main server file
├── config/
│   ├── database.js        # MongoDB connection
│   └── envValidation.js   # Environment validation
├── middlewares/
│   ├── authMiddleware.js  # JWT verification
│   ├── errorMiddleware.js # Error handling
│   ├── rateLimitMiddleware.js # Rate limiting
│   └── uploadMiddleware.js # File uploads
├── models/
│   ├── userModel.js       # User data operations
│   ├── recipeModel.js     # Recipe data operations
│   └── commentModel.js    # Comment data operations
├── routes/
│   ├── authRouter.js      # Authentication routes
│   ├── recipeRouter.js    # Recipe CRUD routes
│   ├── adminRouter.js     # Admin panel routes
│   └── apiRouter.js       # External API routes
└── services/
    └── tastyApiService.js # External API integration
```

### Frontend Arkitektur
```
client/src/
├── App.svelte            # Main application component
├── main.js              # Application entry point
├── app.css              # Global styles
├── components/
│   ├── Header.svelte    # Navigation header
│   ├── Footer.svelte    # Site footer
│   ├── Modal.svelte     # Reusable modal
│   └── RecipeCard.svelte # Recipe display component
├── pages/
│   ├── Home/           # Landing page
│   ├── Login/          # Authentication
│   ├── Dashboard/      # User dashboard
│   ├── Recipes/        # Recipe listing
│   ├── CreateRecipe/   # Recipe creation
│   └── AdminPanel/     # Admin interface
├── stores/
│   ├── auth.js         # Authentication state
│   ├── modal.js        # Modal state
│   └── notifications.js # Notification system
└── lib/
    ├── api.js          # HTTP client
    └── modalHelpers.js # Modal utilities
```

---

## 🎯 Konklusion

FoodBook demonstrerer moderne fullstack webudvikling ved at kombinere:

1. **Robust backend** med Node.js/Express og MongoDB
2. **Sikker authentication** med JWT og bcrypt
3. **Moderne frontend** med Svelte og Vite
4. **Responsive design** med Tailwind CSS
5. **Real-time features** med Socket.io
6. **Eksterne integrationer** med Tasty API
7. **Comprehensive sikkerhed** med rate limiting og validation
8. **Performance optimization** med caching og bundling

Projektet viser praktisk implementering af industrielle standarder og best practices inden for moderne webudvikling, med fokus på både funktionalitet, sikkerhed og brugeroplevelse.

---

*Dette manuskript dokumenterer de tekniske valg og implementeringsdetaljer i FoodBook projektet til eksamensbrug.*
