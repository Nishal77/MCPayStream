import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Award } from 'lucide-react';
import { formatAddress, formatSOL, formatUSD } from '../../shared/formatters';

const Leaderboard = ({ walletAddress }) => {
  const [topSenders, setTopSenders] = useState([]);
  const [topWallets, setTopWallets] = useState([]);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('senders');

  useEffect(() => {
    if (walletAddress) {
      fetchLeaderboardData();
    }
  }, [walletAddress, period]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      // Fetch top senders globally
      const sendersResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/stats/top-senders?limit=10`
      );
      
      if (sendersResponse.ok) {
        const sendersData = await sendersResponse.json();
        setTopSenders(sendersData.data?.senders || []);
      }

      // Fetch top wallets globally
      const walletsResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/stats/rankings?limit=10`
      );
      
      if (walletsResponse.ok) {
        const walletsData = await walletsResponse.json();
        setTopWallets(walletsData.data?.rankings || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case '24h': return '24 Hours';
      case '7d': return '7 Days';
      case '30d': return '30 Days';
      case '1y': return '1 Year';
      default: return '7 Days';
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-medium text-gray-500">{rank}</span>;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700';
    return 'bg-gray-100 dark:bg-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Leaderboard
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Top performers in the last {getPeriodLabel(period)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="1y">1 Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('senders')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'senders'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Top Senders</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('wallets')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'wallets'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Top Wallets</span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'senders' ? (
          <div className="space-y-4">
            {topSenders.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No senders found for this period
                </p>
              </div>
            ) : (
              topSenders.map((sender, index) => (
                <div
                  key={sender.address}
                  className={`flex items-center p-4 rounded-lg border transition-all hover:shadow-md ${
                    getRankColor(index + 1)
                  } ${index < 3 ? 'border-transparent' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 mr-4">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatAddress(sender.address)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {sender.transactionCount} transaction{sender.transactionCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatSOL(sender.totalSentSOL)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatUSD(sender.totalSentUSD)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {topWallets.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No wallet data available for this period
                </p>
              </div>
            ) : (
              topWallets.map((wallet, index) => (
                <div
                  key={wallet.address}
                  className={`flex items-center p-4 rounded-lg border transition-all hover:shadow-md ${
                    getRankColor(index + 1)
                  } ${index < 3 ? 'border-transparent' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 mr-4">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {wallet.name || formatAddress(wallet.address)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatAddress(wallet.address)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatSOL(wallet.totalReceivedSOL || wallet.balance)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatUSD(wallet.totalReceivedUSD || (wallet.balance * (wallet.lastSolPrice || 0)))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Showing top {activeTab === 'senders' ? topSenders.length : topWallets.length} performers
          </span>
          <span className="text-xs">
            Updated {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
