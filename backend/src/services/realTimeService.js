import { emitTransactionUpdate, emitBalanceUpdate, emitEarningsUpdate, emitLeaderboardUpdate } from '../socket.js';
import { getRecentTransactions } from '../blockchain/transactions.js';
import { getWalletBalance } from '../blockchain/wallet.js';
import { getCachedSolPrice } from '../blockchain/price.js';
import { getTopSenders } from '../models/analytics.js';
import { getCreatorTrendAnalysis } from '../models/analytics.js';
import { getCreatorBySolanaAddress } from '../models/creator.js';
import logger from '../utils/logger.js';

class RealTimeService {
  constructor() {
    this.monitoredWallets = new Set();
    this.monitoringInterval = null;
    this.lastTransactionHashes = new Map(); // Track last known transaction for each wallet
    this.updateInterval = 10000; // Check for updates every 10 seconds
  }

  /**
   * Start monitoring a wallet for real-time updates
   */
  startMonitoringWallet(walletAddress) {
    this.monitoredWallets.add(walletAddress);
    logger.info(`Started monitoring wallet: ${walletAddress}`);
    
    if (!this.monitoringInterval) {
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
    if (this.monitoringInterval) {
      return; // Already running
    }

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
      // Get recent transactions
      const recentTxs = await getRecentTransactions(walletAddress, 5);
      const lastKnownHash = this.lastTransactionHashes.get(walletAddress);
      
      // Check for new transactions
      const newTransactions = recentTxs.filter(tx => {
        if (!lastKnownHash) return true; // First time monitoring
        return tx.signature !== lastKnownHash;
      });

      if (newTransactions.length > 0) {
        // Update last known transaction hash
        this.lastTransactionHashes.set(walletAddress, recentTxs[0].signature);
        
        // Emit transaction updates
        for (const tx of newTransactions) {
          await this.emitTransactionUpdate(walletAddress, tx);
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
   * Emit transaction update to connected clients
   */
  async emitTransactionUpdate(walletAddress, transaction) {
    try {
      const solPrice = await getCachedSolPrice();
      
      const transactionData = {
        signature: transaction.signature,
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        amount: transaction.amountSOL,
        amountUSD: transaction.amountSOL * solPrice,
        direction: transaction.direction,
        blockTime: transaction.blockTime,
        timestamp: new Date().toISOString(),
        type: 'SOL_TRANSFER'
      };

      emitTransactionUpdate(walletAddress, transactionData);
      logger.info(`Emitted transaction update for ${walletAddress}: ${transaction.signature}`);
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
      isMonitoring: !!this.monitoringInterval,
      monitoredWallets: Array.from(this.monitoredWallets),
      updateInterval: this.updateInterval,
      lastUpdate: new Date().toISOString()
    };
  }
}

// Create singleton instance
const realTimeService = new RealTimeService();

export default realTimeService;
