import { 
  getTransactionsByAddress, 
  getTransactionStats,
  getRecentTransactions 
} from '../models/Transaction.js';
import logger from '../utils/logger.js';
import { formatDate } from '../../../shared/formatters.js';


/**
 * Export transactions to CSV format
 * @param {string} walletAddress - Wallet address
 * @param {Object} options - Export options
 * @returns {Promise<string>} CSV content
 */
export async function exportTransactionsToCSV(walletAddress, options = {}) {
  try {
    const {
      startDate = null,
      endDate = null,
      status = null,
      includeHeaders = true,
      dateFormat = 'ISO'
    } = options;

    // Get transactions using Prisma-based function
    const result = await getTransactionsByAddress(walletAddress, {
      page: 1,
      limit: 1000, // Large limit for export
      orderBy: 'desc'
    });

    const transactions = result.transactions;

    // Generate CSV content
    let csvContent = '';
    
    if (includeHeaders) {
      csvContent += 'Date,Time,Sender Address,Sender Name,Receiver Address,Receiver Name,Amount (SOL),Amount (USD),Status,Transaction Hash,Timestamp\n';
    }

    transactions.forEach(tx => {
      const date = formatDate(tx.timestamp, dateFormat);
      const time = tx.timestamp.toTimeString().split(' ')[0];
      const senderAddress = tx.senderAddress || '';
      const senderName = '';
      const receiverAddress = tx.receiverAddress || '';
      const receiverName = tx.creator?.name || '';
      const amountSOL = tx.amountSOL || 0;
      const amountUSD = tx.usdValue || 0;
      const status = tx.status || '';
      const txHash = tx.txHash || '';

      const row = [
        date,
        time,
        `"${senderAddress}"`,
        `"${senderName}"`,
        `"${receiverAddress}"`,
        `"${receiverName}"`,
        amountSOL,
        amountUSD,
        status,
        `"${txHash}"`,
        tx.timestamp
      ].join(',');

      csvContent += row + '\n';
    });

    logger.info(`CSV export completed for wallet ${walletAddress}: ${transactions.length} transactions`);
    return csvContent;
  } catch (error) {
    logger.error(`Error exporting transactions to CSV for ${walletAddress}:`, error);
    throw new Error(`Failed to export transactions: ${error.message}`);
  }
}

/**
 * Export transactions to JSON format
 * @param {string} walletAddress - Wallet address
 * @param {Object} options - Export options
 * @returns {Promise<Object>} JSON data
 */
export async function exportTransactionsToJSON(walletAddress, options = {}) {
  try {
    const {
      startDate = null,
      endDate = null,
      status = null,
      includeMetadata = true,
      pretty = false
    } = options;

    // Get transactions using Prisma-based function
    const result = await getTransactionsByAddress(walletAddress, {
      page: 1,
      limit: 1000, // Large limit for export
      orderBy: 'desc'
    });

    const transactions = result.transactions;

    // Prepare export data
    const exportData = {
      walletAddress,
      exportDate: new Date().toISOString(),
      totalTransactions: transactions.length,
      transactions: transactions.map(tx => ({
        txHash: tx.txHash,
        sender: {
          address: tx.senderAddress,
          name: ''
        },
        receiver: {
          address: tx.receiverAddress,
          name: tx.creator?.name || ''
        },
        amount: {
          SOL: tx.amountSOL,
          USD: tx.usdValue
        },
        status: tx.status,
        timestamp: tx.timestamp,
        creatorId: tx.creatorId
      }))
    };

    if (includeMetadata) {
      exportData.metadata = {
        exportOptions: options,
        generatedBy: 'MCPayStream Export Service',
        version: '1.0.0'
      };
    }

    logger.info(`JSON export completed for wallet ${walletAddress}: ${transactions.length} transactions`);
    return exportData;
  } catch (error) {
    logger.error(`Error exporting transactions to JSON for ${walletAddress}:`, error);
    throw new Error(`Failed to export transactions: ${error.message}`);
  }
}

/**
 * Export wallet summary report
 * @param {string} walletAddress - Wallet address
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Summary report
 */
export async function exportWalletSummary(walletAddress, options = {}) {
  try {
    const {
      period = 'all',
      startDate = null,
      endDate = null,
      includeCharts = false
    } = options;

    // Calculate wallet statistics using Prisma-based function
    const stats = await getTransactionStats();

    // Get recent transactions for sample
    const recentTransactions = await getRecentTransactions(10);

    // Prepare summary report
    const summaryReport = {
      walletAddress,
      exportDate: new Date().toISOString(),
      period,
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: endDate || new Date(),
      summary: {
        totalTransactions: stats.total,
        totalReceivedSOL: stats.totalAmountSOL,
        totalReceivedUSD: stats.totalAmountUSD,
        averageAmountSOL: stats.total > 0 ? stats.totalAmountSOL / stats.total : 0,
        averageAmountUSD: stats.total > 0 ? stats.totalAmountUSD / stats.total : 0,
        confirmedTransactions: stats.confirmed,
        pendingTransactions: stats.pending,
        failedTransactions: stats.failed
      },
      recentTransactions: recentTransactions.map(tx => ({
        txHash: tx.txHash,
        sender: tx.senderAddress,
        amountSOL: tx.amountSOL,
        amountUSD: tx.usdValue,
        timestamp: tx.timestamp,
        status: tx.status
      })),
      generatedBy: 'MCPayStream Summary Service',
      version: '1.0.0'
    };

    logger.info(`Wallet summary export completed for ${walletAddress}`);
    return summaryReport;
  } catch (error) {
    logger.error(`Error exporting wallet summary for ${walletAddress}:`, error);
    throw new Error(`Failed to export wallet summary: ${error.message}`);
  }
}

