import dotenv from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';

// Load environment variables
dotenv.config();

// Expand tilde in paths
const expandTilde = (path) => {
  if (path && path.startsWith('~')) {
    return path.replace('~', homedir());
  }
  return path;
};

const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5001,
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/mcpaystream?schema=public',
  
  // Solana Configuration
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  SOLANA_WS_URL: process.env.SOLANA_WS_URL || 'wss://api.devnet.solana.com',
  SOLANA_NETWORK: process.env.SOLANA_NETWORK || 'devnet',
  SOLANA_KEYPAIR_PATH: expandTilde(process.env.SOLANA_KEYPAIR_PATH || '~/.config/solana/mcpaystream.json'),
  
  // CoinGecko API
  COINGECKO_API_URL: process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
  
  // Webhook Configuration
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

export default config;
