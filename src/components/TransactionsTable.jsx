import { useState } from 'react';
import { formatSOL, formatUSD, formatAddress, formatRelativeTime } from '../../shared/formatters';
import { TRANSACTION_STATUS } from '../../shared/constants';
import { RefreshCw } from 'lucide-react';

const TransactionsTable = ({ transactions = [], onRefresh }) => {
  const [sortField, setSortField] = useState('blockTime');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Normalize incoming payload keys from API (db + on-chain)
  const normalized = transactions.map((t) => ({
    signature: t.signature || t.txHash || t.id,
    fromAddress: t.fromAddress || t.sender || t.senderAddress,
    toAddress: t.toAddress || t.receiver || t.receiverAddress,
    amount: typeof t.amount !== 'undefined' ? t.amount : (t.amountSOL || 0),
    amountUSD: typeof t.amountUSD !== 'undefined' ? t.amountUSD : (t.usdValue || 0),
    status: t.status || 'confirmed',
    blockTime: t.blockTime || t.timestamp || t.time || null,
  }));

  const sortedTransactions = [...normalized].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'blockTime') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case TRANSACTION_STATUS.PENDING:
        return <span className="status-pending">Pending</span>;
      case TRANSACTION_STATUS.CONFIRMED:
        return <span className="status-confirmed">Confirmed</span>;
      case TRANSACTION_STATUS.FAILED:
        return <span className="status-failed">Failed</span>;
      default:
        return <span className="status-pending">Unknown</span>;
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No transactions yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Transactions will appear here once payments are received.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Recent Transactions
          </h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">Live</span>
            </div>
            <button
              onClick={onRefresh}
                                        className="p-2 text-white/70 transition-colors"
              title="Refresh transactions"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-white/5">
          <tr>
            <th 
              className="px-6 py-4 whitespace-nowrap text-sm text-white/80 cursor-pointer"
              onClick={() => handleSort('blockTime')}
            >
              <div className="flex items-center">
                Date
                {getSortIcon('blockTime')}
              </div>
            </th>
            <th 
              className="px-6 py-4 whitespace-nowrap text-sm text-white/80 cursor-pointer"
              onClick={() => handleSort('fromAddress')}
            >
              <div className="flex items-center">
                From
                {getSortIcon('fromAddress')}
              </div>
            </th>
            <th 
              className="px-6 py-4 whitespace-nowrap text-sm text-white/80 cursor-pointer"
              onClick={() => handleSort('toAddress')}
            >
              <div className="flex items-center">
                To
                {getSortIcon('toAddress')}
              </div>
            </th>
            <th 
              className="px-6 py-4 whitespace-nowrap text-sm text-white/80 cursor-pointer"
              onClick={() => handleSort('amount')}
            >
              <div className="flex items-center">
                Amount
                {getSortIcon('amount')}
              </div>
            </th>
            <th 
              className="px-6 py-4 whitespace-nowrap text-sm text-white/80 cursor-pointer"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Status
                {getSortIcon('status')}
              </div>
            </th>
            <th className="px-6 py-4 whitespace-nowrap text-sm text-white/80">Signature</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {transactions.map((transaction, index) => (
            <tr key={transaction.id || transaction.signature || index} className="text-sm">
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
                  {formatSOL(transaction.amountSOL || transaction.amount)}
                </div>
                {transaction.amountUSD && (
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
    </div>
  );
};

export default TransactionsTable;
