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
    
    // Get live blockchain data for each creator
    const creatorsWithLiveData = await Promise.all(
      creators.map(async (creator) => {
        try {
          // Import blockchain functions
          const { getWalletBalance } = await import('../blockchain/wallet.js');
          const { getCachedSolPrice } = await import('../blockchain/price.js');
          
          // Get live balance and SOL price
          const [balance, solPrice] = await Promise.all([
            getWalletBalance(creator.solanaAddress),
            getCachedSolPrice()
          ]);
          
          return {
            address: creator.solanaAddress,
            name: creator.name,
            balance: balance,
            lastSolPrice: solPrice,
            totalReceivedSOL: creator.totalEarnings,
            totalReceivedUSD: creator.totalEarnings * solPrice,
            transactionCount: creator._count.transactions,
          };
        } catch (error) {
          // Fallback to database data only
          return {
            address: creator.solanaAddress,
            name: creator.name,
            balance: 0,
            lastSolPrice: 0,
            totalReceivedSOL: creator.totalEarnings,
            totalReceivedUSD: 0,
            transactionCount: creator._count.transactions,
          };
        }
      })
    );
    
    return creatorsWithLiveData;
  } catch (error) {
    logger.error('Error getting creator rankings:', error);
    throw error;
  }
}

/**
 * Get top senders by transaction count
 */
