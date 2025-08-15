import { body, query, validationResult } from 'express-validator';
import { 
  getTransactionById,
  getTransactionByHash,
  getTransactionsByCreator,
  getTransactionsByAddress,
  updateTransactionStatus,
  updateTransaction,
  getRecentTransactions,
  getTransactionStats,
  deleteTransaction,
  createTransaction
} from '../models/Transaction.js';
import { getCreatorBySolanaAddress } from '../models/creator.js';
import { exportTransactionsToCSV, exportTransactionsToJSON } from '../services/exportService.js';
import { sendPaymentWebhook } from '../services/webhookService.js';
import logger from '../utils/logger.js';
import { formatApiResponse, formatApiError } from '../utils/format.js';
import { getRecentTransactions as getOnChainRecent } from '../blockchain/transactions.js';
import { getCachedSolPrice } from '../blockchain/price.js';

/**
 * Get transactions for a creator
 */
export const getCreatorTransactions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(formatApiError('Validation failed', errors.array()));
    }

    const { address } = req.params;
    const { page = 1, limit = 20, status, orderBy = 'desc', includeOnChain = 'true', onChainLimit } = req.query;

    const creator = await getCreatorBySolanaAddress(address);
    if (!creator) {
      return res.status(404).json(formatApiError('Creator not found'));
    }

    const result = await getTransactionsByCreator(creator.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      orderBy,
    });

    // Normalize DB transactions to UI-friendly shape
    const dbNormalized = result.transactions
      .filter(tx => tx.receiverAddress === address) // Only incoming transactions
      .map((tx) => ({
        id: tx.id,
        signature: tx.txHash,
        fromAddress: tx.senderAddress,
        toAddress: tx.receiverAddress,
        amount: tx.amountSOL,
        amountUSD: tx.usdValue,
        status: (tx.status || 'CONFIRMED').toLowerCase(),
        blockTime: tx.timestamp ? new Date(tx.timestamp).getTime() : undefined,
        source: 'db',
        direction: 'IN'
      }));

    let merged = [...dbNormalized];

    if (includeOnChain === 'true') {
      const fetchLimit = parseInt(onChainLimit || limit);
      const [chainTxs, solPrice] = await Promise.all([
        getOnChainRecent(address, fetchLimit),
        getCachedSolPrice(),
      ]);

      const chainNormalized = chainTxs
        .filter(tx => tx.direction === 'IN') // Only incoming transactions
        .map((t) => ({
          id: `onchain-${t.signature}`,
          signature: t.signature,
          fromAddress: t.fromAddress,
          toAddress: t.toAddress,
          amount: t.amountSOL,
          amountUSD: t.amountSOL * (solPrice || 0),
          status: 'confirmed',
          blockTime: t.blockTime ? t.blockTime * 1000 : undefined,
          source: 'onchain',
          direction: 'IN'
        }));

      // Save new on-chain transactions to database
      const existingSignatures = new Set(dbNormalized.map((x) => x.signature).filter(Boolean));
      const newTransactions = chainNormalized.filter((x) => !existingSignatures.has(x.signature));
      
      logger.info(`Found ${newTransactions.length} new on-chain transactions to save`);
      
      // Save new transactions to database
      for (const tx of newTransactions) {
        try {
          const savedTx = await createTransaction({
            txHash: tx.signature,
            senderAddress: tx.fromAddress,
            receiverAddress: tx.toAddress,
            amountSOL: tx.amount,
            usdValue: tx.amountUSD,
            status: 'CONFIRMED',
            creatorId: creator.id,
            timestamp: tx.blockTime ? new Date(tx.blockTime) : new Date(),
          });
          logger.info(`Saved on-chain transaction to DB: ${tx.signature} - ${tx.amount} SOL`);
          
          // Emit real-time update for this new transaction
          try {
            const { emitTransactionUpdate } = await import('../socket.js');
            emitTransactionUpdate(address, {
              id: savedTx.id,
              signature: tx.signature,
              fromAddress: tx.fromAddress,
              toAddress: tx.toAddress,
              amount: tx.amount,
              amountUSD: tx.amountUSD,
              status: 'confirmed',
              blockTime: tx.blockTime,
              source: 'onchain',
              direction: 'IN'
            });
          } catch (socketError) {
            logger.warn('Failed to emit transaction update:', socketError);
          }
        } catch (error) {
          logger.error(`Failed to save transaction ${tx.signature}:`, error);
          // Continue with other transactions
        }
      }

      // Deduplicate by signature/txHash
      const uniqueChain = chainNormalized.filter((x) => !existingSignatures.has(x.signature));
      merged = [...uniqueChain, ...dbNormalized];
      // Sort by blockTime desc when available
      merged.sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0));
    }

    res.json(formatApiResponse({
      transactions: merged,
      pagination: result.pagination,
    }, 'Transactions retrieved successfully'));
  } catch (error) {
    logger.error('Error getting creator transactions:', error);
    res.status(500).json(formatApiError('Failed to get transactions', error.message));
  }
};

