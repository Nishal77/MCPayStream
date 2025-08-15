import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

// Create Prisma client instance
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.info('Query: ' + e.query);
    logger.info('Params: ' + e.params);
    logger.info('Duration: ' + e.duration + 'ms');
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Test database connection
export async function testConnection() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Get Prisma client instance
export function getPrismaClient() {
  return prisma;
}

export default prisma;
