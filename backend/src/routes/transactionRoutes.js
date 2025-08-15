import { Router } from 'express';
import { 
  getCreatorTransactions, 
  getTransaction, 
  getTransactionByHashController,
  getTransactionStatsController,
  exportTransactions,
  refreshCreatorTransactions
} from '../controllers/transactionController.js';
import { param } from 'express-validator';

const router = Router();

// Get transactions for a creator
router.get('/creator/:address', [
  param('address').isString().notEmpty(),
], getCreatorTransactions);

// Force refresh transactions for a creator
router.post('/refresh/:address', [
  param('address').isString().notEmpty(),
], refreshCreatorTransactions);

// Get transaction by ID
router.get('/:id', getTransaction);

// Get transaction by hash
router.get('/hash/:hash', getTransactionByHashController);

// Get transaction statistics
router.get('/stats/:address', getTransactionStatsController);

// Export transactions
router.get('/export/:address', exportTransactions);

export default router;
