import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../shared/constants';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [balanceUSD, setBalanceUSD] = useState(0);
  const [solPrice, setSolPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // Start with false since no wallet is loaded initially
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
      autoConnect: true,
      timeout: 10000, // 10 second timeout
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
      // Don't show error immediately, let reconnection handle it
      if (socketInstance.io.reconnectionAttempts() === 0) {
        setError('Failed to connect to server. Please ensure the backend is running.');
      }
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to server after', attemptNumber, 'attempts');
      setError(null);
    });

    socketInstance.on('reconnect_failed', () => {
      setError('Failed to reconnect to server. Please check your connection.');
    });

    // Listen for wallet updates
    socketInstance.on('transaction-update', (data) => {
      console.log('Received transaction update:', data);
      // Add new transaction to the list
      setTransactions(prev => [data, ...prev]);
      
      // Refresh wallet data to get updated balance and stats
      if (wallet?.address) {
        console.log('Refreshing wallet data due to new transaction');
        fetchWallet(wallet.address);
      }
    });

    // Listen for balance updates
    socketInstance.on('balance-update', (data) => {
      console.log('Received balance update:', data);
      setBalance(data.balance);
      setBalanceUSD(data.balanceUSD);
      setSolPrice(data.solPrice);
    });

    // Listen for earnings updates
    socketInstance.on('earnings-update', (data) => {
      console.log('Received earnings update:', data);
      // Trigger earnings chart refresh
      if (wallet?.address) {
        // The earnings chart will automatically refresh when this event is received
      }
    });

    // Listen for leaderboard updates
    socketInstance.on('leaderboard-update', (data) => {
      console.log('Received leaderboard update:', data);
      // Trigger leaderboard refresh
      if (wallet?.address) {
        // The leaderboard will automatically refresh when this event is received
      }
    });

    // Listen for general stats updates
    socketInstance.on('stats-update', (data) => {
      console.log('Received stats update:', data);
      if (data.walletAddress === wallet?.address) {
        // Refresh relevant data based on update type
        switch (data.type) {
          case 'transaction':
            fetchTransactions();
            break;
          case 'earnings':
            // Earnings chart will refresh automatically
            break;
          default:
            break;
        }
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [wallet?.address, balance, solPrice]);

  // Join wallet room when wallet changes
  useEffect(() => {
    if (socket && wallet?.address) {
      socket.emit('join-wallet', wallet.address);
      
      return () => {
        socket.emit('leave-wallet', wallet.address);
      };
    }
  }, [socket, wallet?.address]);

  // Fetch wallet data with retry logic
  const fetchWallet = async (address, retryCount = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear previous data when loading a new wallet
      setWallet(null);
      setTransactions([]);
      setBalance(0);
      setBalanceUSD(0);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/wallets/${address}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
            
            setTimeout(() => {
              fetchWallet(address, retryCount + 1);
            }, delay);
            return;
          } else {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
          }
        }
        
        // Handle other errors
        const message = errorData?.error?.message || errorData?.message || `Failed to fetch wallet data (${response.status})`;
        throw new Error(message);
      }
      
      const walletData = await response.json();
      const liveData = walletData.data || walletData.message || walletData; // support both shapes
      // Normalize to always have .address for UI logic and sockets
      const normalized = {
        ...liveData,
        address: liveData.address || liveData.solanaAddress,
      };
      
      // Use real live data from blockchain
      setWallet(normalized);
      setBalance(normalized.balance || 0);
      setBalanceUSD(normalized.balanceUSD || 0);
      setSolPrice(normalized.currentSolPrice || 0);
      
      console.log('Live wallet data loaded:', normalized);
      
    } catch (error) {
      console.error('Error fetching wallet:', error);
      
      // Provide user-friendly error messages
      let userMessage = error.message;
      if (error.message.includes('Rate limit')) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('Failed to fetch')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('500')) {
        userMessage = 'Server error. Please try again in a moment.';
      }
      
      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };



  // Fetch transactions with retry logic
  const fetchTransactions = async (limit = 50, offset = 0, retryCount = 0) => {
    if (!wallet?.address) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/transactions/creator/${wallet.address}?limit=${limit}&offset=${offset}&includeOnChain=true&onChainLimit=${limit}`
      );
      
      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Rate limited. Retrying transactions in ${delay}ms... (attempt ${retryCount + 1}/3)`);
            
            setTimeout(() => {
              fetchTransactions(limit, offset, retryCount + 1);
            }, delay);
            return;
          } else {
            console.error('Rate limit exceeded for transactions');
            return;
          }
        }
        
        throw new Error(`Failed to fetch transactions (${response.status})`);
      }
      
      const data = await response.json();
      const payload = data.data || data.message || data;
      const transactionList = payload.transactions || [];
      
      console.log('Raw transaction API response:', data);
      console.log('Processed transactions:', transactionList);
      
      setTransactions(transactionList);
      
    } catch (err) {
      console.error('Error fetching transactions:', err);
      // Don't show error to user for transactions, just log it
    }
  };

  // Update wallet settings
  const updateWalletSettings = async (settings) => {
    if (!wallet?.address) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/wallets/${wallet.address}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to update wallet settings');
      }
      
      const updatedWallet = await response.json();
      setWallet(updatedWallet);
      
    } catch (err) {
      setError(err.message);
      console.error('Error updating wallet settings:', err);
    }
  };

  // Refresh wallet data
  const refreshWallet = () => {
    if (wallet?.address) {
      fetchWallet(wallet.address);
    }
  };

  // Clear wallet data
  const clearWallet = () => {
    setWallet(null);
    setTransactions([]);
    setBalance(0);
    setBalanceUSD(0);
    setSolPrice(0);
    setError(null);
  };

  // Get transaction statistics
  const getTransactionStats = () => {
    if (!transactions.length) return null;
    
    const totalReceived = transactions
      .filter(tx => tx.toAddress === wallet?.address && tx.status === 'confirmed')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalSent = transactions
      .filter(tx => tx.fromAddress === wallet?.address && tx.status === 'confirmed')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const pendingCount = transactions.filter(tx => tx.status === 'pending').length;
    
    return {
      totalReceived,
      totalSent,
      pendingCount,
      totalTransactions: transactions.length,
    };
  };

  const value = {
    wallet,
    transactions,
    balance,
    balanceUSD,
    solPrice,
    isLoading,
    error,
    fetchWallet,
    fetchTransactions,
    updateWalletSettings,
    refreshWallet,
    setWallet, // Add setWallet to context
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
