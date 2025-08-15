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
    fetchWallet,
    fetchTransactions,
    refreshWallet,
    setWallet // Added setWallet to the context hook
  } = useWallet();
  
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletInput, setShowWalletInput] = useState(!wallet);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (wallet?.address) {
      fetchTransactions();
    }
  }, [wallet?.address]);

  // Update real-time status when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      setIsLive(true);
      setLastUpdate(new Date().toISOString());
    }
  }, [transactions]);

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
    refreshWallet();
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
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    MCPayStream
                  </h1>
                  <p className="text-sm text-white/60">Live Blockchain Analytics</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Real-time Status */}
                {wallet && (
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
                
                {/* Connection Status */}
                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-white/10 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm text-white/70">
                    {error ? 'Disconnected' : 'Connected'}
                  </span>
                </div>
                
                {/* Change Wallet Button */}
                {wallet && (
                  <button 
                    onClick={handleChangeWallet}
                    className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-lg border border-white/10 transition-all"
                  >
                    Change Wallet
                  </button>
                )}
                
                {/* Theme Toggle */}
                <button onClick={toggleTheme} className="p-3 rounded-xl bg-white/10 transition-all" aria-label="Toggle theme">
                  {isDark ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                {/* Settings */}
                <a href="/settings" className="p-3 rounded-xl bg-white/10 transition-all" aria-label="Settings">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-full mx-auto px-6 py-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                  {error.includes('Too many requests') && (
                    <div className="mt-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <p className="text-red-300 text-xs">
                        <strong>Tip:</strong> The Solana Devnet faucet has rate limits. If you're testing, try:
                      </p>
                      <ul className="text-red-300 text-xs mt-1 ml-4 list-disc">
                        <li>Wait a few minutes before trying again</li>
                        <li>Use the web faucet at <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="underline">faucet.solana.com</a></li>
                        <li>Check if your wallet already has SOL</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Real-time Transaction Notification */}
          {wallet && transactions.length > 0 && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-400 font-medium">
                    Live Transaction Monitoring Active
                  </span>
                </div>
                <span className="text-sm text-green-300">
                  {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} • Auto-updating
                </span>
              </div>
              <p className="text-sm text-green-300 mt-1">
                New transactions will appear automatically without refreshing the page
              </p>
            </div>
          )}

          {/* Wallet Input */}
          {showWalletInput && (
                            <div className="max-w-md mx-auto p-8 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm transition-all duration-300">
              <div className="text-center space-y-6">
                                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl w-fit mx-auto transform transition-all duration-300">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">
                    Enter Wallet Address
                  </h2>
                  <p className="text-white/60 text-sm">
                    View live blockchain data and analytics for any Solana wallet
                  </p>
                  <div className="mt-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-300 text-xs">
                      <strong>Note:</strong> For testing, you can use any Solana wallet address. If you need test SOL, visit{' '}
                      <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="underline">
                        Solana Devnet Faucet
                      </a>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleWalletSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="walletAddress" className="block text-sm font-medium text-white/80">
                      Solana Wallet Address
                    </label>
                    <input
                      type="text"
                      id="walletAddress"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Enter wallet address (e.g., D8FL9VwTjXgyLfvGwEZNyxUxyCTPXzcVnjhWPAZcgsS9)"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!walletAddress.trim() || isLoading}
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="loader w-5 h-5"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      'Load Wallet Data'
                    )}
                  </button>
                </form>

                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dashboard Content */}
          {wallet && (
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
                  value={formatSOL(wallet.totalEarnings || 0)}
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
                  change={`${transactions.filter(tx => tx.status === 'CONFIRMED').length} confirmed`}
                  icon={Users}
                />
              </div>

              {/* Charts and Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white/5 rounded-lg border border-white/10 p-6 transition-all duration-300">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Earnings Over Time
                  </h3>
                  <EarningsChart walletAddress={wallet.address} />
                </div>
                
                <div className="bg-white/5 rounded-lg border border-white/10 p-6 transition-all duration-300">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Top Senders
                  </h3>
                  <Leaderboard walletAddress={wallet.address} />
                </div>
              </div>

              {/* Transactions */}
              <div className="bg-white/5 rounded-lg border border-white/10 transition-all duration-300">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white">
                    Recent Transactions
                  </h3>
                </div>
                {transactions && transactions.length > 0 ? (
                  <TransactionsTable 
                    transactions={transactions} 
                    onRefresh={() => fetchTransactions()}
                  />
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      No transactions yet
                    </h3>
                    <p className="text-white/60 mb-4">
                      This wallet hasn't received any payments yet. Share your wallet address to start receiving payments!
                    </p>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <p className="text-sm text-white/80 mb-2">
                        <strong>Your Wallet Address:</strong>
                      </p>
                      <code className="text-xs text-white font-mono break-all bg-white/10 px-2 py-1 rounded">
                        {wallet.address}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
