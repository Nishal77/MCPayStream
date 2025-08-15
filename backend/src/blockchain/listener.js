import { PublicKey } from '@solana/web3.js';
import solanaConfig from '../config/solana.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { 
  createTransaction,
  updateTransactionStatus 
} from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import { emitToWallet, emitToGeneral } from '../socket.js';
import { SOCKET_EVENTS } from '../../../shared/constants.js';
import { convertSOLtoUSD } from '../../../shared/formatters.js';

class SolanaListener {
  constructor() {
    this.connection = null;
    this.wsConnection = null;
    this.isListening = false;
    this.subscriptionId = null;
    this.watchedAddresses = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds
  }

  // Initialize the listener
  async initialize() {
    try {
      this.connection = solanaConfig.getConnection();
      this.wsConnection = solanaConfig.getWSConnection();
      
      // Load watched addresses from database
      await this.loadWatchedAddresses();
      
      logger.info('Solana listener initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Solana listener:', error);
      throw error;
    }
  }

  // Load watched addresses from database
  async loadWatchedAddresses() {
    try {
      const wallets = await Wallet.find({ isActive: true });
      wallets.forEach(wallet => {
        this.watchedAddresses.add(wallet.address);
      });
      logger.info(`Loaded ${this.watchedAddresses.size} watched addresses`);
    } catch (error) {
      logger.error('Failed to load watched addresses:', error);
    }
  }

  // Start listening for transactions
  async startListening() {
    if (this.isListening) {
      logger.warn('Listener is already running');
      return;
    }

    try {
      // Subscribe to account changes for watched addresses
      await this.subscribeToAccounts();
      
      // Subscribe to transaction confirmations
      await this.subscribeToTransactions();
      
      this.isListening = true;
      logger.info('Started listening for Solana transactions');
      
      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;
    } catch (error) {
      logger.error('Failed to start listening:', error);
      await this.handleReconnect();
    }
  }

  // Stop listening
  async stopListening() {
    if (!this.isListening) {
      return;
    }

    try {
      if (this.subscriptionId) {
        await this.wsConnection.removeAccountChangeListener(this.subscriptionId);
        this.subscriptionId = null;
      }
      
      this.isListening = false;
      logger.info('Stopped listening for Solana transactions');
    } catch (error) {
      logger.error('Error stopping listener:', error);
    }
  }

  // Subscribe to account changes
  async subscribeToAccounts() {
    try {
      for (const address of this.watchedAddresses) {
        const publicKey = new PublicKey(address);
        
        this.wsConnection.onAccountChange(
          publicKey,
          (accountInfo, context) => {
            this.handleAccountChange(address, accountInfo, context);
          },
          'confirmed'
        );
        
        logger.debug(`Subscribed to account changes for: ${address}`);
      }
    } catch (error) {
      logger.error('Failed to subscribe to account changes:', error);
      throw error;
    }
  }

  // Subscribe to transaction confirmations
  async subscribeToTransactions() {
    try {
      this.subscriptionId = this.wsConnection.onLogs(
        'all',
        (logs, context) => {
          this.handleTransactionLogs(logs, context);
        },
        'confirmed'
      );
      
      logger.info('Subscribed to transaction logs');
    } catch (error) {
      logger.error('Failed to subscribe to transaction logs:', error);
      throw error;
    }
  }

