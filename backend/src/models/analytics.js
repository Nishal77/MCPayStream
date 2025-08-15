import prisma from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Get global platform statistics
 */
export async function getGlobalStats() {
  try {
    const [creators, transactions, totalEarnings] = await Promise.all([
      prisma.creator.count(),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: {
          usdValue: true,
          amountSOL: true,
        },
      }),
    ]);
    
    return {
      totalCreators: creators,
      totalTransactions: transactions,
      totalEarningsUSD: totalEarnings._sum.usdValue || 0,
      totalEarningsSOL: totalEarnings._sum.amountSOL || 0,
    };
  } catch (error) {
    logger.error('Error getting global stats:', error);
    throw error;
  }
}

/**
 * Get creator rankings by earnings
 */
export async function getCreatorRankings(limit = 10) {
  try {
    const creators = await prisma.creator.findMany({
      select: {
        id: true,
        name: true,
        solanaAddress: true,
        totalEarnings: true,
        commissionRate: true,
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { totalEarnings: 'desc' },
      take: limit,
    });
    
    return creators.map(creator => ({
      ...creator,
      transactionCount: creator._count.transactions,
    }));
  } catch (error) {
    logger.error('Error getting creator rankings:', error);
    throw error;
  }
}

/**
 * Get top senders by transaction count
 */
export async function getTopSenders(limit = 10) {
  try {
    const senders = await prisma.transaction.groupBy({
      by: ['senderAddress'],
      where: { status: 'CONFIRMED' },
      _count: { senderAddress: true },
      _sum: { amountSOL: true, usdValue: true },
      orderBy: { _count: { senderAddress: 'desc' } },
      take: limit,
    });
    
    return senders.map(sender => ({
      address: sender.senderAddress,
      transactionCount: sender._count.senderAddress,
      totalAmountSOL: sender._sum.amountSOL || 0,
      totalAmountUSD: sender._sum.usdValue || 0,
    }));
  } catch (error) {
    logger.error('Error getting top senders:', error);
    throw error;
  }
}

/**
 * Get daily summary for a specific date range
 */
export async function getDailySummary(startDate, endDate, creatorId = null) {
  try {
    const where = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      status: 'CONFIRMED',
    };
    
    if (creatorId) {
      where.creatorId = creatorId;
    }
    
    const [transactions, totalAmount] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({
        where,
        _sum: {
          amountSOL: true,
          usdValue: true,
        },
      }),
    ]);
    
    return {
      date: startDate,
      transactionCount: transactions,
      totalAmountSOL: totalAmount._sum.amountSOL || 0,
      totalAmountUSD: totalAmount._sum.usdValue || 0,
    };
  } catch (error) {
    logger.error('Error getting daily summary:', error);
    throw error;
  }
}

/**
 * Get trend analysis for a creator
 */
export async function getCreatorTrendAnalysis(creatorId, days = 30) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        creatorId,
        status: 'CONFIRMED',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        timestamp: true,
        amountSOL: true,
        usdValue: true,
      },
      orderBy: { timestamp: 'asc' },
    });
    
    // Group by day
    const dailyData = {};
    transactions.forEach(tx => {
      const date = tx.timestamp.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { amountSOL: 0, usdValue: 0, count: 0 };
      }
      dailyData[date].amountSOL += tx.amountSOL;
      dailyData[date].usdValue += tx.usdValue;
      dailyData[date].count += 1;
    });
    
    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data,
    }));
  } catch (error) {
    logger.error(`Error getting trend analysis for creator ${creatorId}:`, error);
    throw error;
  }
}

/**
 * Get platform insights
 */
export async function getPlatformInsights() {
  try {
    const [totalCreators, activeCreators, totalTransactions, confirmedTransactions] = await Promise.all([
      prisma.creator.count(),
      prisma.creator.count({
        where: {
          transactions: {
            some: {
              timestamp: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
      }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'CONFIRMED' } }),
    ]);
    
    const successRate = totalTransactions > 0 ? (confirmedTransactions / totalTransactions) * 100 : 0;
    
    return {
      totalCreators,
      activeCreators,
      totalTransactions,
      confirmedTransactions,
      successRate: Math.round(successRate * 100) / 100,
    };
  } catch (error) {
    logger.error('Error getting platform insights:', error);
    throw error;
  }
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(creatorId = null) {
  try {
    const where = creatorId ? { creatorId } : {};
    
    const [avgTransactionValue, maxTransactionValue, minTransactionValue] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, status: 'CONFIRMED' },
        _avg: { usdValue: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, status: 'CONFIRMED' },
        _max: { usdValue: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, status: 'CONFIRMED' },
        _min: { usdValue: true },
      }),
    ]);
    
    return {
      avgTransactionValue: avgTransactionValue._avg.usdValue || 0,
      maxTransactionValue: maxTransactionValue._max.usdValue || 0,
      minTransactionValue: minTransactionValue._min.usdValue || 0,
    };
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    throw error;
  }
}


