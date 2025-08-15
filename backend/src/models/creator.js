import prisma from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Create a new creator
 */
export async function createCreator(data) {
  try {
    const creator = await prisma.creator.create({
      data: {
        name: data.name,
        email: data.email,
        solanaAddress: data.solanaAddress,
        commissionRate: data.commissionRate || 0.3,
        totalEarnings: data.totalEarnings || 0,
      },
    });
    
    logger.info(`Creator created: ${creator.id}`);
    return creator;
  } catch (error) {
    logger.error('Error creating creator:', error);
    throw error;
  }
}

/**
 * Get creator by ID
 */
export async function getCreatorById(id) {
  try {
    const creator = await prisma.creator.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });
    
    return creator;
  } catch (error) {
    logger.error(`Error getting creator by ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get creator by Solana address
 */
export async function getCreatorBySolanaAddress(address) {
  try {
    const creator = await prisma.creator.findUnique({
      where: { solanaAddress: address },
      include: {
        transactions: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
    
    return creator;
  } catch (error) {
    logger.error(`Error getting creator by Solana address ${address}:`, error);
    throw error;
  }
}

/**
 * Get creator by email
 */
export async function getCreatorByEmail(email) {
  try {
    const creator = await prisma.creator.findUnique({
      where: { email },
      include: {
        transactions: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
    
    return creator;
  } catch (error) {
    logger.error(`Error getting creator by email ${email}:`, error);
    throw error;
  }
}

/**
 * Update creator
 */
export async function updateCreator(id, data) {
  try {
    const creator = await prisma.creator.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    
    logger.info(`Creator updated: ${id}`);
    return creator;
  } catch (error) {
    logger.error(`Error updating creator ${id}:`, error);
    throw error;
  }
}

/**
 * Update creator earnings
 */
export async function updateCreatorEarnings(id, amount) {
  try {
    const creator = await prisma.creator.update({
      where: { id },
      data: {
        totalEarnings: {
          increment: amount,
        },
        updatedAt: new Date(),
      },
    });
    
    logger.info(`Creator earnings updated: ${id}, new total: ${creator.totalEarnings}`);
    return creator;
  } catch (error) {
    logger.error(`Error updating creator earnings ${id}:`, error);
    throw error;
  }
}

/**
 * Get all creators
 */
export async function getAllCreators(includeTransactions = false) {
  try {
    const creators = await prisma.creator.findMany({
      include: {
        transactions: includeTransactions ? {
          orderBy: { timestamp: 'desc' },
        } : false,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return creators;
  } catch (error) {
    logger.error('Error getting all creators:', error);
    throw error;
  }
}

/**
 * Delete creator
 */
export async function deleteCreator(id) {
  try {
    await prisma.creator.delete({
      where: { id },
    });
    
    logger.info(`Creator deleted: ${id}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting creator ${id}:`, error);
    throw error;
  }
}

/**
 * Search creators
 */
export async function searchCreators(query, limit = 10) {
  try {
    const creators = await prisma.creator.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { solanaAddress: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    
    return creators;
  } catch (error) {
    logger.error(`Error searching creators with query "${query}":`, error);
    throw error;
  }
}


