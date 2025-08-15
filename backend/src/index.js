import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import path from 'path';
import config from './config/env.js';
import { testConnection } from './config/db.js';
import logger from './utils/logger.js';
import { initializeSolana } from './config/solana.js';
import { initializeSocket } from './socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Compression middleware
app.use(compression({ level: config.COMPRESSION_LEVEL }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/public', express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await testConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      version: '1.0.0',
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API routes
import walletRoutes from './routes/walletRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MCPayStream API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      wallets: '/api/wallets',
      transactions: '/api/transactions',
      stats: '/api/stats',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: config.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    ...(config.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// Initialize application
async function initializeApp() {
  try {
    // Test database connection
    await testConnection();
    logger.info('✅ Database connection established');
    
    // Initialize Solana connection
    await initializeSolana();
    logger.info('✅ Solana connection established');
    
    // Start server
    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 Server running on port ${config.PORT}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
      logger.info(`📊 Health check: http://localhost:${config.PORT}/health`);
    });
    
    // Initialize Socket.IO
    initializeSocket(server);
    logger.info('✅ Socket.IO initialized');
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp();