/**
 * Get transaction by ID
 */
export const getTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await getTransactionById(id);
    if (!transaction) {
      return res.status(404).json(formatApiError('Transaction not found'));
    }

    res.json(formatApiResponse(transaction, 'Transaction retrieved successfully'));
  } catch (error) {
    logger.error('Error getting transaction:', error);
    res.status(500).json(formatApiError('Failed to get transaction', error.message));
  }
};

/**
 * Get transaction by hash
 */
export const getTransactionByHashController = async (req, res) => {
  try {
    const { hash } = req.params;

    const transaction = await getTransactionByHash(hash);
    if (!transaction) {
      return res.status(404).json(formatApiError('Transaction not found'));
    }

    res.json(formatApiResponse(transaction, 'Transaction retrieved successfully'));
  } catch (error) {
    logger.error('Error getting transaction by hash:', error);
    res.status(500).json(formatApiError('Failed to get transaction', error.message));
  }
};

/**
 * Get transaction statistics for a creator
 */
export const getTransactionStatsController = async (req, res) => {
  try {
    const { address } = req.params;

    const creator = await getCreatorBySolanaAddress(address);
    if (!creator) {
      return res.status(404).json(formatApiError('Creator not found'));
    }

    const stats = await getTransactionStats(creator.id);

    res.json(formatApiResponse({
      creator: {
        id: creator.id,
        name: creator.name,
        solanaAddress: creator.solanaAddress,
      },
      stats,
    }, 'Transaction statistics retrieved successfully'));
  } catch (error) {
    logger.error('Error getting transaction statistics:', error);
    res.status(500).json(formatApiError('Failed to get transaction statistics', error.message));
  }
};

/**
 * Export transactions
 */
export const exportTransactions = async (req, res) => {
  try {
    const { address } = req.params;
    const { format = 'csv', startDate, endDate } = req.query;

    const creator = await getCreatorBySolanaAddress(address);
    if (!creator) {
      return res.status(404).json(formatApiError('Creator not found'));
    }

    let data;
    let filename;
    let contentType;

    if (format.toLowerCase() === 'csv') {
      data = await exportTransactionsToCSV(creator.id, { startDate, endDate });
      filename = `transactions_${creator.solanaAddress}_${new Date().toISOString().split('T')[0]}.csv`;
      contentType = 'text/csv';
    } else if (format.toLowerCase() === 'json') {
      data = await exportTransactionsToJSON(creator.id, { startDate, endDate });
      filename = `transactions_${creator.solanaAddress}_${new Date().toISOString().split('T')[0]}.json`;
      contentType = 'application/json';
    } else {
      return res.status(400).json(formatApiError('Invalid export format. Use "csv" or "json"'));
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  } catch (error) {
    logger.error('Error exporting transactions:', error);
    res.status(500).json(formatApiError('Failed to export transactions', error.message));
  }
};

/**
 * Update transaction status
 */
export const updateTransactionStatusController = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(formatApiError('Validation failed', errors.array()));
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'FAILED'].includes(status)) {
      return res.status(400).json(formatApiError('Invalid status. Must be PENDING, CONFIRMED, or FAILED'));
    }

    const transaction = await updateTransactionStatus(id, status);

    // Send webhook if status is confirmed
    if (status === 'CONFIRMED') {
      try {
        await sendPaymentWebhook(transaction);
      } catch (webhookError) {
        logger.warn('Failed to send payment webhook:', webhookError);
      }
    }

    res.json(formatApiResponse('Transaction status updated successfully', transaction));
  } catch (error) {
    logger.error('Error updating transaction status:', error);
    res.status(500).json(formatApiError('Failed to update transaction status', error.message));
  }
};

