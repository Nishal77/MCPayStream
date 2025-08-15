import { Connection, clusterApiUrl } from '@solana/web3.js';
import config from './env.js';
import logger from '../utils/logger.js';

class SolanaConfig {
  constructor() {
    this.connection = null;
    this.wsConnection = null;
    this.network = 'mainnet-beta';
    this.commitment = 'confirmed';
  }

  // Initialize Solana connection
  async initialize() {
    try {
      // Create HTTP connection
      this.connection = new Connection(
        config.SOLANA_RPC_URL,
        this.commitment
      );

      // Test connection
      const version = await this.connection.getVersion();
      logger.info(`Solana connection established. Version: ${version['solana-core']}`);

      // Note: WebSocket connections are handled differently in Solana Web3.js
      // For now, we'll use the HTTP connection for all operations
      logger.info('Solana HTTP connection established (WebSocket not configured)');

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
