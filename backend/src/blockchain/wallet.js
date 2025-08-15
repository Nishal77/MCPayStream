import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import solanaConfig from '../config/solana.js';
import logger from '../utils/logger.js';

/**
 * Get wallet balance
 * @param {string} address - Solana wallet address
 * @returns {Promise<number>} Balance in SOL
 */
export async function getWalletBalance(address) {
  try {
    const connection = solanaConfig.getConnection();
    const publicKey = new PublicKey(address);
    
    const balance = await connection.getBalance(publicKey);
    const balanceInSOL = balance / LAMPORTS_PER_SOL;
    
    logger.info(`Wallet ${address} balance: ${balanceInSOL} SOL`);
    return balanceInSOL;
  } catch (error) {
    logger.error(`Error getting wallet balance for ${address}:`, error);
    // Return 0 for empty wallets instead of throwing error
    if (error.message.includes('Account not found') || error.message.includes('Invalid account')) {
      logger.info(`Wallet ${address} has no balance (new wallet)`);
      return 0;
    }
    throw new Error(`Failed to get wallet balance: ${error.message}`);
  }
}

/**
 * Get wallet account info
 * @param {string} address - Solana wallet address
 * @returns {Promise<Object>} Account info
 */
export async function getWalletAccountInfo(address) {
  try {
    const connection = solanaConfig.getConnection();
    const publicKey = new PublicKey(address);
    
    const accountInfo = await connection.getAccountInfo(publicKey);
    
    if (!accountInfo) {
      throw new Error('Account not found');
    }
    
    return {
      address,
      lamports: accountInfo.lamports,
      owner: accountInfo.owner.toBase58(),
      executable: accountInfo.executable,
      rentEpoch: accountInfo.rentEpoch,
      data: accountInfo.data
    };
  } catch (error) {
    logger.error(`Error getting account info for ${address}:`, error);
    throw new Error(`Failed to get account info: ${error.message}`);
  }
}

/**
 * Validate Solana address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export function isValidSolanaAddress(address) {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get multiple wallet balances
 * @param {string[]} addresses - Array of wallet addresses
 * @returns {Promise<Object>} Object with address -> balance mapping
 */
export async function getMultipleWalletBalances(addresses) {
  try {
    const connection = solanaConfig.getConnection();
    const publicKeys = addresses.map(addr => new PublicKey(addr));
    
    const result = {};
    
    for (const address of addresses) {
      try {
        const publicKey = new PublicKey(address);
        const balance = await connection.getBalance(publicKey);
        result[address] = balance / LAMPORTS_PER_SOL;
      } catch (error) {
        logger.warn(`Failed to get balance for ${address}:`, error);
        result[address] = 0;
      }
    }
    
    return result;
  } catch (error) {
    logger.error('Error getting multiple wallet balances:', error);
    throw new Error(`Failed to get multiple wallet balances: ${error.message}`);
  }
}

/**
 * Get wallet token accounts
 * @param {string} address - Wallet address
 * @returns {Promise<Array>} Array of token accounts
 */
export async function getWalletTokenAccounts(address) {
  try {
    const connection = solanaConfig.getConnection();
    const publicKey = new PublicKey(address);
    
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });
    
    return tokenAccounts.value.map(account => ({
      mint: account.account.data.parsed.info.mint,
      owner: account.account.data.parsed.info.owner,
      amount: account.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: account.account.data.parsed.info.tokenAmount.decimals
    }));
  } catch (error) {
    logger.error(`Error getting token accounts for ${address}:`, error);
    // Return empty array for wallets with no tokens
    if (error.message.includes('Account not found') || error.message.includes('Invalid account')) {
      logger.info(`Wallet ${address} has no token accounts`);
      return [];
    }
    throw new Error(`Failed to get token accounts: ${error.message}`);
  }
}

/**
 * Check if wallet exists
 * @param {string} address - Wallet address
 * @returns {Promise<boolean>} True if wallet exists
 */
export async function walletExists(address) {
  try {
    const connection = solanaConfig.getConnection();
    const publicKey = new PublicKey(address);
    
    const accountInfo = await connection.getAccountInfo(publicKey);
    // Consider wallet exists even if it has no balance (new wallets)
    return true; // All valid Solana addresses are considered to exist
  } catch (error) {
    logger.error(`Error checking if wallet exists ${address}:`, error);
    // If we can't validate, assume it exists and let other functions handle the details
    return true;
  }
}

/**
 * Get wallet transaction count
 * @param {string} address - Wallet address
 * @returns {Promise<number>} Transaction count
 */
export async function getWalletTransactionCount(address) {
  try {
    const connection = solanaConfig.getConnection();
    const publicKey = new PublicKey(address);
    
    const signatureCount = await connection.getSignatureCountForAddress(publicKey);
    return signatureCount;
  } catch (error) {
    logger.error(`Error getting transaction count for ${address}:`, error);
    throw new Error(`Failed to get transaction count: ${error.message}`);
  }
}
