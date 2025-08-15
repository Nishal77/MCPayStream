import { PrismaClient } from '@prisma/client';
import config from '../config/env.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

async function initializeCreator() {
  try {
    console.log('🚀 Initializing default creator...');
    
    // Check if creator already exists
    const existingCreator = await prisma.creator.findUnique({
      where: { solanaAddress: config.SOLANA_WALLET_ADDRESS }
    });
    
    if (existingCreator) {
      console.log('✅ Creator already exists:', existingCreator.name);
      return existingCreator;
    }
    
    // Create default creator
    const creator = await prisma.creator.create({
      data: {
        name: 'Default Creator',
        email: 'creator@mcpaystream.com',
        solanaAddress: config.SOLANA_WALLET_ADDRESS,
        commissionRate: 0.3,
        totalEarnings: 0,
      },
    });
    
    console.log('✅ Default creator created successfully:');
    console.log(`   ID: ${creator.id}`);
    console.log(`   Name: ${creator.name}`);
    console.log(`   Solana Address: ${creator.solanaAddress}`);
    console.log(`   Commission Rate: ${creator.commissionRate * 100}%`);
    
    return creator;
  } catch (error) {
    console.error('❌ Error initializing creator:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeCreator()
    .then(() => {
      console.log('🎉 Creator initialization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Creator initialization failed:', error);
      process.exit(1);
    });
}

export default initializeCreator;


