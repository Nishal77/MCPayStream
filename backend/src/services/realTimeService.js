import { emitTransactionUpdate, emitBalanceUpdate, emitEarningsUpdate, emitLeaderboardUpdate } from '../socket.js';
import { getRecentTransactions } from '../blockchain/transactions.js';
import { getWalletBalance } from '../blockchain/wallet.js';
import { getCachedSolPrice } from '../blockchain/price.js';
import { getTopSenders } from '../models/analytics.js';
import { getCreatorTrendAnalysis } from '../models/analytics.js';
import { getCreatorBySolanaAddress } from '../models/creator.js';
import { createTransaction } from '../models/Transaction.js';
import logger from '../utils/logger.js';

class RealTimeService {
  constructor() {
    this.monitoredWallets = new Set();
    this.monitoringInterval = null;
    this.lastTransactionHashes = new Map(); // Track last known transaction for each wallet
    this.updateInterval = 3000; // Check for updates every 3 seconds (more frequent)
    this.isRunning = false;
  }

  /**
   * Start monitoring a wallet for real-time updates
   */
  startMonitoringWallet(walletAddress) {
    this.monitoredWallets.add(walletAddress);
    logger.info(`Started monitoring wallet: ${walletAddress}`);
    
    if (!this.isRunning) {
      this.startMonitoring();
    }
  }

  /**
   * Stop monitoring a wallet
   */
  stopMonitoringWallet(walletAddress) {
    this.monitoredWallets.delete(walletAddress);
    this.lastTransactionHashes.delete(walletAddress);
    logger.info(`Stopped monitoring wallet: ${walletAddress}`);
    
    if (this.monitoredWallets.size === 0) {
      this.stopMonitoring();
    }
  }

  /**
   * Start the monitoring service
   */
  startMonitoring() {
    if (this.isRunning) {
      return; // Already running
    }

    this.isRunning = true;
    this.monitoringInterval = setInterval(async () => {
      await this.checkForUpdates();
    }, this.updateInterval);

    logger.info('Real-time monitoring service started');
  }

  /**
   * Stop the monitoring service
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isRunning = false;
      logger.info('Real-time monitoring service stopped');
    }
  }

  /**
   * Check for updates on all monitored wallets
   */
  async checkForUpdates() {
    try {
      for (const walletAddress of this.monitoredWallets) {
        await this.checkWalletUpdates(walletAddress);
      }
    } catch (error) {
      logger.error('Error checking for updates:', error);
    }
  }

  /**
   * Check for updates on a specific wallet
   */
  async checkWalletUpdates(walletAddress) {
    try {
      // Get recent transactions with higher limit to catch more transactions
      const recentTxs = await getRecentTransactions(walletAddress, 20);
      const lastKnownHash = this.lastTransactionHashes.get(walletAddress);
      
      logger.info(`Checking updates for wallet ${walletAddress}: ${recentTxs.length} recent transactions`);
      
      // Check for new transactions
      const newTransactions = recentTxs.filter(tx => {
        if (!lastKnownHash) {
          logger.info(`First time monitoring ${walletAddress}, considering all ${recentTxs.length} transactions as new`);
          return true; // First time monitoring
        }
        const isNew = tx.signature !== lastKnownHash;
        if (isNew) {
          logger.info(`New transaction detected: ${tx.signature} - ${tx.amountSOL} SOL (${tx.direction})`);
        }
        return isNew;
      });

      if (newTransactions.length > 0) {
        logger.info(`Found ${newTransactions.length} new transactions for ${walletAddress}`);
        
        // Update last known transaction hash
        this.lastTransactionHashes.set(walletAddress, recentTxs[0].signature);
        
        // Process and save new transactions
        for (const tx of newTransactions) {
          await this.processNewTransaction(walletAddress, tx);
        }

        // Update balance and earnings
        await this.updateWalletData(walletAddress);
        
        // Update leaderboard if this affects top senders
        await this.updateLeaderboard();
      }
    } catch (error) {
      logger.error(`Error checking updates for wallet ${walletAddress}:`, error);
    }
  }

