import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Settings, TrendingUp, Users, Activity, Wallet, RefreshCw } from 'lucide-react';
import WalletCard from '../components/WalletCard';
import TransactionsTable from '../components/TransactionsTable';
import EarningsChart from '../components/EarningsChart';
import Leaderboard from '../components/Leaderboard';
import LoadingScreen from '../components/LoadingScreen';
import { formatSOL, formatUSD, formatAddress } from '../../shared/formatters';
import { calculateTodayReceived, formatDailyStats } from '../utils/dailyStats';

const Dashboard = () => {
  const { isDark, toggleTheme } = useTheme();
  const { 
    wallet, 
    transactions, 
    balance, 
    balanceUSD, 
    solPrice, 
    isLoading, 
    error,
    isLive,
    lastUpdate,
    fetchWallet,
    fetchTransactions,
    refreshWallet,
    setWallet // Added setWallet to the context hook
  } = useWallet();
  
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletInput, setShowWalletInput] = useState(!wallet);

  useEffect(() => {
    if (wallet?.address) {
      fetchTransactions();
    }
  }, [wallet?.address]);

  const handleWalletSubmit = (e) => {
    e.preventDefault();
    if (walletAddress.trim()) {
      // Sanitize input: take only the first token as the address
      const sanitizedAddress = walletAddress.trim().split(/\s|,/)[0];
      fetchWallet(sanitizedAddress);
      setShowWalletInput(false);
    }
  };

  const handleRefresh = () => {
    if (wallet?.address) {
      console.log('Manual refresh triggered');
      fetchWallet(wallet.address);
      fetchTransactions();
    }
  };

  const handleChangeWallet = () => {
    setWalletAddress('');
    setShowWalletInput(true);
    // Clear the wallet context to reset all data
    if (wallet) {
      // This will trigger the useEffect to clear the wallet
      setWallet(null);
    }
  };

  // Show loading screen while fetching wallet data
  if (isLoading && !wallet) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-black text-white transition-all duration-500 ease-in-out relative overflow-hidden">
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="max-w-full mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Title */}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg transition-transform duration-300">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    MCPayStream
                  </h1>
                  <p className="text-xs text-white/60">Live Blockchain Analytics</p>
                </div>
              </div>

              {/* Live Status and Actions */}
              <div className="flex items-center space-x-4">
                {/* Live Status Badge */}
                {isLive && (
                  <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm text-green-400 font-medium">
                      Live Updates
                    </span>
                    {lastUpdate && (
                      <span className="text-xs text-green-300">
                        {new Date(lastUpdate).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Manual Refresh Button */}
                {wallet && (
                  <button
                    onClick={handleRefresh}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg border border-blue-500/30 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                )}

                {/* Change Wallet Button */}
                {wallet && (
                  <button
                    onClick={handleChangeWallet}
                    className="px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 text-sm rounded-lg border border-gray-500/30 transition-all"
                  >
                    Change Wallet
                  </button>
                )}

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-full mx-auto px-6 py-8">
          {/* Wallet Input Section */}
          {showWalletInput && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Enter Wallet Address
                  </h2>
                  <p className="text-white/60">
                    Monitor live transactions and analytics for any Solana wallet
                  </p>
                </div>

                <form onSubmit={handleWalletSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="walletAddress" className="block text-sm font-medium text-white/80 mb-2">
                      Solana Wallet Address
                    </label>
                    <input
                      type="text"
                      id="walletAddress"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Enter wallet address (e.g., AWnVcuqiHSXxe4vLZVBxHPhKc6kzZWaCBTAvBqY5iDeQ)"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      'Load Wallet Data'
                    )}
                  </button>
                </form>

                {/* Helpful Tips */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-400 mb-2">💡 Testing Tips</h3>
                  <ul className="text-xs text-blue-300 space-y-1">
                    <li>• Use Solana Devnet for testing (no real SOL needed)</li>
                    <li>• Visit <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="underline">Solana Devnet Faucet</a> to get test SOL</li>
                    <li>• Send test transactions to see live updates</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Wallet</h3>
                <p className="text-red-300 mb-4">{error}</p>
                <div className="text-sm text-red-300">
                  <p className="mb-2">Common solutions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check if the wallet address is correct</li>
                    <li>Ensure the backend server is running</li>
                    <li>Try refreshing the page</li>
                    <li>Wait a moment and try again (rate limiting)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Content */}
          {wallet && !showWalletInput && (
            <>
              {/* Wallet Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <WalletCard
                  title="Daily Received"
                  value={formatSOL(calculateTodayReceived(transactions).amount)}
                  change={formatDailyStats(calculateTodayReceived(transactions))}
                  icon={TrendingUp}
                />
                <WalletCard
                  title="Total Received"
                  value={formatSOL(wallet.stats?.totalReceived || wallet.totalEarnings || 0)}
                  change="All time earnings"
                  icon={TrendingUp}
                />
                <WalletCard
                  title="Current Balance"
                  value={formatSOL(balance)}
                  change="Live from blockchain"
                  icon={Wallet}
                />
                <WalletCard
                  title="SOL Price"
                  value={formatUSD(solPrice)}
                  change="Live market price"
                  icon={Activity}
                />
                <WalletCard
                  title="Transactions"
                  value={transactions.length.toString()}
                  change={`${transactions.filter(tx => tx.status === 'confirmed').length} confirmed`}
                  icon={Users}
                />
              </div>

              {/* Charts and Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Earnings Chart</h3>
                  <EarningsChart walletAddress={wallet.address} />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Senders & Wallets</h3>
                  <Leaderboard walletAddress={wallet.address} />
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                  <div className="flex items-center space-x-2">
                    {isLive && (
                      <div className="flex items-center space-x-2 px-2 py-1 bg-green-500/20 rounded text-xs text-green-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span>Live</span>
                      </div>
                    )}
                    <button
                      onClick={handleRefresh}
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded transition-all"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
                <TransactionsTable transactions={transactions} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
