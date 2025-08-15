/**
 * Calculate daily SOL received from transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {number} days - Number of days to look back (default: 1 for today)
 * @returns {Object} Daily stats including amount and count
 */
export const calculateDailyReceived = (transactions = [], days = 1) => {
  if (!transactions || transactions.length === 0) {
    return { amount: 0, count: 0 };
  }

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Filter transactions for the specified period and only incoming transactions
  const dailyTransactions = transactions.filter(tx => {
    // Handle different timestamp formats from backend
    let txDate;
    if (tx.blockTime) {
      // On-chain transaction timestamp (Unix timestamp in seconds)
      txDate = new Date(tx.blockTime * 1000);
    } else if (tx.timestamp) {
      // Database transaction timestamp
      txDate = new Date(tx.timestamp);
    } else {
      return false; // Skip transactions without timestamp
    }
    
    return txDate >= startDate && 
           txDate <= now && 
           (tx.direction === 'IN' || tx.toAddress === tx.receiverAddress);
  });

  // Calculate total amount and count
  const totalAmount = dailyTransactions.reduce((sum, tx) => {
    // Handle different amount field names
    const amount = tx.amountSOL || tx.amount || 0;
    return sum + amount;
  }, 0);

  return {
    amount: totalAmount,
    count: dailyTransactions.length
  };
};

/**
 * Calculate daily SOL received for today
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Today's stats
 */
export const calculateTodayReceived = (transactions = []) => {
  return calculateDailyReceived(transactions, 1);
};

/**
 * Calculate daily SOL received for yesterday
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Yesterday's stats
 */
export const calculateYesterdayReceived = (transactions = []) => {
  return calculateDailyReceived(transactions, 2);
};

/**
 * Format daily stats for display
 * @param {Object} dailyStats - Daily stats object
 * @returns {string} Formatted string for display
 */
export const formatDailyStats = (dailyStats) => {
  if (dailyStats.count === 0) {
    return "No transactions today";
  }
  
  if (dailyStats.count === 1) {
    return `${dailyStats.count} transaction today`;
  }
  
  return `${dailyStats.count} transactions today`;
};
