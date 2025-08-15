import { body, validationResult } from 'express-validator';
import { 
  getCreatorBySolanaAddress, 
  updateCreator, 
  createCreator,
  getAllCreators 
} from '../models/creator.js';
import { getTransactionStats } from '../models/Transaction.js';
import { getCachedSolPrice } from '../blockchain/price.js';
import { generateWalletQRCode } from '../utils/qrCode.js';
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
    
    let creator = await getCreatorBySolanaAddress(address);
    
    if (!creator) {
      // Create default creator if not exists
      creator = await createCreator({
        name: 'Default Creator',
        email: 'creator@mcpaystream.com',
        solanaAddress: address,
        commissionRate: 0.3,
        totalEarnings: 0,
      });
    }

    // Get current SOL price
    const solPrice = await getCachedSolPrice();
    
    // Get transaction statistics
    const stats = await getTransactionStats(creator.id);
    
    const response = {
      ...creator,
      currentSolPrice: solPrice,
      stats,
    };

    res.json(formatApiResponse('Creator retrieved successfully', response));
  } catch (error) {
    logger.error('Error getting creator:', error);
    res.status(500).json(formatApiError('Failed to get creator', error.message));
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

    res.json(formatApiResponse('Creator updated successfully', creator));
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
    
    res.json(formatApiResponse('QR code generated successfully', {
      address,
      qrCode: qrCodeData,
      creatorName: creator.name,
    }));
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

    res.json(formatApiResponse('Creator statistics retrieved successfully', response));
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
    
    res.json(formatApiResponse('Creators retrieved successfully', { creators }));
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
    
    res.json(formatApiResponse('Creators search completed', { creators }));
  } catch (error) {
    logger.error('Error searching creators:', error);
    res.status(500).json(formatApiError('Failed to search creators', error.message));
  }
};
