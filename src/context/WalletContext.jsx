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
    socketInstance.on(SOCKET_EVENTS.WALLET_UPDATE, (data) => {
      if (data.address === wallet?.address) {
        setBalance(data.balance);
        setBalanceUSD(data.balance * solPrice);
      }
    });

    // Listen for new transactions
    socketInstance.on(SOCKET_EVENTS.NEW_TRANSACTION, (data) => {
      if (data.addresses.includes(wallet?.address)) {
        // Refresh transactions
        fetchTransactions();
      }
    });

    // Listen for price updates
    socketInstance.on(SOCKET_EVENTS.PRICE_UPDATE, (data) => {
      setSolPrice(data.price);
      setBalanceUSD(balance * data.price);
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

  // Fetch wallet data
  const fetchWallet = async (address) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/wallets/${address}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || errorData?.message || 'Failed to fetch wallet data';
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
      setError(error.message || 'Failed to fetch wallet data. Please check the address and try again.');
    } finally {
      setIsLoading(false);
    }
  };



  // Fetch transactions
  const fetchTransactions = async (limit = 50, offset = 0) => {
    if (!wallet?.address) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/transactions/creator/${wallet.address}?limit=${limit}&offset=${offset}&includeOnChain=true&onChainLimit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      const payload = data.data || data.message || data;
      setTransactions(payload.transactions || []);
      
    } catch (err) {
      console.error('Error fetching transactions:', err);
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
    // State
    wallet,
    transactions,
    balance,
    balanceUSD,
    solPrice,
    isLoading,
    error,
    
    // Actions
    fetchWallet,
    fetchTransactions,
    updateWalletSettings,
    refreshWallet,
    clearWallet,
    getTransactionStats,
    
    // Socket
    socket,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
