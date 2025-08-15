import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import WalletCard from '../components/WalletCard';
import TransactionsTable from '../components/TransactionsTable';
import EarningsChart from '../components/EarningsChart';
import Leaderboard from '../components/Leaderboard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Moon, Sun, RefreshCw, Settings } from 'lucide-react';
import { formatSOL, formatUSD } from '../../shared/formatters';

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
    refreshWallet 
  } = useWallet();
  
  const [walletAddress, setWalletAddress] = useState('9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr');
  const [showWalletInput, setShowWalletInput] = useState(!wallet);

  useEffect(() => {
    if (wallet?.address) {
      fetchTransactions();
    }
  }, [wallet?.address]);

  // Auto-load demo wallet on first visit
  useEffect(() => {
    if (!wallet && !isLoading) {
      // Auto-load demo wallet for better user experience
      fetchWallet('9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr');
    }
  }, []);

  const handleWalletSubmit = (e) => {
    e.preventDefault();
    if (walletAddress.trim()) {
      fetchWallet(walletAddress.trim());
      setShowWalletInput(false);
    }
  };

  const handleRefresh = () => {
    refreshWallet();
  };

  if (isLoading && wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-solana-50/20 to-primary-50/20 dark:from-gray-900 dark:via-solana-900/10 dark:to-primary-900/10">
        <div className="text-center">
          <LoadingSpinner size="xl" text="Loading wallet data..." />
          <p className="mt-6 text-gray-500 dark:text-gray-400 text-lg">
            Fetching your blockchain data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-b border-white/20 dark:border-gray-700/50">
        <div className="absolute inset-0 bg-gradient-to-r from-solana-400/5 via-primary-400/5 to-solana-400/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-solana-400 to-primary-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-solana-600 to-primary-600 bg-clip-text text-transparent">
                  MCPayStream
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-solana-100 to-primary-100 text-solana-800 dark:from-solana-900/30 dark:to-primary-900/30 dark:text-solana-200 rounded-full border border-solana-200 dark:border-solana-700">
                    Solana
                  </span>
                  <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded-full border border-green-200 dark:border-green-700">
                    Live
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {error ? 'Disconnected' : 'Connected'}
                </span>
              </div>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 focus-ring hover:scale-105"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              
              {/* Settings */}
              <a
                href="/settings"
                className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 focus-ring hover:scale-105"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Wallet Input */}
        {showWalletInput && (
          <div className="mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-solana-400/20 to-primary-400/20 rounded-2xl"></div>
            <div className="relative p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-solana-400 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-solana-600 to-primary-600 bg-clip-text text-transparent mb-2">
                  Track Your Solana Wallet
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor payments, track earnings, and analyze your Solana transactions in real-time
                </p>
              </div>
              
              <form onSubmit={handleWalletSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter Solana wallet address..."
                    className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-solana-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 text-lg"
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-solana-500 to-primary-500 hover:from-solana-600 hover:to-primary-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    Load Wallet
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setWalletAddress('9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr')}
                    className="px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-600"
                  >
                    Use Demo
                  </button>
                </div>
              </form>
              
              <div className="mt-6 p-4 bg-solana-50 dark:bg-solana-900/20 rounded-xl border border-solana-200 dark:border-solana-800">
                <div className="flex items-center text-sm text-solana-700 dark:text-solana-300">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="font-medium">Demo Wallet Available:</span>
                  <span className="ml-2 font-mono text-xs">9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {wallet ? (
          <>
            {/* Wallet Overview */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Wallet Overview
                  </h2>
                  {wallet.stats?.demoMode && (
                    <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-yellow-200 rounded-full border border-yellow-200 dark:border-yellow-700">
                      Demo Mode
                    </span>
                  )}
                </div>
                <button
                  onClick={handleRefresh}
                  className="btn-secondary flex items-center gap-2"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <WalletCard
                  title="SOL Balance"
                  value={formatSOL(balance || 0)}
                  subtitle={formatUSD(balanceUSD || 0)}
                  icon="solana"
                  trend="up"
                  trendValue="+2.5%"
                />
                <WalletCard
                  title="SOL Price"
                  value={formatUSD(solPrice || 197.59)}
                  subtitle="Current market price"
                  icon="price"
                  trend="down"
                  trendValue="-1.2%"
                />
                <WalletCard
                  title="Total Received"
                  value={formatSOL(wallet.stats?.totalReceived || 0)}
                  subtitle={formatUSD(wallet.stats?.totalReceivedUSD || 0)}
                  icon="received"
                />
                <WalletCard
                  title="Transactions"
                  value={wallet.stats?.transactionCount || 0}
                  subtitle="Total count"
                  icon="transactions"
                />
              </div>
            </div>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Earnings Over Time
                </h3>
                <EarningsChart walletAddress={wallet.address} />
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Senders
                </h3>
                <Leaderboard walletAddress={wallet.address} />
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Transactions
                </h3>
              </div>
              {transactions && transactions.length > 0 ? (
                <>
                  {wallet.stats?.demoMode && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700">
                      <div className="flex items-center text-sm text-yellow-700 dark:text-yellow-300">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span>Showing demo transactions for demonstration purposes</span>
                      </div>
                    </div>
                  )}
                  <TransactionsTable transactions={transactions} />
                </>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-solana-100 to-primary-100 dark:from-solana-900/20 dark:to-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-solana-600 dark:text-solana-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No transactions yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    This wallet hasn't received any payments yet. Share your wallet address to start receiving payments!
                  </p>
                  <div className="bg-solana-50 dark:bg-solana-900/20 rounded-lg p-4 border border-solana-200 dark:border-solana-700">
                    <p className="text-sm text-solana-700 dark:text-solana-300 mb-2">
                      <strong>Your Wallet Address:</strong>
                    </p>
                    <code className="text-xs text-solana-800 dark:text-solana-200 font-mono break-all bg-white dark:bg-gray-800 px-2 py-1 rounded">
                      {wallet.address}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
                  /* Welcome State */
        <div className="text-center py-20">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="relative mb-16">
              <div className="absolute inset-0 bg-gradient-to-r from-solana-400/10 via-primary-400/10 to-solana-400/10 rounded-3xl blur-3xl"></div>
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-solana-400 via-primary-500 to-solana-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-solana-600 via-primary-600 to-solana-600 bg-clip-text text-transparent mb-6">
                  MCPayStream
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                  The ultimate blockchain-powered payment tracking dashboard for content creators
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => setShowWalletInput(true)}
                    className="group bg-gradient-to-r from-solana-500 to-primary-500 hover:from-solana-600 hover:to-primary-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center"
                  >
                    <svg className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    Start Tracking
                  </button>
                  
                  <button
                    onClick={() => {
                      setWalletAddress('9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr');
                      setShowWalletInput(false);
                      fetchWallet('9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr');
                    }}
                    className="group bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-4 px-8 rounded-2xl transition-all duration-300 border-2 border-solana-200 dark:border-solana-700 hover:border-solana-400 dark:hover:border-solana-500 backdrop-blur-sm"
                  >
                    <svg className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Try Demo
                  </button>
                </div>
              </div>
            </div>
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="group p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-solana-400 to-solana-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Real-time Tracking</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">Monitor Solana transactions as they happen with live updates</p>
              </div>
              
              <div className="group p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Analytics Dashboard</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">Beautiful charts and insights into your payment patterns</p>
              </div>
              
              <div className="group p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Export & Share</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">Download transaction data and share insights with your team</p>
              </div>
            </div>
            
            {/* Demo Wallet Info */}
            <div className="p-6 bg-gradient-to-r from-solana-50 to-primary-50 dark:from-solana-900/20 dark:to-primary-900/20 rounded-2xl border border-solana-200 dark:border-solana-800">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-solana-100 dark:bg-solana-800 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-solana-600 dark:text-solana-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-solana-800 dark:text-solana-200">Demo Wallet Available</h3>
              </div>
              <p className="text-solana-700 dark:text-solana-300 text-center mb-4">
                Try the dashboard with our pre-configured Phantom wallet
              </p>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-solana-200 dark:border-solana-700">
                <code className="text-sm text-solana-800 dark:text-solana-200 font-mono break-all">
                  9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr
                </code>
              </div>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
