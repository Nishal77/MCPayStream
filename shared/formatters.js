// Number formatting
export const formatSOL = (amount, decimals = 4) => {
  if (amount === null || amount === undefined) return '0.0000';
  return Number(amount).toFixed(decimals);
};

export const formatUSD = (amount, decimals = 2) => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0.00%';
  return `${Number(value).toFixed(decimals)}%`;
};

// Address formatting
export const formatAddress = (address, start = 4, end = 4) => {
  if (!address) return 'N/A';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const formatShortAddress = (address) => {
  return formatAddress(address, 6, 6);
};

// Date and time formatting
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
};

// File size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Currency conversion
export const convertSOLtoUSD = (solAmount, solPrice) => {
  if (!solAmount || !solPrice) return 0;
  return solAmount * solPrice;
};

export const convertUSDtoSOL = (usdAmount, solPrice) => {
  if (!usdAmount || !solPrice) return 0;
  return usdAmount / solPrice;
};

// Validation helpers
export const isValidSolanaAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

export const isValidAmount = (amount) => {
  if (amount === null || amount === undefined) return false;
  const num = Number(amount);
  return !isNaN(num) && num > 0;
};