export async function getTopSenders(limit = 10, period = '7d') {
  try {
    logger.info(`Getting top senders for period: ${period}, limit: ${limit}`);
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    logger.info(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // First, check if there are any transactions at all
    const totalTransactions = await prisma.transaction.count();
    logger.info(`Total transactions in database: ${totalTransactions}`);
    
    if (totalTransactions === 0) {
      // No transactions in database, return empty array
      logger.info('No transactions found, returning empty array');
      return [];
    }
    
    // Get transactions where wallets are senders (outgoing transactions)
    const senders = await prisma.transaction.groupBy({
      by: ['senderAddress'],
      where: { 
        status: 'CONFIRMED',
        senderAddress: { not: null }, // Ensure sender address exists
        timestamp: {
          gte: startDate,
          lte: endDate,
        }
      },
      _count: { senderAddress: true },
      _sum: { amountSOL: true, usdValue: true },
      orderBy: { _count: { senderAddress: 'desc' } },
      take: limit,
    });
    
    logger.info(`Found ${senders.length} senders from database`);
    
    // Convert to map for easy lookup
    const senderMap = new Map();
    senders.forEach(sender => {
      senderMap.set(sender.senderAddress, {
        address: sender.senderAddress,
        transactionCount: sender._count.senderAddress,
        totalSentSOL: sender._sum.amountSOL || 0,
        totalSentUSD: sender._sum.usdValue || 0,
        // Get sample transactions for this sender
        sampleTransactions: []
      });
    });
    
    // Get sample transactions for each sender to show transaction IDs and amounts
    for (const [senderAddress, senderData] of senderMap) {
      try {
        const sampleTxs = await prisma.transaction.findMany({
          where: {
            senderAddress: senderAddress,
            status: 'CONFIRMED',
            timestamp: {
              gte: startDate,
              lte: endDate,
            }
          },
          select: {
            id: true,
            txHash: true,
            amountSOL: true,
            usdValue: true,
            receiverAddress: true,
            timestamp: true
          },
          orderBy: { timestamp: 'desc' },
          take: 3 // Show up to 3 sample transactions per sender
        });
        
        senderData.sampleTransactions = sampleTxs.map(tx => ({
          id: tx.id,
          signature: tx.txHash,
          amount: tx.amountSOL,
          amountUSD: tx.usdValue,
          toAddress: tx.receiverAddress,
          timestamp: tx.timestamp
        }));
      } catch (error) {
        logger.error(`Error getting sample transactions for ${senderAddress}:`, error);
      }
    }
    
    // Get recent on-chain transactions for all creators to include unsaved transactions
    try {
      const { getRecentTransactions } = await import('../blockchain/transactions.js');
      const { getCachedSolPrice } = await import('../blockchain/price.js');
      
      // Get all creators
      const creators = await prisma.creator.findMany({
        select: { solanaAddress: true }
      });
      
      logger.info(`Found ${creators.length} creators for on-chain data`);
      
      if (creators.length > 0) {
        const solPrice = await getCachedSolPrice();
        
        // Get recent transactions for each creator
        for (const creator of creators) {
          try {
            const recentTxs = await getRecentTransactions(creator.solanaAddress, 50);
            
            // Filter transactions within the period - look for OUTGOING transactions (direction = 'OUT')
            const periodTxs = recentTxs.filter(tx => {
              if (!tx.blockTime) return false;
              const txDate = new Date(tx.blockTime * 1000);
              return txDate >= startDate && txDate <= endDate && tx.direction === 'OUT';
            });
            
            // Group by sender (the wallet that sent SOL)
            const onChainSenders = new Map();
            periodTxs.forEach(tx => {
              if (!onChainSenders.has(tx.fromAddress)) {
                onChainSenders.set(tx.fromAddress, {
                  address: tx.fromAddress,
                  transactionCount: 0,
                  totalSentSOL: 0,
                  totalSentUSD: 0,
                  sampleTransactions: []
                });
              }
              const sender = onChainSenders.get(tx.fromAddress);
              sender.transactionCount += 1;
              sender.totalSentSOL += tx.amountSOL;
              sender.totalSentUSD += tx.amountSOL * solPrice;
              
              // Add sample transaction
              sender.sampleTransactions.push({
                id: `onchain-${tx.signature}`,
                signature: tx.signature,
                amount: tx.amountSOL,
                amountUSD: tx.amountSOL * solPrice,
                toAddress: tx.toAddress,
                timestamp: new Date(tx.blockTime * 1000)
              });
            });
            
            // Merge with database data
            onChainSenders.forEach((onChainSender, address) => {
              if (senderMap.has(address)) {
                const dbSender = senderMap.get(address);
                dbSender.transactionCount += onChainSender.transactionCount;
                dbSender.totalSentSOL += onChainSender.totalSentSOL;
                dbSender.totalSentUSD += onChainSender.totalSentUSD;
                // Merge sample transactions
                dbSender.sampleTransactions = [
                  ...dbSender.sampleTransactions,
                  ...onChainSender.sampleTransactions
                ].slice(0, 3); // Keep only 3 most recent
              } else {
                senderMap.set(address, onChainSender);
              }
            });
          } catch (error) {
            logger.error(`Error getting on-chain transactions for ${creator.solanaAddress}:`, error);
            // Continue with other creators
          }
        }
      }
    } catch (error) {
      logger.error('Error getting on-chain transactions for top senders:', error);
      // Continue with database data only
    }
    
    // Convert back to array and sort
    const allSenders = Array.from(senderMap.values());
    allSenders.sort((a, b) => b.transactionCount - a.transactionCount);
    
    logger.info(`Returning ${allSenders.length} total senders`);
    return allSenders.slice(0, limit);
  } catch (error) {
    logger.error('Error getting top senders:', error);
    // Return empty array instead of throwing error
    return [];
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
    
    // Get creator address first
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: { solanaAddress: true }
    });
    
    if (!creator) {
      logger.error(`Creator not found for ID: ${creatorId}`);
      return [];
    }
    
    const transactions = await prisma.transaction.findMany({
      where: {
        creatorId,
        status: 'CONFIRMED',
        receiverAddress: creator.solanaAddress, // Only incoming transactions
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
    
    // Get on-chain transactions
    try {
      const { getRecentTransactions } = await import('../blockchain/transactions.js');
      const { getCachedSolPrice } = await import('../blockchain/price.js');
      
      const recentTxs = await getRecentTransactions(creator.solanaAddress, 100);
      const solPrice = await getCachedSolPrice();
      
      // Filter and group on-chain transactions by day
      recentTxs.forEach(tx => {
        if (!tx.blockTime) return;
        
        const txDate = new Date(tx.blockTime * 1000);
        if (txDate >= startDate && txDate <= endDate && tx.direction === 'IN') {
          const date = txDate.toISOString().split('T')[0];
          if (!dailyData[date]) {
            dailyData[date] = { amountSOL: 0, usdValue: 0, count: 0 };
          }
          dailyData[date].amountSOL += tx.amountSOL;
          dailyData[date].usdValue += tx.amountSOL * solPrice;
          dailyData[date].count += 1;
        }
      });
    } catch (error) {
      logger.error(`Error getting on-chain transactions for creator ${creatorId}:`, error);
    }
    
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


