import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file (default)
dotenv.config();

const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 5001,
  
  // Database (Prisma)
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  
  // Solana Configuration
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  SOLANA_WS_URL: process.env.SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com',
  SOLANA_WALLET_ADDRESS: process.env.SOLANA_WALLET_ADDRESS,
  SOLANA_NETWORK: process.env.SOLANA_NETWORK || 'mainnet-beta',
  
  // CoinGecko API
  COINGECKO_API_URL: process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'mcpaystream-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Webhook Configuration
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Compression
  COMPRESSION_LEVEL: parseInt(process.env.COMPRESSION_LEVEL) || 6,
};

// Validation warnings
if (!config.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL is not set. Please configure your Supabase connection.');
}

if (!config.SOLANA_WALLET_ADDRESS) {
  console.warn('⚠️  SOLANA_WALLET_ADDRESS is not set. Please configure a valid Solana wallet address.');
}

if (config.JWT_SECRET === 'mcpaystream-super-secret-jwt-key-change-in-production') {
  console.warn('⚠️  JWT_SECRET is using fallback value. Please set a secure secret in production.');
}

export default config;