  /**
   * Process a new transaction - save to DB and emit update
   */
  async processNewTransaction(walletAddress, transaction) {
    try {
      // Only process incoming transactions for the monitored wallet
      if (transaction.direction === 'IN' && transaction.toAddress === walletAddress) {
        // Get creator for this wallet
        const creator = await getCreatorBySolanaAddress(walletAddress);
        if (!creator) {
          logger.warn(`No creator found for wallet ${walletAddress}, skipping transaction save`);
          return;
        }

        // Save transaction to database
        const savedTx = await createTransaction({
          txHash: transaction.signature,
          senderAddress: transaction.fromAddress,
          receiverAddress: transaction.toAddress,
          amountSOL: transaction.amountSOL,
          usdValue: transaction.amountSOL * (await getCachedSolPrice()),
          status: 'CONFIRMED',
          creatorId: creator.id,
          timestamp: transaction.blockTime ? new Date(transaction.blockTime * 1000) : new Date(),
        });

        logger.info(`Saved new transaction to DB: ${transaction.signature} - ${transaction.amountSOL} SOL`);
      }

      // Emit transaction update regardless of direction
      await this.emitTransactionUpdate(walletAddress, transaction);
    } catch (error) {
      logger.error(`Error processing new transaction ${transaction.signature}:`, error);
      // Still emit the update even if DB save fails
      await this.emitTransactionUpdate(walletAddress, transaction);
    }
  }

  /**
   * Emit transaction update to connected clients
   */
  async emitTransactionUpdate(walletAddress, transaction) {
    try {
      const solPrice = await getCachedSolPrice();
      
      const transactionData = {
        id: `onchain-${transaction.signature}`,
        signature: transaction.signature,
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        amount: transaction.amountSOL,
        amountUSD: transaction.amountSOL * solPrice,
        direction: transaction.direction,
        blockTime: transaction.blockTime,
        timestamp: new Date().toISOString(),
        status: 'confirmed',
        source: 'onchain',
        type: 'SOL_TRANSFER'
      };

      emitTransactionUpdate(walletAddress, transactionData);
      logger.info(`Emitted transaction update for ${walletAddress}: ${transaction.signature} (${transaction.direction})`);
    } catch (error) {
      logger.error(`Error emitting transaction update:`, error);
    }
  }

  /**
   * Update wallet data (balance, earnings) and emit updates
   */
  async updateWalletData(walletAddress) {
    try {
      // Get live balance
      const balance = await getWalletBalance(walletAddress);
      const solPrice = await getCachedSolPrice();
      
      const balanceData = {
        balance,
        balanceUSD: balance * solPrice,
        solPrice,
        timestamp: new Date().toISOString()
      };

      emitBalanceUpdate(walletAddress, balanceData);

      // Get earnings data
      const creator = await getCreatorBySolanaAddress(walletAddress);
      if (creator) {
        const earningsData = await getCreatorTrendAnalysis(creator.id, 7); // Last 7 days
        
        emitEarningsUpdate(walletAddress, {
          earnings: earningsData,
          totalEarnings: earningsData.reduce((sum, day) => sum + day.amountSOL, 0),
          totalEarningsUSD: earningsData.reduce((sum, day) => sum + day.usdValue, 0),
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error(`Error updating wallet data for ${walletAddress}:`, error);
    }
  }

  /**
   * Update leaderboard and emit updates
   */
  async updateLeaderboard() {
    try {
      const topSenders = await getTopSenders(10, '7d');
      
      emitLeaderboardUpdate({
        topSenders,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error updating leaderboard:', error);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      monitoredWallets: Array.from(this.monitoredWallets),
      updateInterval: this.updateInterval,
      lastTransactionHashes: Object.fromEntries(this.lastTransactionHashes)
    };
  }
}

// Export singleton instance
const realTimeService = new RealTimeService();
export default realTimeService;