  // Handle account changes
  async handleAccountChange(address, accountInfo, context) {
    try {
      logger.debug(`Account change detected for: ${address}`);
      
      // Update wallet balance
      const balance = accountInfo.lamports / 1e9; // Convert lamports to SOL
      await this.updateWalletBalance(address, balance);
      
      // Emit balance update to connected clients
      emitToWallet(address, SOCKET_EVENTS.WALLET_UPDATE, {
        address,
        balance,
        slot: context.slot,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error(`Error handling account change for ${address}:`, error);
    }
  }

  // Handle transaction logs
  async handleTransactionLogs(logs, context) {
    try {
      // Parse logs to find transactions involving watched addresses
      for (const log of logs.logs) {
        if (this.isRelevantTransaction(log)) {
          await this.processTransaction(logs.signature, context);
        }
      }
    } catch (error) {
      logger.error('Error handling transaction logs:', error);
    }
  }

  // Check if transaction is relevant to watched addresses
  isRelevantTransaction(log) {
    for (const address of this.watchedAddresses) {
      if (log.includes(address)) {
        return true;
      }
    }
    return false;
  }

  // Process a transaction
  async processTransaction(signature, context) {
    try {
      logger.info(`Processing transaction: ${signature}`);
      
      // Get transaction details
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      if (!transaction) {
        logger.warn(`Transaction not found: ${signature}`);
        return;
      }
      
      // Check if transaction involves watched addresses
      const relevantAddresses = this.getRelevantAddresses(transaction);
      if (relevantAddresses.length === 0) {
        return;
      }
      
      // Process the transaction
      await this.saveTransaction(transaction, context);
      
      // Emit transaction update to connected clients
      emitToGeneral(SOCKET_EVENTS.NEW_TRANSACTION, {
        signature,
        addresses: relevantAddresses,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error(`Error processing transaction ${signature}:`, error);
    }
  }

  // Get addresses involved in transaction that are being watched
  getRelevantAddresses(transaction) {
    const addresses = new Set();
    
    if (transaction.transaction.message.accountKeys) {
      transaction.transaction.message.accountKeys.forEach(key => {
        const address = key.toString();
        if (this.watchedAddresses.has(address)) {
          addresses.add(address);
        }
      });
    }
    
    return Array.from(addresses);
  }

  // Save transaction to database
  async saveTransaction(transaction, context) {
    try {
      // Check if transaction already exists
      const existing = await createTransaction(transaction.transaction.signatures[0]);
      if (existing) {
        logger.debug(`Transaction already exists: ${transaction.transaction.signatures[0]}`);
        return existing;
      }
      
      // Parse transaction details
      const txData = this.parseTransactionData(transaction, context);
      
      // Save to database
      const newTransaction = await createTransaction(txData);
      
      logger.info(`Saved transaction: ${transaction.transaction.signatures[0]}`);
      
      // Update wallet statistics
      await this.updateWalletStats(txData);
      
      return newTransaction;
    } catch (error) {
      logger.error('Error saving transaction:', error);
      throw error;
    }
  }

  // Parse transaction data
  parseTransactionData(transaction, context) {
    const signature = transaction.transaction.signatures[0];
    const blockTime = new Date(context.blockTime * 1000);
    
    // Extract basic transaction info
    const txData = {
      signature,
      blockTime,
      slot: context.slot,
      status: 'confirmed',
      fee: transaction.meta.fee / 1e9, // Convert lamports to SOL
    };
    
    // Parse account keys and instructions to determine addresses and amounts
    // This is a simplified version - you might need more complex parsing
    // depending on the transaction types you want to support
    
    return txData;
  }

  // Update wallet statistics
  async updateWalletStats(txData) {
    try {
      // Update wallet stats based on transaction
      // This would need to be implemented based on your specific requirements
      logger.debug('Updating wallet stats');
    } catch (error) {
      logger.error('Error updating wallet stats:', error);
    }
  }

  // Update wallet balance
  async updateWalletBalance(address, balance) {
    try {
      const wallet = await Wallet.findByAddress(address);
      if (wallet) {
        // Get current SOL price
        const solPrice = await this.getSolPrice();
        await wallet.updateBalance(balance, solPrice);
        logger.debug(`Updated balance for ${address}: ${balance} SOL`);
      }
    } catch (error) {
      logger.error(`Error updating balance for ${address}:`, error);
    }
  }

  // Get SOL price from CoinGecko
  async getSolPrice() {
    try {
      const response = await fetch(`${config.COINGECKO_API_URL}/simple/price?ids=solana&vs_currencies=usd`);
      const data = await response.json();
      return data.solana.usd || 0;
    } catch (error) {
      logger.error('Error fetching SOL price:', error);
      return 0;
    }
  }

  // Add address to watch list
  async addWatchedAddress(address) {
    try {
      if (!this.watchedAddresses.has(address)) {
        this.watchedAddresses.add(address);
        
        // Subscribe to account changes for new address
        const publicKey = new PublicKey(address);
        this.wsConnection.onAccountChange(
          publicKey,
          (accountInfo, context) => {
            this.handleAccountChange(address, accountInfo, context);
          },
          'confirmed'
        );
        
        logger.info(`Added ${address} to watched addresses`);
      }
    } catch (error) {
      logger.error(`Error adding watched address ${address}:`, error);
    }
  }

  // Remove address from watch list
  async removeWatchedAddress(address) {
    try {
      if (this.watchedAddresses.has(address)) {
        this.watchedAddresses.delete(address);
        logger.info(`Removed ${address} from watched addresses`);
      }
    } catch (error) {
      logger.error(`Error removing watched address ${address}:`, error);
    }
  }

  // Handle reconnection
  async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached. Stopping listener.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.stopListening();
        await this.initialize();
        await this.startListening();
      } catch (error) {
        logger.error('Reconnection failed:', error);
        await this.handleReconnect();
      }
    }, delay);
  }

  // Get listener status
  getStatus() {
    return {
      isListening: this.isListening,
      watchedAddresses: this.watchedAddresses.size,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Create singleton instance
const solanaListener = new SolanaListener();

export default solanaListener;
