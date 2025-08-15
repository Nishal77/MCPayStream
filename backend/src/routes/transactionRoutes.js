import express from 'express';
import { query, param, validationResult } from 'express-validator';
import { 
  getCreatorTransactions,
  getTransaction,
  getTransactionByHashController,
  getTransactionStatsController,
  exportTransactions,
  updateTransactionStatusController,
  getRecentTransactionsController,
  getTransactionsByAddressController
} from '../controllers/transactionController.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Validation middleware
const validateAddress = param('address').isString().isLength({ min: 32, max: 44 });

// Get transactions for a creator
router.get('/creator/:address', 
  validateAddress,
  getCreatorTransactions
);

// Get transaction by ID
router.get('/:id', getTransaction);

// Get transaction by hash
router.get('/hash/:hash', getTransactionByHashController);

// Get transaction statistics for a creator
router.get('/stats/:address',
  validateAddress,
  getTransactionStatsController
);

// Export transactions
router.get('/export/:address',
  validateAddress,
  exportTransactions
);

// Update transaction status
router.patch('/:id/status',
  [
    query('status').isIn(['PENDING', 'CONFIRMED', 'FAILED']),
  ],
  updateTransactionStatusController
);

// Get recent transactions
router.get('/recent', getRecentTransactionsController);

// Get transactions by address (sender or receiver)
router.get('/address/:address',
  validateAddress,
  getTransactionsByAddressController
);

export default router;
