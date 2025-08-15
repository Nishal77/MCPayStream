// API Endpoints
export const API_ENDPOINTS = {
  WALLET: '/api/wallet',
  TRANSACTIONS: '/api/transactions',
  STATS: '/api/stats',
  WEBHOOK: '/api/webhook',
};

// WebSocket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  NEW_TRANSACTION: 'new_transaction',
  WALLET_UPDATE: 'wallet_update',
  PRICE_UPDATE: 'price_update',
};

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
};

// Solana Configuration
export const SOLANA_CONFIG = {
  DECIMALS: 9,
  MINIMUM_BALANCE: 0.001,
  NETWORK: 'mainnet-beta',
};

// Chart Configuration
export const CHART_CONFIG = {
  TIME_RANGES: {
    '24H': '24h',
    '7D': '7d',
    '30D': '30d',
    '1Y': '1y',
  },
  REFRESH_INTERVAL: 30000, // 30 seconds
};

// UI Constants
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  MAX_TRANSACTIONS_DISPLAY: 50,
  PAGINATION_SIZE: 20,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_ADDRESS: 'Invalid Solana wallet address.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
};
