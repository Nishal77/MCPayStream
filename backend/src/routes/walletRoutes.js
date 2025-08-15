import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { 
  getCreator, 
  updateCreatorDetails, 
  getCreatorQRCode, 
  getCreatorStats,
  getAllCreatorsList,
  searchCreators
} from '../controllers/walletController.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Validation middleware
const validateAddress = param('address').isString().isLength({ min: 32, max: 44 });

// Get creator by Solana address
router.get('/:address', 
  validateAddress,
  getCreator
);

// Update creator details
router.put('/:address',
  validateAddress,
  [
    body('name').optional().isString().isLength({ min: 1, max: 100 }),
    body('email').optional().isEmail(),
    body('commissionRate').optional().isFloat({ min: 0, max: 1 }),
  ],
  updateCreatorDetails
);

// Get creator QR code
router.get('/:address/qr',
  validateAddress,
  getCreatorQRCode
);

// Get creator statistics
router.get('/:address/stats',
  validateAddress,
  getCreatorStats
);

// Get all creators
router.get('/', getAllCreatorsList);

// Search creators
router.get('/search', searchCreators);

export default router;
