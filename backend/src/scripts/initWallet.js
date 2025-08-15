import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.js';
import Wallet from '../models/Wallet.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PHANTOM_WALLET_ADDRESS = '9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr';

const initializeWallet = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info('Connected to MongoDB');

    // Check if wallet already exists
    const existingWallet = await Wallet.findByAddress(PHANTOM_WALLET_ADDRESS);
    
    if (existingWallet) {
      logger.info('Phantom wallet already exists in database');
      return existingWallet;
    }

    // Create new wallet
    const walletData = {
      address: PHANTOM_WALLET_ADDRESS,
      name: 'Phantom Wallet',
      description: 'Default Phantom Solana wallet for MCPayStream',
      balance: 0,
      balanceUSD: 0,
      lastSolPrice: 0,
      isActive: true,
      settings: {
        autoConfirm: true,
        minAmount: 0.001,
        maxAmount: 1000,
        currency: 'SOL',
      },
      webhook: {
        enabled: false,
        url: '',
        secret: '',
      },
    };

    const newWallet = new Wallet(walletData);
    
    // Generate QR code for the wallet address
    await newWallet.generateQRCode();
    
    // Save wallet to database
    await newWallet.save();
    
    logger.info('Phantom wallet initialized successfully');
    logger.info(`Wallet Address: ${PHANTOM_WALLET_ADDRESS}`);
    logger.info(`Wallet Name: ${newWallet.name}`);
    
    return newWallet;
    
  } catch (error) {
    logger.error('Failed to initialize wallet:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
};

// Run the initialization if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeWallet()
    .then(() => {
      logger.info('Wallet initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Wallet initialization failed:', error);
      process.exit(1);
    });
}

export default initializeWallet;
