import { 
  getTransactionsByCreator, 
  getTransactionStats,
  getRecentTransactions 
} from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import logger from '../utils/logger.js';

/**
 * Calculate wallet statistics
 * @param {string} walletAddress - Wallet address
 * @param {Object} options - Calculation options
 * @returns {Promise<Object>} Wallet statistics
 */
export async function calculateWalletStats(walletAddress, options = {}) {
  try {
    const {
      period = 'all',
      startDate = null,
      endDate = null
    } = options;

    let dateFilter = {};
    
    if (period !== 'all') {
      const now = new Date();
      let start;
      
      switch (period) {
        case '24h':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      dateFilter = {
        timestamp: { $gte: start, $lte: now }
      };
    } else if (startDate && endDate) {
      dateFilter = {
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
      };
    }

    // Aggregate transaction statistics
    const stats = await Transaction.aggregate([
      {
        $match: {
          receiver: walletAddress,
          status: 'confirmed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalReceivedSOL: { $sum: '$amountSOL' },
          totalReceivedUSD: { $sum: '$amountUSD' },
          averageAmountSOL: { $avg: '$amountSOL' },
          averageAmountUSD: { $avg: '$amountUSD' },
          minAmountSOL: { $min: '$amountSOL' },
          maxAmountSOL: { $max: '$amountSOL' },
          uniqueSenders: { $addToSet: '$sender' },
          firstTransaction: { $min: '$timestamp' },
          lastTransaction: { $max: '$timestamp' }
        }
      },
      {
        $project: {
          _id: 0,
          totalTransactions: 1,
          totalReceivedSOL: { $round: ['$totalReceivedSOL', 6] },
          totalReceivedUSD: { $round: ['$totalReceivedUSD', 2] },
          averageAmountSOL: { $round: ['$averageAmountSOL', 6] },
          averageAmountUSD: { $round: ['$averageAmountUSD', 2] },
          minAmountSOL: { $round: ['$minAmountSOL', 6] },
          maxAmountSOL: { $round: ['$maxAmountSOL', 6] },
          uniqueSenders: { $size: '$uniqueSenders' },
          firstTransaction: 1,
          lastTransaction: 1
        }
      }
    ]);

    const result = stats[0] || {
      totalTransactions: 0,
      totalReceivedSOL: 0,
      totalReceivedUSD: 0,
      averageAmountSOL: 0,
      averageAmountUSD: 0,
      minAmountSOL: 0,
      maxAmountSOL: 0,
      uniqueSenders: 0,
      firstTransaction: null,
      lastTransaction: null
    };

    // Calculate additional metrics
    const additionalMetrics = await calculateAdditionalMetrics(walletAddress, dateFilter);
    
    return {
      ...result,
      ...additionalMetrics,
      period,
      startDate: dateFilter.timestamp?.$gte || null,
      endDate: dateFilter.timestamp?.$lte || null
    };
  } catch (error) {
    logger.error(`Error calculating wallet stats for ${walletAddress}:`, error);
    throw new Error(`Failed to calculate wallet statistics: ${error.message}`);
  }
}

/**
 * Calculate additional wallet metrics
 * @param {string} walletAddress - Wallet address
 * @param {Object} dateFilter - Date filter
 * @returns {Promise<Object>} Additional metrics
 */
async function calculateAdditionalMetrics(walletAddress, dateFilter) {
  try {
    // Get top senders
    const topSenders = await Transaction.aggregate([
      {
        $match: {
          receiver: walletAddress,
          status: 'confirmed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$sender',
          totalSentSOL: { $sum: '$amountSOL' },
          totalSentUSD: { $sum: '$amountUSD' },
          transactionCount: { $sum: 1 },
          lastTransaction: { $max: '$timestamp' }
        }
      },
      {
        $sort: { totalSentSOL: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          address: '$_id',
          totalSentSOL: { $round: ['$totalSentSOL', 6] },
          totalSentUSD: { $round: ['$totalSentUSD', 2] },
          transactionCount: 1,
          lastTransaction: 1
        }
      }
    ]);

    // Get daily transaction counts
    const dailyStats = await Transaction.aggregate([
      {
        $match: {
          receiver: walletAddress,
          status: 'confirmed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          transactions: { $sum: 1 },
          volumeSOL: { $sum: '$amountSOL' },
          volumeUSD: { $sum: '$amountUSD' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          transactions: 1,
          volumeSOL: { $round: ['$volumeSOL', 6] },
          volumeUSD: { $round: ['$volumeUSD', 2] }
        }
      }
    ]);

    // Calculate growth rate
    const growthRate = calculateGrowthRate(dailyStats);

    return {
      topSenders,
      dailyStats,
      growthRate
    };
  } catch (error) {
    logger.error(`Error calculating additional metrics for ${walletAddress}:`, error);
    return {
      topSenders: [],
      dailyStats: [],
      growthRate: 0
    };
  }
}

/**
 * Calculate growth rate from daily stats
 * @param {Array} dailyStats - Daily statistics
 * @returns {number} Growth rate percentage
 */
function calculateGrowthRate(dailyStats) {
  if (dailyStats.length < 2) return 0;
  
  const recent = dailyStats.slice(-7); // Last 7 days
  const previous = dailyStats.slice(-14, -7); // Previous 7 days
  
  if (recent.length === 0 || previous.length === 0) return 0;
  
  const recentTotal = recent.reduce((sum, day) => sum + day.volumeSOL, 0);
  const previousTotal = previous.reduce((sum, day) => sum + day.volumeSOL, 0);
  
  if (previousTotal === 0) return recentTotal > 0 ? 100 : 0;
  
  return ((recentTotal - previousTotal) / previousTotal) * 100;
}

/**
 * Calculate global platform statistics
 * @param {Object} options - Calculation options
 * @returns {Promise<Object>} Global statistics
 */
export async function calculateGlobalStats(options = {}) {
  try {
    const {
      period = '7d',
      startDate = null,
      endDate = null
    } = options;

    let dateFilter = {};
    
    if (period !== 'all') {
      const now = new Date();
      let start;
      
      switch (period) {
        case '24h':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      dateFilter = {
        timestamp: { $gte: start, $lte: now }
      };
    } else if (startDate && endDate) {
      dateFilter = {
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
      };
    }

    // Aggregate global statistics
    const stats = await Transaction.aggregate([
      {
        $match: {
          status: 'confirmed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalVolumeSOL: { $sum: '$amountSOL' },
          totalVolumeUSD: { $sum: '$amountUSD' },
          averageTransactionSOL: { $avg: '$amountSOL' },
          averageTransactionUSD: { $avg: '$amountUSD' },
          uniqueWallets: { $addToSet: '$receiver' },
          uniqueSenders: { $addToSet: '$sender' }
        }
      },
      {
        $project: {
          _id: 0,
          totalTransactions: 1,
          totalVolumeSOL: { $round: ['$totalVolumeSOL', 6] },
          totalVolumeUSD: { $round: ['$totalVolumeUSD', 2] },
          averageTransactionSOL: { $round: ['$averageTransactionSOL', 6] },
          averageTransactionUSD: { $round: ['$averageTransactionUSD', 2] },
          uniqueWallets: { $size: '$uniqueWallets' },
          uniqueSenders: { $size: '$uniqueSenders' }
        }
      }
    ]);

    const result = stats[0] || {
      totalTransactions: 0,
      totalVolumeSOL: 0,
      totalVolumeUSD: 0,
      averageTransactionSOL: 0,
      averageTransactionUSD: 0,
      uniqueWallets: 0,
      uniqueSenders: 0
    };

    // Get top performing wallets
    const topWallets = await Transaction.aggregate([
      {
        $match: {
          status: 'confirmed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$receiver',
          totalReceivedSOL: { $sum: '$amountSOL' },
          totalReceivedUSD: { $sum: '$amountUSD' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalReceivedSOL: -1 }
      },
      {
        $limit: 20
      },
      {
        $project: {
          _id: 0,
          address: '$_id',
          totalReceivedSOL: { $round: ['$totalReceivedSOL', 6] },
          totalReceivedUSD: { $round: ['$totalReceivedUSD', 2] },
          transactionCount: 1
        }
      }
    ]);

    return {
      ...result,
      topWallets,
      period,
      startDate: dateFilter.timestamp?.$gte || null,
      endDate: dateFilter.timestamp?.$lte || null
    };
  } catch (error) {
    logger.error('Error calculating global stats:', error);
    throw new Error(`Failed to calculate global statistics: ${error.message}`);
  }
}

/**
 * Calculate trend analysis
 * @param {string} walletAddress - Wallet address
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Trend analysis
 */
export async function calculateTrendAnalysis(walletAddress, days = 30) {
  try {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get daily data points
    const dailyData = await Transaction.aggregate([
      {
        $match: {
          receiver: walletAddress,
          status: 'confirmed',
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          transactions: { $sum: 1 },
          volumeSOL: { $sum: '$amountSOL' },
          volumeUSD: { $sum: '$amountUSD' },
          uniqueSenders: { $addToSet: '$sender' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          transactions: 1,
          volumeSOL: { $round: ['$volumeSOL', 6] },
          volumeUSD: { $round: ['$volumeUSD', 2] },
          uniqueSenders: { $size: '$uniqueSenders' }
        }
      }
    ]);

    // Calculate trends
    const trends = calculateTrends(dailyData);

    return {
      walletAddress,
      period: `${days} days`,
      startDate,
      endDate: now,
      dailyData,
      trends
    };
  } catch (error) {
    logger.error(`Error calculating trend analysis for ${walletAddress}:`, error);
    throw new Error(`Failed to calculate trend analysis: ${error.message}`);
  }
}

/**
 * Calculate trends from daily data
 * @param {Array} dailyData - Daily data points
 * @returns {Object} Trend calculations
 */
function calculateTrends(dailyData) {
  if (dailyData.length < 2) {
    return {
      volumeTrend: 0,
      transactionTrend: 0,
      senderTrend: 0,
      volatility: 0
    };
  }

  // Calculate volume trend
  const volumeValues = dailyData.map(day => day.volumeSOL);
  const volumeTrend = calculateLinearTrend(volumeValues);

  // Calculate transaction count trend
  const transactionValues = dailyData.map(day => day.transactions);
  const transactionTrend = calculateLinearTrend(transactionValues);

  // Calculate unique senders trend
  const senderValues = dailyData.map(day => day.uniqueSenders);
  const senderTrend = calculateLinearTrend(senderValues);

  // Calculate volatility (standard deviation)
  const volatility = calculateVolatility(volumeValues);

  return {
    volumeTrend,
    transactionTrend,
    senderTrend,
    volatility
  };
}

/**
 * Calculate linear trend using simple linear regression
 * @param {Array} values - Array of values
 * @returns {number} Trend percentage
 */
function calculateLinearTrend(values) {
  const n = values.length;
  if (n < 2) return 0;

  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
  const sumX2 = values.reduce((sum, val, i) => sum + (i * i), 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const average = sumY / n;

  return average > 0 ? (slope / average) * 100 : 0;
}

/**
 * Calculate volatility (standard deviation)
 * @param {Array} values - Array of values
 * @returns {number} Volatility
 */
function calculateVolatility(values) {
  const n = values.length;
  if (n < 2) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  
  return Math.sqrt(variance);
}

/**
 * Generate insights from statistics
 * @param {Object} stats - Wallet statistics
 * @returns {Array} Array of insights
 */
export function generateInsights(stats) {
  const insights = [];

  // Transaction volume insights
  if (stats.totalTransactions === 0) {
    insights.push({
      type: 'info',
      message: 'No transactions yet. Share your wallet address to start receiving payments!',
      priority: 'low'
    });
  } else if (stats.totalTransactions === 1) {
    insights.push({
      type: 'success',
      message: 'First payment received! Your wallet is now active.',
      priority: 'medium'
    });
  } else if (stats.totalTransactions >= 10) {
    insights.push({
      type: 'success',
      message: `Great! You've received ${stats.totalTransactions} payments.`,
      priority: 'low'
    });
  }

  // Amount insights
  if (stats.averageAmountSOL > 1) {
    insights.push({
      type: 'success',
      message: `High average payment amount: ${stats.averageAmountSOL.toFixed(2)} SOL`,
      priority: 'medium'
    });
  }

  if (stats.uniqueSenders > 5) {
    insights.push({
      type: 'info',
      message: `Diverse payment sources: ${stats.uniqueSenders} unique senders`,
      priority: 'medium'
    });
  }

  // Growth insights
  if (stats.growthRate > 20) {
    insights.push({
      type: 'success',
      message: `Strong growth: ${stats.growthRate.toFixed(1)}% increase in recent activity`,
      priority: 'high'
    });
  } else if (stats.growthRate < -20) {
    insights.push({
      type: 'warning',
      message: `Activity declining: ${Math.abs(stats.growthRate).toFixed(1)}% decrease in recent activity`,
      priority: 'high'
    });
  }

  return insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}
