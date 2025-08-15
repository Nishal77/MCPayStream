import { query, validationResult } from 'express-validator';
import { 
  getGlobalStats,
  getCreatorRankings,
  getTopSenders,
  getDailySummary,
  getCreatorTrendAnalysis,
  getPlatformInsights,
  getPerformanceMetrics
} from '../models/analytics.js';
import { getCreatorBySolanaAddress } from '../models/creator.js';
import logger from '../utils/logger.js';
import { formatApiResponse, formatApiError } from '../utils/format.js';

/**
 * Get global platform statistics
 */
export const getGlobalStatsController = async (req, res) => {
  try {
    const stats = await getGlobalStats();
    
    res.json(formatApiResponse('Global statistics retrieved successfully', stats));
  } catch (error) {
    logger.error('Error getting global stats:', error);
    res.status(500).json(formatApiError('Failed to get global statistics', error.message));
  }
};

/**
 * Get top senders
 */
export const getTopSendersController = async (req, res) => {
  try {
    const { limit = 10, period = '7d' } = req.query;
    
    const senders = await getTopSenders(parseInt(limit), period);
    
    // Always return success, even if no senders found
    res.json(formatApiResponse('Top senders retrieved successfully', { senders }));
  } catch (error) {
    logger.error('Error getting top senders:', error);
    // Return empty senders array instead of error
    res.json(formatApiResponse('Top senders retrieved successfully', { senders: [] }));
  }
};

/**
 * Get daily summary
 */
export const getDailySummaryController = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(formatApiError('Validation failed', errors.array()));
    }

    const { startDate, endDate, creatorId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json(formatApiError('Start date and end date are required'));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json(formatApiError('Invalid date format'));
    }

    const summary = await getDailySummary(start, end, creatorId);
    
    res.json(formatApiResponse('Daily summary retrieved successfully', summary));
  } catch (error) {
    logger.error('Error getting daily summary:', error);
    res.status(500).json(formatApiError('Failed to get daily summary', error.message));
  }
};

/**
 * Get creator rankings
 */
export const getCreatorRankingsController = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const rankings = await getCreatorRankings(parseInt(limit));
    
    res.json(formatApiResponse('Creator rankings retrieved successfully', { rankings }));
  } catch (error) {
    logger.error('Error getting creator rankings:', error);
    res.status(500).json(formatApiError('Failed to get creator rankings', error.message));
  }
};

/**
 * Get trend analysis for a creator
 */
export const getTrendAnalysisController = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { days = 30 } = req.query;
    
    const analysis = await getCreatorTrendAnalysis(creatorId, parseInt(days));
    
    res.json(formatApiResponse('Trend analysis retrieved successfully', { analysis }));
  } catch (error) {
    logger.error('Error getting trend analysis:', error);
    res.status(500).json(formatApiError('Failed to get trend analysis', error.message));
  }
};

/**
 * Get platform insights
 */
export const getPlatformInsightsController = async (req, res) => {
  try {
    const insights = await getPlatformInsights();
    
    res.json(formatApiResponse('Platform insights retrieved successfully', insights));
  } catch (error) {
    logger.error('Error getting platform insights:', error);
    res.status(500).json(formatApiError('Failed to get platform insights', error.message));
  }
};

/**
 * Get performance metrics
 */
export const getPerformanceMetricsController = async (req, res) => {
  try {
    const { creatorId } = req.query;
    
    const metrics = await getPerformanceMetrics(creatorId);
    
    res.json(formatApiResponse('Performance metrics retrieved successfully', metrics));
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json(formatApiError('Failed to get performance metrics', error.message));
  }
};

/**
 * Get earnings data for a wallet address over time
 */
export const getEarningsDataController = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(formatApiError('Validation failed', errors.array()));
    }

    const { address } = req.params;
    const { timeRange = '7D' } = req.query;
    
    // Convert timeRange to days
    const daysMap = {
      '24H': 1,
      '7D': 7,
      '30D': 30,
      '1Y': 365
    };
    
    const days = daysMap[timeRange] || 7;
    
    // Get creator by wallet address
    let creator = await getCreatorBySolanaAddress(address);
    if (!creator) {
      // Create default creator if not exists (same logic as wallet controller)
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
    
    // Get trend analysis data
    const trendData = await getCreatorTrendAnalysis(creator.id, days);
    
    // Fill in missing dates with zero values
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const filledData = [];
    const dataMap = {};
    
    // Create map of existing data
    trendData.forEach(item => {
      dataMap[item.date] = item;
    });
    
    // Fill all dates in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existingData = dataMap[dateStr];
      
      filledData.push({
        date: dateStr,
        earnings: existingData ? existingData.amountSOL : 0,
        earningsUSD: existingData ? existingData.usdValue : 0,
        transactions: existingData ? existingData.count : 0,
      });
    }
    
    res.json(formatApiResponse(filledData, 'Earnings data retrieved successfully'));
  } catch (error) {
    logger.error('Error getting earnings data:', error);
    res.status(500).json(formatApiError('Failed to get earnings data', error.message));
  }
};
