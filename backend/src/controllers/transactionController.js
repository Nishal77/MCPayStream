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
    const { page = 1, limit = 50, status, orderBy = 'desc', includeOnChain = 'true', onChainLimit } = req.query;

    logger.info(`Fetching transactions for address: ${address}`);

    // Get or create creator
    let creator = await getCreatorBySolanaAddress(address);
    if (!creator) {
      logger.info(`Creator not found for address: ${address}, creating default creator`);
      // Create default creator if not exists
      const { createCreator } = await import('../models/creator.js');
      const derivedEmail = `creator+${address.toLowerCase()}@mcpaystream.dev`;
      creator = await createCreator({
        name: 'Default Creator',
        email: derivedEmail,
        solanaAddress: address,
        commissionRate: 0.3,
        totalEarnings: 0,
      });
    }

    // Get database transactions
    let dbTransactions = [];
    try {
      const result = await getTransactionsByCreator(creator.id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        orderBy,
      });
      dbTransactions = result.transactions || [];
      logger.info(`Found ${dbTransactions.length} database transactions for creator ${creator.id}`);
    } catch (dbError) {
      logger.error('Error fetching database transactions:', dbError);
      // Continue with empty database transactions
    }

    // Normalize DB transactions to UI-friendly shape
    const dbNormalized = dbTransactions
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
        direction: tx.receiverAddress === address ? 'IN' : 'OUT'
      }));

    let merged = [...dbNormalized];
    logger.info(`Normalized ${dbNormalized.length} database transactions`);

    // Get on-chain transactions if requested
    if (includeOnChain === 'true') {
      try {
        const fetchLimit = parseInt(onChainLimit || limit);
        logger.info(`Fetching on-chain transactions with limit: ${fetchLimit}`);
        
        const [chainTxs, solPrice] = await Promise.all([
          getOnChainRecent(address, fetchLimit),
          getCachedSolPrice(),
        ]);

        logger.info(`Found ${chainTxs.length} on-chain transactions`);

        const chainNormalized = chainTxs
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
            direction: t.direction || (t.toAddress === address ? 'IN' : 'OUT')
          }));

        logger.info(`Normalized ${chainNormalized.length} on-chain transactions`);

        // Save new on-chain transactions to database (only incoming ones)
        const existingSignatures = new Set(dbNormalized.map((x) => x.signature).filter(Boolean));
        const newTransactions = chainNormalized.filter((x) => !existingSignatures.has(x.signature));
        
        logger.info(`Found ${newTransactions.length} new on-chain transactions to save`);
        
        // Save new transactions to database (only incoming ones)
        for (const tx of newTransactions) {
          if (tx.direction === 'IN') { // Only save incoming transactions to DB
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
        }

        // Deduplicate by signature/txHash
        const uniqueChain = chainNormalized.filter((x) => !existingSignatures.has(x.signature));
        merged = [...uniqueChain, ...dbNormalized];
        
        // Sort by blockTime desc when available
        merged.sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0));
        
        logger.info(`Final merged transactions: ${merged.length} total`);
      } catch (chainError) {
        logger.error('Error fetching on-chain transactions:', chainError);
        // Continue with database transactions only
      }
    }

    res.json(formatApiResponse({
      transactions: merged,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: merged.length,
        pages: Math.ceil(merged.length / parseInt(limit)),
      },
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

    res.json(formatApiResponse(stats, 'Transaction statistics retrieved successfully'));
  } catch (error) {
    logger.error('Error getting transaction stats:', error);
    res.status(500).json(formatApiError('Failed to get transaction statistics', error.message));
  }
};

/**
 * Force refresh transactions for a creator
 */
export const refreshCreatorTransactions = async (req, res) => {
  try {
    const { address } = req.params;
    
    logger.info(`Manual refresh requested for address: ${address}`);

    // Get or create creator
    let creator = await getCreatorBySolanaAddress(address);
    if (!creator) {
      const { createCreator } = await import('../models/creator.js');
      const derivedEmail = `creator+${address.toLowerCase()}@mcpaystream.dev`;
      creator = await createCreator({
        name: 'Default Creator',
        email: derivedEmail,
        solanaAddress: address,
        commissionRate: 0.3,
        totalEarnings: 0,
      });
    }

    // Fetch recent on-chain transactions
    const chainTxs = await getOnChainRecent(address, 50);
    const solPrice = await getCachedSolPrice();

    // Get existing database transactions
    const existingTxs = await getTransactionsByCreator(creator.id, { limit: 1000 });
    const existingSignatures = new Set(existingTxs.transactions.map(tx => tx.txHash));

    // Filter for new incoming transactions
    const newTransactions = chainTxs
      .filter(tx => tx.direction === 'IN' && !existingSignatures.has(tx.signature))
      .map(tx => ({
        txHash: tx.signature,
        senderAddress: tx.fromAddress,
        receiverAddress: tx.toAddress,
        amountSOL: tx.amountSOL,
        usdValue: tx.amountSOL * solPrice,
        status: 'CONFIRMED',
        creatorId: creator.id,
        timestamp: tx.blockTime ? new Date(tx.blockTime * 1000) : new Date(),
      }));

    logger.info(`Found ${newTransactions.length} new transactions to save`);

    // Save new transactions
    const savedTransactions = [];
    for (const txData of newTransactions) {
      try {
        const savedTx = await createTransaction(txData);
        savedTransactions.push(savedTx);
        logger.info(`Saved transaction: ${txData.txHash}`);
      } catch (error) {
        logger.error(`Failed to save transaction ${txData.txHash}:`, error);
      }
    }

    res.json(formatApiResponse({
      savedCount: savedTransactions.length,
      transactions: savedTransactions,
    }, 'Transactions refreshed successfully'));
  } catch (error) {
    logger.error('Error refreshing transactions:', error);
    res.status(500).json(formatApiError('Failed to refresh transactions', error.message));
  }
};

/**
 * Export transactions
 */
export const exportTransactions = async (req, res) => {
  try {
    const { address } = req.params;
    const { format = 'csv' } = req.query;

    const creator = await getCreatorBySolanaAddress(address);
    if (!creator) {
      return res.status(404).json(formatApiError('Creator not found'));
    }

    const result = await getTransactionsByCreator(creator.id, { limit: 1000 });
    
    if (format === 'json') {
      const jsonData = await exportTransactionsToJSON(result.transactions);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="transactions-${address}.json"`);
      res.json(jsonData);
    } else {
      const csvData = await exportTransactionsToCSV(result.transactions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="transactions-${address}.csv"`);
      res.send(csvData);
    }
  } catch (error) {
    logger.error('Error exporting transactions:', error);
    res.status(500).json(formatApiError('Failed to export transactions', error.message));
  }
};
