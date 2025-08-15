import React from 'react';
import { formatSOL, formatUSD, formatAddress } from '../../shared/formatters';

const TransactionsTable = ({ transactions = [] }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No transactions yet</h3>
        <p className="text-white/60">
          This wallet hasn't received any payments yet. Send some SOL to see live updates!
        </p>
      </div>
    );
  }

  // Show all transactions (both incoming and outgoing)
  const allTransactions = transactions.map(tx => {
    // Determine direction based on transaction data
    let direction = tx.direction;
    if (!direction) {
      // If no direction specified, assume it's incoming (for backward compatibility)
      direction = 'IN';
    }
    
    return {
      ...tx,
      direction: direction,
      // Ensure we have the correct amount field
      amount: tx.amount || tx.amountSOL || 0,
      amountUSD: tx.amountUSD || 0,
    };
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-4 px-6 text-sm font-medium text-white/80">Type</th>
            <th className="text-left py-4 px-6 text-sm font-medium text-white/80">Amount</th>
            <th className="text-left py-4 px-6 text-sm font-medium text-white/80">From</th>
            <th className="text-left py-4 px-6 text-sm font-medium text-white/80">To</th>
            <th className="text-left py-4 px-6 text-sm font-medium text-white/80">Transaction ID</th>
            <th className="text-left py-4 px-6 text-sm font-medium text-white/80">Time</th>
            <th className="text-left py-4 px-6 text-sm font-medium text-white/80">Status</th>
          </tr>
        </thead>
        <tbody>
          {allTransactions.map((transaction, index) => (
            <tr key={transaction.id || transaction.signature || index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${transaction.direction === 'IN' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="text-white font-medium">
                      {transaction.direction === 'IN' ? 'Received' : 'Sent'}
                    </p>
                    <p className="text-white/60 text-xs">
                      {transaction.source === 'onchain' ? 'On-chain' : 'Database'}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-white font-medium">
                  {formatSOL(transaction.amount)}
                </div>
                {transaction.amountUSD > 0 && (
                  <div className="text-white/60 text-xs">
                    {formatUSD(transaction.amountUSD)}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-white/90 font-mono text-xs">
                  {formatAddress(transaction.fromAddress)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-white/90 font-mono text-xs">
                  {formatAddress(transaction.toAddress)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-white/60 text-xs">
                  {transaction.signature ? (
                    <a
                      href={`https://explorer.solana.com/tx/${transaction.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      {transaction.signature.slice(0, 8)}...
                    </a>
                  ) : (
                    'N/A'
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-white/60 text-xs">
                  {transaction.blockTime ? (
                    new Date(transaction.blockTime * 1000).toLocaleString()
                  ) : transaction.timestamp ? (
                    new Date(transaction.timestamp).toLocaleString()
                  ) : (
                    'N/A'
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  transaction.status === 'confirmed' || transaction.status === 'CONFIRMED'
                    ? 'bg-green-500/20 text-green-400'
                    : transaction.status === 'pending' || transaction.status === 'PENDING'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {transaction.status?.toLowerCase() || 'unknown'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Transaction Summary */}
      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-white/60">Total Transactions</p>
            <p className="text-white font-semibold text-lg">{allTransactions.length}</p>
          </div>
          <div className="text-center">
            <p className="text-white/60">Total Received</p>
            <p className="text-green-400 font-semibold text-lg">
              {formatSOL(allTransactions.filter(tx => tx.direction === 'IN').reduce((sum, tx) => sum + tx.amount, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60">Total Sent</p>
            <p className="text-red-400 font-semibold text-lg">
              {formatSOL(allTransactions.filter(tx => tx.direction === 'OUT').reduce((sum, tx) => sum + tx.amount, 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsTable;
