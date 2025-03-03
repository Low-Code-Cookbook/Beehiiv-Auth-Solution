import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from 'supertokens-node/framework/express';
import { initSupertokens } from './config/supertokens';
import config from './config';
import authRoutes from './routes/auth';
import path from 'path';

console.log('Starting server...');

// Initialize SuperTokens
initSupertokens();

// Initialize Express app
const app = express();

// Parse whitelist domains from environment variable
const whitelistedDomains = process.env.WHITELIST_DOMAINS 
  ? process.env.WHITELIST_DOMAINS.split(',').map(domain => domain.trim())
  : ['http://localhost:3000']; // Default fallback

// Flag to allow all CORS origins (for development/testing)
const allowAllCors = process.env.ALLOW_ALL_CORS === 'true';

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins if the flag is set
    if (allowAllCors) {
      return callback(null, true);
    }
    
    // Check if the origin is in our whitelist
    if (whitelistedDomains.includes(origin) || 
        whitelistedDomains.some(domain => {
          // Handle wildcard domains (e.g., *.example.com)
          if (domain.startsWith('*')) {
            const domainSuffix = domain.substring(1); // Remove the *
            return origin.endsWith(domainSuffix);
          }
          return false;
        })) {
      return callback(null, true);
    }
    
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  allowedHeaders: ['content-type', 'authorization'],
}));

app.use(express.json());
app.use(morgan('dev'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/auth', authRoutes);

// Simple root endpoint
app.get('/api', (_, res) => {
  res.status(200).json({ 
    message: 'Low Code CTO Auth API',
    docs: '/docs',
    health: '/health'
  });
});

// Serve index.html for the root path
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use(errorHandler());

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

const start = async () => {
  try {

    // Start server
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
start(); 