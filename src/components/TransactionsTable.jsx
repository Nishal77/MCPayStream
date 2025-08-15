import { useState } from 'react';
import { formatSOL, formatUSD, formatAddress, formatRelativeTime } from '../../shared/formatters';
import { TRANSACTION_STATUS } from '../../shared/constants';

const TransactionsTable = ({ transactions = [] }) => {
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

  const sortedTransactions = [...transactions].sort((a, b) => {
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
    <div className="table-container">
      <table className="table-primary">
        <thead className="table-header">
          <tr>
            <th 
              className="table-cell cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSort('blockTime')}
            >
              <div className="flex items-center">
                Date
                {getSortIcon('blockTime')}
              </div>
            </th>
            <th 
              className="table-cell cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSort('fromAddress')}
            >
              <div className="flex items-center">
                From
                {getSortIcon('fromAddress')}
              </div>
            </th>
            <th 
              className="table-cell cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSort('toAddress')}
            >
              <div className="flex items-center">
                To
                {getSortIcon('toAddress')}
              </div>
            </th>
            <th 
              className="table-cell cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSort('amount')}
            >
              <div className="flex items-center">
                Amount
                {getSortIcon('amount')}
              </div>
            </th>
            <th 
              className="table-cell cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Status
                {getSortIcon('status')}
              </div>
            </th>
            <th className="table-cell">Signature</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedTransactions.map((transaction) => (
            <tr key={transaction.signature} className="table-row">
              <td className="table-cell">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(transaction.blockTime).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(transaction.blockTime)}
                  </div>
                </div>
              </td>
              <td className="table-cell">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatAddress(transaction.fromAddress)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {transaction.fromAddress}
                    </div>
                  </div>
                </div>
              </td>
              <td className="table-cell">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-solana-100 dark:bg-solana-900/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-solana-600 dark:text-solana-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatAddress(transaction.toAddress)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {transaction.toAddress}
                    </div>
                  </div>
                </div>
              </td>
              <td className="table-cell">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatSOL(transaction.amount)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatUSD(transaction.amountUSD)}
                  </div>
                </div>
              </td>
              <td className="table-cell">
                {getStatusBadge(transaction.status)}
              </td>
              <td className="table-cell">
                <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {formatAddress(transaction.signature, 8, 8)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;
