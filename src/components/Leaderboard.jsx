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
      // Fetch top senders with period filter
      const sendersResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/stats/top-senders?limit=10&period=${period}`
      );
      
      if (sendersResponse.ok) {
        const sendersData = await sendersResponse.json();
        if (sendersData.success) {
          setTopSenders(sendersData.data?.senders || []);
        } else {
          console.error('Error in senders response:', sendersData.message);
          setTopSenders([]);
        }
      } else {
        console.error('Senders response not ok:', sendersResponse.status);
        setTopSenders([]);
      }

      // Fetch top wallets globally
      const walletsResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/stats/rankings?limit=10`
      );
      
      if (walletsResponse.ok) {
        const walletsData = await walletsResponse.json();
        if (walletsData.success) {
          setTopWallets(walletsData.data?.rankings || []);
        } else {
          console.error('Error in wallets response:', walletsData.message);
          setTopWallets([]);
        }
      } else {
        console.error('Wallets response not ok:', walletsResponse.status);
        setTopWallets([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setTopSenders([]);
      setTopWallets([]);
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
      <div className="flex items-center justify-center py-12">
        <div className="loader loader-dark"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg border border-white/10">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
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
            {/* Real-time Indicator */}
            <div className="flex items-center space-x-2 px-2 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">Live</span>
            </div>
            
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 text-sm border border-white/10 rounded-lg bg-black text-white"
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
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('senders')}
          className={`flex-1 px-6 py-3 text-sm font-medium ${
            activeTab === 'senders'
              ? 'text-white border-b-2 border-white'
              : 'text-white/60'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Top Senders</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('wallets')}
          className={`flex-1 px-6 py-3 text-sm font-medium ${
            activeTab === 'wallets'
              ? 'text-white border-b-2 border-white'
              : 'text-white/60'
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
                <p className="text-white/70">
                  No senders found for this period
                </p>
              </div>
            ) : (
              topSenders.map((sender, index) => (
                <div
                  key={sender.address}
                  className={`flex items-center p-4 rounded-lg border ${
                    getRankColor(index + 1)
                  } ${index < 3 ? 'border-transparent' : 'border-white/10'}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 mr-4">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {formatAddress(sender.address)}
                        </p>
                        <p className="text-xs text-white/70">
                          {sender.transactionCount} transaction{sender.transactionCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          {formatSOL(sender.totalSentSOL)}
                        </p>
                        <p className="text-xs text-white/70">
                          {formatUSD(sender.totalSentUSD)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Sample Transactions */}
                    {sender.sampleTransactions && sender.sampleTransactions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-white/60 mb-2">Recent transactions:</p>
                        <div className="space-y-2">
                          {sender.sampleTransactions.slice(0, 2).map((tx, txIndex) => (
                            <div key={tx.id || txIndex} className="flex items-center justify-between text-xs bg-white/5 rounded px-2 py-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-white/70">ID:</span>
                                <code className="text-white/90 font-mono text-xs">
                                  {tx.signature ? `${tx.signature.slice(0, 8)}...` : `TX-${txIndex + 1}`}
                                </code>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-white/70">To:</span>
                                <code className="text-white/90 font-mono text-xs">
                                  {formatAddress(tx.toAddress)}
                                </code>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-white/70">Amount:</span>
                                <span className="text-white/90 font-medium">
                                  {formatSOL(tx.amount)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                <p className="text-white/70">
                  No wallet data available for this period
                </p>
              </div>
            ) : (
              topWallets.map((wallet, index) => (
                <div
                  key={wallet.address}
                  className={`flex items-center p-4 rounded-lg border ${
                    getRankColor(index + 1)
                  } ${index < 3 ? 'border-transparent' : 'border-white/10'}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 mr-4">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {wallet.name || formatAddress(wallet.address)}
                        </p>
                        <p className="text-xs text-white/70">
                          {formatAddress(wallet.address)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          {formatSOL(wallet.totalReceivedSOL || wallet.balance)}
                        </p>
                        <p className="text-xs text-white/70">
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
      <div className="px-6 py-4 bg-white/5 border-t border-white/10">
        <div className="flex items-center justify-between text-sm text-white/70">
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
