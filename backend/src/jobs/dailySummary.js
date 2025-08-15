import cron from 'node-cron';
import logger from '../utils/logger.js';
import { calculateWalletStats } from '../services/analyticsService.js';
import { sendDailySummaryWebhook } from '../services/webhookService.js';
import Wallet from '../models/Wallet.js';
import { 
  getTransactionStats,
  getRecentTransactions 
} from '../models/Transaction.js';

/**
 * Daily summary job configuration
 */
const DAILY_SUMMARY_CONFIG = {
  schedule: '0 9 * * *', // Run at 9:00 AM every day
  timezone: 'UTC',
  enabled: true
};

/**
 * Generate daily summary for a wallet
 * @param {string} walletAddress - Wallet address
 * @param {Date} date - Date for summary
 * @returns {Promise<Object>} Daily summary data
 */
async function generateDailySummary(walletAddress, date = new Date()) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Get daily statistics
    const stats = await calculateWalletStats(walletAddress, {
      startDate: startOfDay,
      endDate: endOfDay
    });

    // Get top senders for the day
    const topSenders = await getRecentTransactions(walletAddress, {
      startDate: startOfDay,
      endDate: endOfDay
    }).then(transactions => {
      return transactions.map(tx => ({
        address: tx.sender,
        totalSentSOL: tx.amountSOL,
        totalSentUSD: tx.amountUSD,
        transactionCount: 1
      }));
    });

    // Get hourly breakdown
    const hourlyBreakdown = await getTransactionStats(walletAddress, {
      startDate: startOfDay,
      endDate: endOfDay
    });

    const summary = {
      date: startOfDay.toISOString().split('T')[0],
      walletAddress,
      totalTransactions: stats.totalTransactions,
      totalReceivedSOL: stats.totalReceivedSOL,
      totalReceivedUSD: stats.totalReceivedUSD,
      averageAmountSOL: stats.averageAmountSOL,
      averageAmountUSD: stats.averageAmountUSD,
      uniqueSenders: stats.uniqueSenders,
      topSenders,
      hourlyBreakdown,
      timestamp: new Date().toISOString()
    };

    logger.info(`Daily summary generated for ${walletAddress} on ${summary.date}`);
    return summary;
  } catch (error) {
    logger.error(`Error generating daily summary for ${walletAddress}:`, error);
    throw error;
  }
}

/**
 * Send daily summary to all wallets
 * @param {Date} date - Date for summary
 */
async function sendDailySummaries(date = new Date()) {
  try {
    logger.info('Starting daily summary job...');

    // Get all active wallets
    const wallets = await Wallet.find({ active: true }).select('address name webhookUrl');
    
    if (wallets.length === 0) {
      logger.info('No active wallets found for daily summary');
      return;
    }

    logger.info(`Processing daily summaries for ${wallets.length} wallets`);

    const results = {
      total: wallets.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each wallet
    for (const wallet of wallets) {
      try {
        // Generate summary
        const summary = await generateDailySummary(wallet.address, date);
        
        // Send webhook if configured
        if (wallet.webhookUrl) {
          const webhookSent = await sendDailySummaryWebhook(summary, wallet.webhookUrl);
          if (webhookSent) {
            logger.info(`Daily summary webhook sent for ${wallet.address}`);
          } else {
            logger.warn(`Failed to send daily summary webhook for ${wallet.address}`);
          }
        }

        // Store summary in database (optional)
        await storeDailySummary(summary);
        
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          wallet: wallet.address,
          error: error.message
        });
        logger.error(`Failed to process daily summary for ${wallet.address}:`, error);
      }
    }

    // Log summary results
    logger.info(`Daily summary job completed: ${results.successful} successful, ${results.failed} failed`);
    
    if (results.errors.length > 0) {
      logger.warn('Daily summary errors:', results.errors);
    }

    return results;
  } catch (error) {
    logger.error('Error in daily summary job:', error);
    throw error;
  }
}

/**
 * Store daily summary in database
 * @param {Object} summary - Daily summary data
 */
async function storeDailySummary(summary) {
  try {
    // This could be stored in a separate collection for historical analysis
    // For now, we'll just log it
    logger.debug('Daily summary stored:', {
      wallet: summary.walletAddress,
      date: summary.date,
      transactions: summary.totalTransactions,
      volume: summary.totalReceivedSOL
    });
  } catch (error) {
    logger.error('Error storing daily summary:', error);
  }
}

/**
 * Generate weekly summary
 * @param {Date} date - End date for week
 */
async function generateWeeklySummary(date = new Date()) {
  try {
    logger.info('Generating weekly summary...');

    const endOfWeek = new Date(date);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(endOfWeek.getDate() - 7);

    // Get all wallets
    const wallets = await Wallet.find({ active: true }).select('address name');

    const weeklyStats = {
      period: 'weekly',
      startDate: startOfWeek,
      endDate: endOfWeek,
      wallets: [],
      platform: {
        totalTransactions: 0,
        totalVolumeSOL: 0,
        totalVolumeUSD: 0,
        uniqueWallets: 0,
        uniqueSenders: 0
      }
    };

    // Process each wallet
    for (const wallet of wallets) {
      try {
        const stats = await calculateWalletStats(wallet.address, {
          startDate: startOfWeek,
          endDate: endOfWeek
        });

        weeklyStats.wallets.push({
          address: wallet.address,
          name: wallet.name,
          ...stats
        });

        // Aggregate platform stats
        weeklyStats.platform.totalTransactions += stats.totalTransactions;
        weeklyStats.platform.totalVolumeSOL += stats.totalReceivedSOL;
        weeklyStats.platform.totalVolumeUSD += stats.totalReceivedUSD;
      } catch (error) {
        logger.error(`Error getting weekly stats for ${wallet.address}:`, error);
      }
    }

    // Calculate unique wallets and senders
    const uniqueWallets = new Set();
    const uniqueSenders = new Set();

    weeklyStats.wallets.forEach(wallet => {
      if (wallet.totalTransactions > 0) {
        uniqueWallets.add(wallet.address);
      }
    });

    weeklyStats.platform.uniqueWallets = uniqueWallets.size;

    logger.info('Weekly summary generated successfully');
    return weeklyStats;
  } catch (error) {
    logger.error('Error generating weekly summary:', error);
    throw error;
  }
}

