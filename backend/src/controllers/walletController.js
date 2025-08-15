import { body, param, validationResult } from 'express-validator';
import { 
  getCreatorBySolanaAddress, 
  createCreator, 
  updateCreator, 
  getAllCreators 
} from '../models/creator.js';
import { getTransactionStats } from '../models/Transaction.js';
import { 
  getWalletBalance, 
  getWalletAccountInfo, 
  getWalletTokenAccounts, 
  getWalletTransactionCount,
  walletExists,
  isValidSolanaAddress
} from '../blockchain/wallet.js';
import { getCachedSolPrice } from '../blockchain/price.js';
import realTimeService from '../services/realTimeService.js';
import logger from '../utils/logger.js';
import { formatApiResponse, formatApiError } from '../utils/format.js';

/**
 * Get creator by Solana address
 */
export const getCreator = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(formatApiError('Validation failed', errors.array()));
    }

    const { address } = req.params;
    
    // Validate Solana address
    if (!isValidSolanaAddress(address)) {
      return res.status(400).json(formatApiError('Invalid Solana address'));
    }



    // Get live blockchain data
    const [balance, accountInfo, tokenAccounts, transactionCount, solPrice] = await Promise.allSettled([
      getWalletBalance(address),
      getWalletAccountInfo(address),
      getWalletTokenAccounts(address),
      getWalletTransactionCount(address),
      getCachedSolPrice()
    ]);
    
    // Handle results with proper error handling
    const balanceValue = balance.status === 'fulfilled' ? balance.value : 0;
    const accountInfoValue = accountInfo.status === 'fulfilled' ? accountInfo.value : { lamports: 0, owner: address, executable: false, rentEpoch: 0 };
    const tokenAccountsValue = tokenAccounts.status === 'fulfilled' ? tokenAccounts.value : [];
    const transactionCountValue = transactionCount.status === 'fulfilled' ? transactionCount.value : 0;
    const solPriceValue = solPrice.status === 'fulfilled' ? solPrice.value : 0;
    
    let creator = await getCreatorBySolanaAddress(address);
    
    if (!creator) {
      // Create default creator if not exists
      // Use a unique email derived from the wallet address to satisfy DB unique constraint
      const derivedEmail = `creator+${address.toLowerCase()}@mcpaystream.dev`;
      creator = await createCreator({
        name: 'Default Creator',
        email: derivedEmail,
        solanaAddress: address,
        commissionRate: 0.3,
        totalEarnings: 0,
      });
    }

    // Get transaction statistics from database
    const stats = await getTransactionStats(creator.id);
    
    // Calculate USD values
    const balanceUSD = balanceValue * solPriceValue;
    const totalEarningsUSD = (stats.totalAmountSOL || 0) * solPriceValue;
    
    const response = {
      id: creator.id,
      name: creator.name,
      email: creator.email,
      solanaAddress: address,
      commissionRate: creator.commissionRate,
      totalEarnings: creator.totalEarnings,
      // Live blockchain data
      balance: balanceValue,
      balanceUSD: balanceUSD,
      currentSolPrice: solPriceValue,
      accountInfo: {
        lamports: accountInfoValue.lamports,
        owner: accountInfoValue.owner,
        executable: accountInfoValue.executable,
        rentEpoch: accountInfoValue.rentEpoch
      },
      tokenAccounts: tokenAccountsValue,
      transactionCount: transactionCountValue,
      // Database stats
      stats: {
        ...stats,
        totalEarningsUSD: totalEarningsUSD,
        totalEarningsSOL: stats.totalAmountSOL || 0,
        transactionCount: stats.transactionCount || 0,
        totalReceived: stats.totalAmountSOL || 0,
        totalReceivedUSD: totalEarningsUSD
      },
      // Metadata
      lastUpdated: new Date().toISOString(),
      isLiveData: true
    };

    res.json(formatApiResponse(response, 'Live wallet data retrieved successfully'));
    
    // Start real-time monitoring for this wallet
    try {
      realTimeService.startMonitoringWallet(address);
      logger.info(`Started real-time monitoring for wallet: ${address}`);
    } catch (error) {
      logger.error(`Failed to start real-time monitoring for wallet ${address}:`, error);
    }
  } catch (error) {
    logger.error('Error getting creator:', error);
    res.status(500).json(formatApiError('Failed to get live wallet data', error.message));
  }
};

/**
 * Update creator
 */
export const updateCreatorDetails = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(formatApiError('Validation failed', errors.array()));
    }

    const { address } = req.params;
    const updateData = req.body;

    let creator = await getCreatorBySolanaAddress(address);
    
    if (!creator) {
      return res.status(404).json(formatApiError('Creator not found'));
    }

    creator = await updateCreator(creator.id, updateData);

    res.json(formatApiResponse(creator, 'Creator updated successfully'));
  } catch (error) {
    logger.error('Error updating creator:', error);
    res.status(500).json(formatApiError('Failed to update creator', error.message));
  }
};

/**
 * Get creator QR code
 */
export const getCreatorQRCode = async (req, res) => {
  try {
    const { address } = req.params;
    
    const creator = await getCreatorBySolanaAddress(address);
    
    if (!creator) {
      return res.status(404).json(formatApiError('Creator not found'));
    }

    const qrCodeData = await generateWalletQRCode(address, creator.name);
    
    res.json(formatApiResponse({
      address,
      qrCode: qrCodeData,
      creatorName: creator.name,
    }, 'QR code generated successfully'));
  } catch (error) {
    logger.error('Error generating QR code:', error);
    res.status(500).json(formatApiError('Failed to generate QR code', error.message));
  }
};

/**
 * Get creator statistics
 */
export const getCreatorStats = async (req, res) => {
  try {
    const { address } = req.params;
    
    const creator = await getCreatorBySolanaAddress(address);
    
    if (!creator) {
      return res.status(404).json(formatApiError('Creator not found'));
    }

    const stats = await getTransactionStats(creator.id);
    const solPrice = await getCachedSolPrice();
    
    const response = {
      creator: {
        id: creator.id,
        name: creator.name,
        solanaAddress: creator.solanaAddress,
        commissionRate: creator.commissionRate,
        totalEarnings: creator.totalEarnings,
      },
      stats: {
        ...stats,
        currentSolPrice: solPrice,
        totalEarningsSOL: stats.totalAmountSOL,
        totalEarningsUSD: stats.totalAmountUSD,
      },
    };

    res.json(formatApiResponse(response, 'Creator statistics retrieved successfully'));
  } catch (error) {
    logger.error('Error getting creator stats:', error);
    res.status(500).json(formatApiError('Failed to get creator statistics', error.message));
  }
};

/**
 * Get all creators
 */
export const getAllCreatorsList = async (req, res) => {
  try {
    const { includeTransactions = false } = req.query;
    
    const creators = await getAllCreators(includeTransactions === 'true');
    
    res.json(formatApiResponse({ creators }, 'Creators retrieved successfully'));
  } catch (error) {
    logger.error('Error getting all creators:', error);
    res.status(500).json(formatApiError('Failed to get creators', error.message));
  }
};

/**
 * Search creators
 */
export const searchCreators = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json(formatApiError('Search query is required'));
    }

    const creators = await searchCreators(q, parseInt(limit));
    
    res.json(formatApiResponse({ creators }, 'Creators search completed'));
  } catch (error) {
    logger.error('Error searching creators:', error);
    res.status(500).json(formatApiError('Failed to search creators', error.message));
  }
};
