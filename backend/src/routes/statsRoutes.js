import express from 'express';
import { query, validationResult } from 'express-validator';
import { 
  getGlobalStatsController,
  getTopSendersController,
  getDailySummaryController,
  getCreatorRankingsController,
  getTrendAnalysisController,
  getPlatformInsightsController,
  getPerformanceMetricsController,
  getEarningsDataController
} from '../controllers/statsController.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get global platform statistics
router.get('/global', getGlobalStatsController);

// Get top senders
router.get('/top-senders', getTopSendersController);

// Get daily summary
router.get('/daily-summary', 
  [
    query('startDate').isISO8601().toDate(),
    query('endDate').isISO8601().toDate(),
    query('creatorId').optional().isUUID(),
  ],
  getDailySummaryController
);

// Get creator rankings
router.get('/rankings', getCreatorRankingsController);

// Get trend analysis for a creator
router.get('/trends/:creatorId', getTrendAnalysisController);

// Get earnings data for a wallet address
router.get('/earnings/:address', getEarningsDataController);

// Get platform insights
router.get('/insights', getPlatformInsightsController);

// Get performance metrics
router.get('/performance', getPerformanceMetricsController);

export default router;
