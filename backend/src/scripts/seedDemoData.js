// This script is temporarily disabled as it uses MongoDB operations
// The project has migrated to Prisma with PostgreSQL
// TODO: Update this script to use Prisma operations

/*
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.js';
import { 
  createTransaction 
} from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PHANTOM_WALLET_ADDRESS = '9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr';

const generateDemoTransactions = () => {
  const transactions = [];
  const now = new Date();
  
  // Generate transactions for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random number of transactions per day (0-3)
    const dailyTransactions = Math.floor(Math.random() * 4);
    
    for (let j = 0; j < dailyTransactions; j++) {
      const amount = Math.random() * 5 + 0.1; // 0.1 to 5.1 SOL
      const solPrice = Math.random() * 50 + 100; // $100 to $150
      const amountUSD = amount * solPrice;
      
      transactions.push({
        signature: `demo_${Date.now()}_${i}_${j}`,
        fromAddress: `demo_sender_${Math.floor(Math.random() * 1000)}`,
        toAddress: PHANTOM_WALLET_ADDRESS,
        amount: parseFloat(amount.toFixed(4)),
        amountUSD: parseFloat(amountUSD.toFixed(2)),
        solPrice: parseFloat(solPrice.toFixed(2)),
        status: 'confirmed',
        blockTime: date,
        slot: Math.floor(Math.random() * 1000000),
        fee: 0.000005,
        memo: `Demo payment ${i + 1}.${j + 1}`,
        metadata: {
          source: 'demo',
          day: i,
          transaction: j
        }
      });
    }
  }
  
  return transactions;
};

const seedDemoData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info('Connected to MongoDB');

    // Check if demo data already exists
    const existingTransactions = await createTransaction.find({ 
      toAddress: PHANTOM_WALLET_ADDRESS,
      'metadata.source': 'demo'
    });
    
    if (existingTransactions.length > 0) {
      logger.info(`Demo data already exists (${existingTransactions.length} transactions)`);
      return existingTransactions;
    }

    // Generate demo transactions
    const demoTransactions = generateDemoTransactions();
    
    // Save transactions to database
    const savedTransactions = await createTransaction.insertMany(demoTransactions);
    
    logger.info(`Created ${savedTransactions.length} demo transactions`);
    
    // Update wallet statistics
    const wallet = await Wallet.findByAddress(PHANTOM_WALLET_ADDRESS);
    if (wallet) {
      const totalReceived = demoTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const totalReceivedUSD = demoTransactions.reduce((sum, tx) => sum + tx.amountUSD, 0);
      
      wallet.stats.totalReceived = totalReceived;
      wallet.stats.totalReceivedUSD = totalReceivedUSD;
      wallet.stats.transactionCount = demoTransactions.length;
      wallet.stats.lastTransactionAt = new Date();
      
      await wallet.save();
      
      logger.info(`Updated wallet statistics: ${formatSOL(totalReceived)} SOL, ${formatUSD(totalReceivedUSD)} USD`);
    }
    
    return savedTransactions;
    
  } catch (error) {
    logger.error('Failed to seed demo data:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
};

// Helper function to format SOL amounts
const formatSOL = (amount) => {
  return Number(amount).toFixed(4);
};

// Helper function to format USD amounts
const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Run the seeding if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData()
    .then(() => {
      logger.info('Demo data seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Demo data seeding failed:', error);
      process.exit(1);
    });
}

export default seedDemoData;
*/

// Placeholder export for now
export default async function seedDemoData() {
  console.log('Demo data seeding is temporarily disabled. Please update this script to use Prisma operations.');
  return [];
}