/**
 * Get recent transactions
 */
export const getRecentTransactionsController = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const transactions = await getRecentTransactions(parseInt(limit));

    res.json(formatApiResponse({ transactions }, 'Recent transactions retrieved successfully'));
  } catch (error) {
    logger.error('Error getting recent transactions:', error);
    res.status(500).json(formatApiError('Failed to get recent transactions', error.message));
  }
};

/**
 * Get transactions by address
 */
export const getTransactionsByAddressController = async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20, orderBy = 'desc' } = req.query;

    const result = await getTransactionsByAddress(address, {
      page: parseInt(page),
      limit: parseInt(limit),
      orderBy,
    });

    res.json(formatApiResponse({
      transactions: result.transactions,
      pagination: formatPagination(result.pagination),
    }, 'Transactions retrieved successfully'));
  } catch (error) {
    logger.error('Error getting transactions by address:', error);
    res.status(500).json(formatApiError('Failed to get transactions', error.message));
  }
};

/**
 * Force refresh transactions for a creator
 */
export const refreshCreatorTransactions = async (req, res) => {
  try {
    const { address } = req.params;
    
    const creator = await getCreatorBySolanaAddress(address);
    if (!creator) {
      return res.status(404).json(formatApiError('Creator not found'));
    }

    logger.info(`Manual refresh requested for wallet: ${address}`);

    // Force fetch new on-chain transactions
    const [chainTxs, solPrice] = await Promise.all([
      getOnChainRecent(address, 50), // Fetch more transactions
      getCachedSolPrice(),
    ]);

    const chainNormalized = chainTxs
      .filter(tx => tx.direction === 'IN') // Only incoming transactions
      .map((t) => ({
        id: `onchain-${t.signature}`,
        signature: t.signature,
        fromAddress: t.fromAddress,
        toAddress: t.toAddress,
        amount: t.amountSOL,
        amountUSD: t.amountSOL * (solPrice || 0),
        status: 'confirmed',
        blockTime: t.blockTime ? t.blockTime * 1000 : undefined,
        source: 'onchain',
        direction: 'IN'
      }));

    // Get existing database transactions
    const existingTxs = await getTransactionsByCreator(creator.id, { limit: 100 });
    const existingSignatures = new Set(existingTxs.transactions.map((x) => x.txHash).filter(Boolean));
    
    // Find new transactions
    const newTransactions = chainNormalized.filter((x) => !existingSignatures.has(x.signature));
    
    logger.info(`Found ${newTransactions.length} new transactions to save`);

    // Save new transactions to database
    for (const tx of newTransactions) {
      try {
        const savedTx = await createTransaction({
          txHash: tx.signature,
          senderAddress: tx.fromAddress,
          receiverAddress: tx.toAddress,
          amountSOL: tx.amount,
          usdValue: tx.amountUSD,
          status: 'CONFIRMED',
          creatorId: creator.id,
          timestamp: tx.blockTime ? new Date(tx.blockTime) : new Date(),
        });
        logger.info(`Saved new transaction: ${tx.signature} - ${tx.amount} SOL`);
      } catch (error) {
        logger.error(`Failed to save transaction ${tx.signature}:`, error);
      }
    }

    // Get updated transaction list
    const result = await getTransactionsByCreator(creator.id, { limit: 50 });
    
    // Normalize DB transactions
    const dbNormalized = result.transactions
      .filter(tx => tx.receiverAddress === address)
      .map((tx) => ({
        id: tx.id,
        signature: tx.txHash,
        fromAddress: tx.senderAddress,
        toAddress: tx.receiverAddress,
        amount: tx.amountSOL,
        amountUSD: tx.usdValue,
        status: (tx.status || 'CONFIRMED').toLowerCase(),
        blockTime: tx.timestamp ? new Date(tx.timestamp).getTime() : undefined,
        source: 'db',
        direction: 'IN'
      }));

    // Merge and sort
    const merged = [...dbNormalized];
    merged.sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0));

    res.json(formatApiResponse({
      transactions: merged,
      newTransactionsCount: newTransactions.length,
      totalTransactions: merged.length,
    }, `Transactions refreshed successfully. Found ${newTransactions.length} new transactions.`));
  } catch (error) {
    logger.error('Error refreshing transactions:', error);
    res.status(500).json(formatApiError('Failed to refresh transactions', error.message));
  }
};
