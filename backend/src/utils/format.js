import { formatSOL, formatUSD, formatAddress, formatDate } from '../../../shared/formatters.js';

/**
 * Format SOL amount with appropriate decimals
 * @param {number} amount - Amount in SOL
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted SOL amount
 */
export function formatSolAmount(amount, decimals = 6) {
  return formatSOL(amount, decimals);
}

/**
 * Format USD amount with appropriate decimals
 * @param {number} amount - Amount in USD
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted USD amount
 */
export function formatUsdAmount(amount, decimals = 2) {
  return formatUSD(amount, decimals);
}

/**
 * Format wallet address for display
 * @param {string} address - Wallet address
 * @param {number} startChars - Number of characters to show at start
 * @param {number} endChars - Number of characters to show at end
 * @returns {string} Formatted address
 */
export function formatWalletAddress(address, startChars = 6, endChars = 4) {
  return formatAddress(address, startChars, endChars);
}

/**
 * Format date for display
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format string
 * @returns {string} Formatted date
 */
export function formatDateDisplay(date, format = 'relative') {
  return formatDate(date, format);
}

/**
 * Format file size in bytes
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format percentage
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  
  const formatted = value.toFixed(decimals);
  return `${formatted}%`;
}

/**
 * Format number with thousands separator
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(value, decimals = 0) {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted currency
 */
export function formatCurrency(amount, currency = 'USD', decimals = 2) {
  if (typeof amount !== 'number' || isNaN(amount)) return `0 ${currency}`;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

/**
 * Format timestamp for logs
 * @param {Date|string|number} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toISOString();
}

/**
 * Format duration in milliseconds
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Format error message for display
 * @param {Error|string} error - Error to format
 * @returns {string} Formatted error message
 */
export function formatErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return 'An unknown error occurred';
}

/**
 * Format validation error for API response
 * @param {Array} errors - Validation errors array
 * @returns {Object} Formatted validation errors
 */
export function formatValidationErrors(errors) {
  const formatted = {};
  
  errors.forEach(error => {
    if (error.path && error.msg) {
      if (!formatted[error.path]) {
        formatted[error.path] = [];
      }
      formatted[error.path].push(error.msg);
    }
  });
  
  return formatted;
}

/**
 * Format pagination metadata
 * @param {number} total - Total number of items
 * @param {number} limit - Items per page
 * @param {number} offset - Current offset
 * @returns {Object} Formatted pagination metadata
 */
export function formatPagination(total, limit, offset) {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  
  return {
    total,
    limit,
    offset,
    totalPages,
    currentPage,
    hasNext: offset + limit < total,
    hasPrev: offset > 0
  };
}

/**
 * Format API response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata
 * @returns {Object} Formatted API response
 */
export function formatApiResponse(data, message = 'Success', meta = {}) {
  return {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format API error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {any} details - Error details
 * @returns {Object} Formatted API error response
 */
export function formatApiError(message, code = 'ERROR', details = null) {
  return {
    success: false,
    error: {
      message,
      code,
      details
    },
    timestamp: new Date().toISOString()
  };
}