/**
 * Generate monthly summary
 * @param {Date} date - End date for month
 */
async function generateMonthlySummary(date = new Date()) {
  try {
    logger.info('Generating monthly summary...');

    const endOfMonth = new Date(date);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);

    // Get all wallets
    const wallets = await Wallet.find({ active: true }).select('address name');

    const monthlyStats = {
      period: 'monthly',
      startDate: startOfMonth,
      endDate: endOfMonth,
      wallets: [],
      platform: {
        totalTransactions: 0,
        totalVolumeSOL: 0,
        totalVolumeUSD: 0,
        uniqueWallets: 0,
        averageDailyVolume: 0
      }
    };

    // Process each wallet
    for (const wallet of wallets) {
      try {
        const stats = await calculateWalletStats(wallet.address, {
          startDate: startOfMonth,
          endDate: endOfMonth
        });

        monthlyStats.wallets.push({
          address: wallet.address,
          name: wallet.name,
          ...stats
        });

        // Aggregate platform stats
        monthlyStats.platform.totalTransactions += stats.totalTransactions;
        monthlyStats.platform.totalVolumeSOL += stats.totalReceivedSOL;
        monthlyStats.platform.totalVolumeUSD += stats.totalReceivedUSD;
      } catch (error) {
        logger.error(`Error getting monthly stats for ${wallet.address}:`, error);
      }
    }

    // Calculate additional metrics
    const daysInMonth = Math.ceil((endOfMonth - startOfMonth) / (1000 * 60 * 60 * 24));
    monthlyStats.platform.averageDailyVolume = monthlyStats.platform.totalVolumeSOL / daysInMonth;

    // Get top performing wallets
    monthlyStats.topWallets = monthlyStats.wallets
      .filter(w => w.totalTransactions > 0)
      .sort((a, b) => b.totalReceivedSOL - a.totalReceivedSOL)
      .slice(0, 10);

    logger.info('Monthly summary generated successfully');
    return monthlyStats;
  } catch (error) {
    logger.error('Error generating monthly summary:', error);
    throw error;
  }
}

/**
 * Start the daily summary job
 */
export function startDailySummaryJob() {
  if (!DAILY_SUMMARY_CONFIG.enabled) {
    logger.info('Daily summary job is disabled');
    return;
  }

  try {
    cron.schedule(DAILY_SUMMARY_CONFIG.schedule, async () => {
      logger.info('Running scheduled daily summary job...');
      await sendDailySummaries();
    }, {
      timezone: DAILY_SUMMARY_CONFIG.timezone
    });

    logger.info(`Daily summary job scheduled: ${DAILY_SUMMARY_CONFIG.schedule} (${DAILY_SUMMARY_CONFIG.timezone})`);
  } catch (error) {
    logger.error('Error starting daily summary job:', error);
  }
}

/**
 * Stop the daily summary job
 */
export function stopDailySummaryJob() {
  try {
    cron.getTasks().forEach(task => {
      if (task.name === 'daily-summary') {
        task.stop();
        logger.info('Daily summary job stopped');
      }
    });
  } catch (error) {
    logger.error('Error stopping daily summary job:', error);
  }
}

/**
 * Run daily summary job manually
 * @param {Date} date - Date for summary
 */
export async function runDailySummaryManually(date = new Date()) {
  try {
    logger.info('Running daily summary job manually...');
    const results = await sendDailySummaries(date);
    return results;
  } catch (error) {
    logger.error('Error running daily summary manually:', error);
    throw error;
  }
}

/**
 * Get job status
 */
export function getJobStatus() {
  return {
    enabled: DAILY_SUMMARY_CONFIG.enabled,
    schedule: DAILY_SUMMARY_CONFIG.schedule,
    timezone: DAILY_SUMMARY_CONFIG.timezone,
    nextRun: getNextRunTime(),
    lastRun: getLastRunTime()
  };
}

/**
 * Get next run time
 */
function getNextRunTime() {
  try {
    const cronExpression = cron.parseExpression(DAILY_SUMMARY_CONFIG.schedule, {
      timezone: DAILY_SUMMARY_CONFIG.timezone
    });
    return cronExpression.next().toDate();
  } catch (error) {
    logger.error('Error calculating next run time:', error);
    return null;
  }
}

/**
 * Get last run time (placeholder - would need to be tracked)
 */
function getLastRunTime() {
  // This would need to be implemented with a database table or cache
  // to track when the job last ran
  return null;
}

// Export functions for external use
export {
  generateDailySummary,
  generateWeeklySummary,
  generateMonthlySummary,
  sendDailySummaries
};
