import { Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
import fs from 'fs';
import config from './env.js';
import logger from '../utils/logger.js';

class SolanaConfig {
  constructor() {
    this.connection = null;
    this.wsConnection = null;
    this.network = 'mainnet-beta';
    this.commitment = 'confirmed';
    this.keypair = null;
  }

  // Initialize Solana connection
  async initialize() {
    try {
      // Resolve network: allow full URL in SOLANA_NETWORK or fallback to RPC URL
      const rpcUrl = resolveRpcUrl();

      // Create HTTP connection
      this.connection = new Connection(rpcUrl, this.commitment);

      // Test connection
      const version = await this.connection.getVersion();
      logger.info(`Solana connection established. Version: ${version['solana-core']}`);

      // Load optional keypair for testing/devnet if provided
      if (config.SOLANA_WALLET_KEYPAIR && fs.existsSync(expandHome(config.SOLANA_WALLET_KEYPAIR))) {
        const secret = JSON.parse(fs.readFileSync(expandHome(config.SOLANA_WALLET_KEYPAIR), 'utf8'));
        this.keypair = Keypair.fromSecretKey(new Uint8Array(secret));
        logger.info('Solana keypair loaded from SOLANA_WALLET_KEYPAIR');
      }

      logger.info('Solana HTTP connection established');

      return true;
    } catch (error) {
      logger.error('Failed to initialize Solana connection:', error);
      throw error;
    }
  }

  // Get HTTP connection
  getConnection() {
    if (!this.connection) {
      throw new Error('Solana connection not initialized. Call initialize() first.');
    }
    return this.connection;
  }

  // Get WebSocket connection
  getWSConnection() {
    if (!this.wsConnection) {
      throw new Error('Solana WebSocket connection not initialized. Call initialize() first.');
    }
    return this.wsConnection;
  }

  // Get network info
  getNetwork() {
    return this.network;
  }

  // Get commitment level
  getCommitment() {
    return this.commitment;
  }

  // Set commitment level
  setCommitment(commitment) {
    if (['processed', 'confirmed', 'finalized'].includes(commitment)) {
      this.commitment = commitment;
      logger.info(`Commitment level set to: ${commitment}`);
    } else {
      logger.warn(`Invalid commitment level: ${commitment}. Using default: confirmed`);
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.connection) return false;
      
      const version = await this.connection.getVersion();
      return !!version;
    } catch (error) {
      logger.error('Solana health check failed:', error);
      return false;
    }
  }

  // Get cluster API URL for different networks
  static getClusterApiUrl(network = 'mainnet-beta') {
    return clusterApiUrl(network);
  }

  // Get testnet connection
  static getTestnetConnection() {
    return new Connection(clusterApiUrl('testnet'), 'confirmed');
  }

  // Get devnet connection
  static getDevnetConnection() {
    return new Connection(clusterApiUrl('devnet'), 'confirmed');
  }
}

// Create singleton instance
const solanaConfig = new SolanaConfig();

// Export initialize function
export const initializeSolana = () => solanaConfig.initialize();

export default solanaConfig;

// Helpers
function resolveRpcUrl() {
  // If SOLANA_NETWORK is a full URL, use it; else if it's a cluster alias, map to cluster URL
  const network = config.SOLANA_NETWORK;
  if (network?.startsWith('http')) return network;
  if (['devnet', 'testnet', 'mainnet-beta'].includes(network)) return clusterApiUrl(network);
  // Fallback to explicit RPC URL
  return config.SOLANA_RPC_URL;
}

function expandHome(filePath) {
  if (!filePath) return filePath;
  if (filePath.startsWith('~/')) {
    return filePath.replace('~', process.env.HOME || process.env.USERPROFILE);
  }
  return filePath;
}
