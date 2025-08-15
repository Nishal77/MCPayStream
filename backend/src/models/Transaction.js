import prisma from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Create a new transaction
 */
export async function createTransaction(data) {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        txHash: data.txHash,
        senderAddress: data.senderAddress,
        receiverAddress: data.receiverAddress,
        amountSOL: data.amountSOL,
        usdValue: data.usdValue,
        status: data.status || 'PENDING',
        creatorId: data.creatorId,
      },
      include: {
        creator: true,
      },
    });
    
    logger.info(`Transaction created: ${transaction.id} for creator ${data.creatorId}`);
    return transaction;
  } catch (error) {
    logger.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(id) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        creator: true,
      },
    });
    
    return transaction;
  } catch (error) {
    logger.error(`Error getting transaction by ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get transaction by transaction hash
 */
export async function getTransactionByHash(txHash) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { txHash },
      include: {
        creator: true,
      },
    });
    
    return transaction;
  } catch (error) {
    logger.error(`Error getting transaction by hash ${txHash}:`, error);
    throw error;
  }
}

/**
 * Get transactions by creator ID
 */
export async function getTransactionsByCreator(creatorId, options = {}) {
  try {
    const { page = 1, limit = 20, status, orderBy = 'desc' } = options;
    const skip = (page - 1) * limit;
    
    const where = { creatorId };
    if (status) {
      where.status = status;
    }
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              solanaAddress: true,
            },
          },
        },
        orderBy: { timestamp: orderBy === 'asc' ? 'asc' : 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);
    
    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error getting transactions for creator ${creatorId}:`, error);
    throw error;
  }
}

/**
 * Get transactions by Solana address (sender or receiver)
 */
export async function getTransactionsByAddress(address, options = {}) {
  try {
    const { page = 1, limit = 20, orderBy = 'desc' } = options;
    const skip = (page - 1) * limit;
    
    const where = {
      OR: [
        { senderAddress: address },
        { receiverAddress: address },
      ],
    };
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              solanaAddress: true,
            },
          },
        },
        orderBy: { timestamp: orderBy === 'asc' ? 'asc' : 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);
    
    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Error getting transactions for address ${address}:`, error);
    throw error;
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(id, status) {
  try {
    const transaction = await prisma.transaction.update({
      where: { id },
      data: { status },
      include: {
        creator: true,
      },
    });
    
    logger.info(`Transaction status updated: ${id} -> ${status}`);
    return transaction;
  } catch (error) {
    logger.error(`Error updating transaction status ${id}:`, error);
    throw error;
  }
}

/**
 * Update transaction
 */
export async function updateTransaction(id, data) {
  try {
    const transaction = await prisma.transaction.update({
      where: { id },
      data,
      include: {
        creator: true,
      },
    });
    
    logger.info(`Transaction updated: ${id}`);
    return transaction;
  } catch (error) {
    logger.error(`Error updating transaction ${id}:`, error);
    throw error;
  }
}

/**
 * Get recent transactions
 */
export async function getRecentTransactions(limit = 10) {
  try {
    const transactions = await prisma.transaction.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            solanaAddress: true,
          },
        },
      },
    });
    
    return transactions;
  } catch (error) {
    logger.error('Error getting recent transactions:', error);
    throw error;
  }
}

/**
 * Get transaction statistics
 */
export async function getTransactionStats(creatorId = null) {
  try {
    const where = creatorId ? { creatorId } : {};
    
    // Get creator's address to filter for incoming transactions
    let creatorAddress = null;
    if (creatorId) {
      const creator = await prisma.creator.findUnique({
        where: { id: creatorId },
        select: { solanaAddress: true }
      });
      creatorAddress = creator?.solanaAddress;
    }
    
    // Add filter for incoming transactions only
    const incomingWhere = creatorAddress 
      ? { ...where, receiverAddress: creatorAddress }
      : where;
    
    const [total, confirmed, pending, failed, totalAmount] = await Promise.all([
      prisma.transaction.count({ where: incomingWhere }),
      prisma.transaction.count({ where: { ...incomingWhere, status: 'CONFIRMED' } }),
      prisma.transaction.count({ where: { ...incomingWhere, status: 'PENDING' } }),
      prisma.transaction.count({ where: { ...incomingWhere, status: 'FAILED' } }),
      prisma.transaction.aggregate({
        where: { ...incomingWhere, status: 'CONFIRMED' },
        _sum: {
          amountSOL: true,
          usdValue: true,
        },
      }),
    ]);
    
    return {
      total,
      confirmed,
      pending,
      failed,
      totalAmountSOL: totalAmount._sum.amountSOL || 0,
      totalAmountUSD: totalAmount._sum.usdValue || 0,
    };
  } catch (error) {
    logger.error('Error getting transaction statistics:', error);
    throw error;
  }
}

/**
 * Delete transaction
 */
export async function deleteTransaction(id) {
  try {
    await prisma.transaction.delete({
      where: { id },
    });
    
    logger.info(`Transaction deleted: ${id}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting transaction ${id}:`, error);
    throw error;
  }
}


