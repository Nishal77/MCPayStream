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
    const { limit = 10 } = req.query;
    
    const senders = await getTopSenders(parseInt(limit));
    
    res.json(formatApiResponse('Top senders retrieved successfully', { senders }));
  } catch (error) {
    logger.error('Error getting top senders:', error);
    res.status(500).json(formatApiError('Failed to get top senders', error.message));
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