/**
 * Export platform analytics report
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Analytics report
 */
export async function exportPlatformAnalytics(options = {}) {
  try {
    const {
      period = '7d',
      startDate = null,
      endDate = null,
      includeTopWallets = true,
      includeTrends = true
    } = options;

    // Calculate global statistics using Prisma-based function
    const stats = await getTransactionStats();

    // Prepare analytics report
    const analyticsReport = {
      exportDate: new Date().toISOString(),
      period,
      startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: endDate || new Date(),
      platformMetrics: {
        totalTransactions: stats.total,
        totalVolumeSOL: stats.totalAmountSOL,
        totalVolumeUSD: stats.totalAmountUSD,
        averageTransactionSOL: stats.total > 0 ? stats.totalAmountSOL / stats.total : 0,
        averageTransactionUSD: stats.total > 0 ? stats.totalAmountUSD / stats.total : 0,
        confirmedTransactions: stats.confirmed,
        pendingTransactions: stats.pending,
        failedTransactions: stats.failed
      },
      generatedBy: 'MCPayStream Analytics Service',
      version: '1.0.0'
    };

    if (includeTrends) {
      // Add trend analysis if requested
      analyticsReport.trends = {
        note: 'Trend analysis requires additional processing time',
        available: true
      };
    }

    logger.info('Platform analytics export completed');
    return analyticsReport;
  } catch (error) {
    logger.error('Error exporting platform analytics:', error);
    throw new Error(`Failed to export platform analytics: ${error.message}`);
  }
}

/**
 * Generate export filename
 * @param {string} walletAddress - Wallet address
 * @param {string} format - Export format
 * @param {string} type - Export type
 * @param {Date} date - Export date
 * @returns {string} Generated filename
 */
export function generateExportFilename(walletAddress, format, type, date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  const shortAddress = walletAddress.slice(0, 8) + '...' + walletAddress.slice(-4);
  
  return `mcpaystream_${type}_${shortAddress}_${dateStr}_${timeStr}.${format}`;
}

/**
 * Validate export options
 * @param {Object} options - Export options to validate
 * @returns {Object} Validation result
 */
export function validateExportOptions(options) {
  const errors = [];
  const warnings = [];

  // Validate date ranges
  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      errors.push('Invalid date format provided');
    } else if (start > end) {
      errors.push('Start date must be before end date');
    }
  }

  // Validate period
  if (options.period && !['24h', '7d', '30d', '1y', 'all'].includes(options.period)) {
    errors.push('Invalid period specified');
  }

  // Validate status
  if (options.status && !['PENDING', 'CONFIRMED', 'FAILED'].includes(options.status)) {
    errors.push('Invalid status specified');
  }

  // Warnings for large exports
  if (options.period === '1y' || options.period === 'all') {
    warnings.push('Large export period may take significant time to process');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get export statistics
 * @param {string} walletAddress - Wallet address
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Export statistics
 */
export async function getExportStats(walletAddress, options = {}) {
  try {
    const {
      startDate = null,
      endDate = null,
      status = null
    } = options;

    // Get transactions using Prisma-based function
    const result = await getTransactionsByAddress(walletAddress, {
      page: 1,
      limit: 1000,
      orderBy: 'desc'
    });

    const transactions = result.transactions;
    const totalTransactions = result.pagination.total;
    
    // Calculate date range
    let minDate = null;
    let maxDate = null;
    
    if (transactions.length > 0) {
      minDate = new Date(Math.min(...transactions.map(tx => tx.timestamp)));
      maxDate = new Date(Math.max(...transactions.map(tx => tx.timestamp)));
    }

    const stats = {
      walletAddress,
      totalTransactions,
      estimatedFileSize: {
        CSV: Math.round(totalTransactions * 0.5), // ~0.5 KB per transaction
        JSON: Math.round(totalTransactions * 2)   // ~2 KB per transaction
      },
      dateRange: { minDate, maxDate },
      exportOptions: options
    };

    return stats;
  } catch (error) {
    logger.error(`Error getting export stats for ${walletAddress}:`, error);
    throw new Error(`Failed to get export statistics: ${error.message}`);
  }
}
