import axios from 'axios';
import logger from '../utils/logger.js';
import config from '../config/env.js';

/**
 * Get SOL price from CoinGecko
 * @param {string} currency - Target currency (default: 'usd')
 * @returns {Promise<number>} SOL price in specified currency
 */
export async function getSolPrice(currency = 'usd') {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=${currency}`,
      {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MCPayStream/1.0'
        }
      }
    );

    if (response.data && response.data.solana && response.data.solana[currency]) {
      const price = response.data.solana[currency];
      logger.info(`SOL price: ${price} ${currency.toUpperCase()}`);
      return price;
    } else {
      throw new Error('Invalid response format from CoinGecko');
    }
  } catch (error) {
    logger.error('Error fetching SOL price from CoinGecko:', error);
    
    // Return cached price if available, or fallback
    if (error.response?.status === 429) {
      logger.warn('Rate limited by CoinGecko, using fallback price');
      return 100; // Fallback price
    }
    
    throw new Error(`Failed to fetch SOL price: ${error.message}`);
  }
}

/**
 * Get SOL price with multiple currencies
 * @param {Array<string>} currencies - Array of currency codes
 * @returns {Promise<Object>} Object with currency -> price mapping
 */
export async function getSolPrices(currencies = ['usd', 'eur', 'gbp']) {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=${currencies.join(',')}`,
      {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MCPayStream/1.0'
        }
      }
    );

    if (response.data && response.data.solana) {
      logger.info('SOL prices fetched for multiple currencies');
      return response.data.solana;
    } else {
      throw new Error('Invalid response format from CoinGecko');
    }
  } catch (error) {
    logger.error('Error fetching SOL prices for multiple currencies:', error);
    throw new Error(`Failed to fetch SOL prices: ${error.message}`);
  }
}

/**
 * Get SOL price history
 * @param {string} currency - Target currency (default: 'usd')
 * @param {number} days - Number of days (default: 7)
 * @returns {Promise<Array>} Array of price data points
 */
export async function getSolPriceHistory(currency = 'usd', days = 7) {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=${currency}&days=${days}`,
      {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MCPayStream/1.0'
        }
      }
    );

    if (response.data && response.data.prices) {
      const priceData = response.data.prices.map(([timestamp, price]) => ({
        timestamp,
        date: new Date(timestamp),
        price: parseFloat(price.toFixed(6))
      }));
      
      logger.info(`SOL price history fetched for ${days} days`);
      return priceData;
    } else {
      throw new Error('Invalid response format from CoinGecko');
    }
  } catch (error) {
    logger.error('Error fetching SOL price history:', error);
    throw new Error(`Failed to fetch SOL price history: ${error.message}`);
  }
}

/**
 * Get SOL market data
 * @param {string} currency - Target currency (default: 'usd')
 * @returns {Promise<Object>} Market data object
 */
export async function getSolMarketData(currency = 'usd') {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/solana?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MCPayStream/1.0'
        }
      }
    );

    if (response.data && response.data.market_data) {
      const marketData = response.data.market_data;
      
      const result = {
        currentPrice: marketData.current_price[currency],
        marketCap: marketData.market_cap[currency],
        volume24h: marketData.total_volume[currency],
        priceChange24h: marketData.price_change_24h,
        priceChangePercentage24h: marketData.price_change_percentage_24h,
        marketCapRank: marketData.market_cap_rank,
        circulatingSupply: marketData.circulating_supply,
        totalSupply: marketData.total_supply,
        maxSupply: marketData.max_supply,
        ath: marketData.ath[currency],
        athDate: marketData.ath_date[currency],
        atl: marketData.atl[currency],
        atlDate: marketData.atl_date[currency]
      };
      
      logger.info('SOL market data fetched successfully');
      return result;
    } else {
      throw new Error('Invalid response format from CoinGecko');
    }
  } catch (error) {
    logger.error('Error fetching SOL market data:', error);
    throw new Error(`Failed to fetch SOL market data: ${error.message}`);
  }
}

/**
 * Convert SOL amount to USD
 * @param {number} solAmount - Amount in SOL
 * @param {number} solPrice - SOL price in USD
 * @returns {number} Amount in USD
 */
export function convertSolToUSD(solAmount, solPrice) {
  return solAmount * solPrice;
}

/**
 * Convert USD amount to SOL
 * @param {number} usdAmount - Amount in USD
 * @param {number} solPrice - SOL price in USD
 * @returns {number} Amount in SOL
 */
export function convertUSDToSol(usdAmount, solPrice) {
  return usdAmount / solPrice;
}

/**
 * Get price change percentage
 * @param {number} currentPrice - Current price
 * @param {number} previousPrice - Previous price
 * @returns {number} Price change percentage
 */
export function getPriceChangePercentage(currentPrice, previousPrice) {
  if (previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

/**
 * Format price with appropriate decimals
 * @param {number} price - Price to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted price string
 */
export function formatPrice(price, currency = 'usd') {
  if (currency === 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(price);
}

/**
 * Cache for price data to avoid excessive API calls
 */
const priceCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached SOL price or fetch new one
 * @param {string} currency - Target currency
 * @returns {Promise<number>} SOL price
 */
export async function getCachedSolPrice(currency = 'usd') {
  const cacheKey = `sol_price_${currency}`;
  const cached = priceCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logger.debug('Using cached SOL price');
    return cached.price;
  }
  
  const price = await getSolPrice(currency);
  
  priceCache.set(cacheKey, {
    price,
    timestamp: Date.now()
  });
  
  return price;
}

/**
 * Clear price cache
 */
export function clearPriceCache() {
  priceCache.clear();
  logger.info('Price cache cleared');
}
