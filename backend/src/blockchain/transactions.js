import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import solanaConfig from '../config/solana.js';
import logger from '../utils/logger.js';

/**
 * Get transaction details by signature
 * @param {string} signature - Transaction signature
 * @returns {Promise<Object>} Transaction details
 */
export async function getTransaction(signature) {
  try {
    const connection = solanaConfig.getConnection();
    
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    return {
      signature,
      blockTime: transaction.blockTime,
      slot: transaction.slot,
      meta: transaction.meta,
      transaction: transaction.transaction
    };
  } catch (error) {
    logger.error(`Error getting transaction ${signature}:`, error);
    throw new Error(`Failed to get transaction: ${error.message}`);
  }
}

/**
 * Get transaction history for a wallet
 * @param {string} address - Wallet address
 * @param {number} limit - Number of transactions to fetch
 * @param {string} before - Signature to start from (for pagination)
 * @returns {Promise<Array>} Array of transaction signatures
 */
export async function getTransactionHistory(address, limit = 20, before = null) {
  try {
    const connection = solanaConfig.getConnection();
    const publicKey = new PublicKey(address);
    
    const options = { limit };
    if (before) {
      options.before = before;
    }
    
    const signatures = await connection.getSignaturesForAddress(publicKey, options);
    
    return signatures.map(sig => ({
      signature: sig.signature,
      slot: sig.slot,
      blockTime: sig.blockTime,
      err: sig.err,
      memo: sig.memo,
      fee: sig.fee
    }));
  } catch (error) {
    logger.error(`Error getting transaction history for ${address}:`, error);
    throw new Error(`Failed to get transaction history: ${error.message}`);
  }
}

/**
 * Get confirmed transaction history for a wallet
 * @param {string} address - Wallet address
 * @param {number} limit - Number of transactions to fetch
 * @returns {Promise<Array>} Array of confirmed transactions
 */
export async function getConfirmedTransactionHistory(address, limit = 20) {
  try {
    const connection = solanaConfig.getConnection();
    const publicKey = new PublicKey(address);
    
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit });
    
    // Filter out confirmedSignatures
    const confirmedSignatures = signatures
      .filter(sig => !sig.err)
      .map(sig => sig.signature);
    
    // Get transaction details for confirmed transactions
    const transactions = await Promise.all(
      confirmedSignatures.map(async (signature) => {
        try {
          const tx = await connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0
          });
          
          if (tx && tx.meta && !tx.meta.err) {
            return {
              signature,
              blockTime: tx.blockTime,
              slot: tx.slot,
              fee: tx.meta.fee,
              preBalances: tx.meta.preBalances,
              postBalances: tx.meta.postBalances,
              preTokenBalances: tx.meta.preTokenBalances,
              postTokenBalances: tx.meta.postTokenBalances,
              logMessages: tx.meta.logMessages
            };
          }
          return null;
        } catch (error) {
          logger.warn(`Failed to get transaction ${signature}:`, error);
          return null;
        }
      })
    );
    
    return transactions.filter(tx => tx !== null);
  } catch (error) {
    logger.error(`Error getting confirmed transaction history for ${address}:`, error);
    throw new Error(`Failed to get confirmed transaction history: ${error.message}`);
  }
}

/**
 * Parse transaction to extract payment information
 * @param {Object} transaction - Transaction object from Solana
 * @param {string} targetAddress - Address to check for payments
 * @returns {Object|null} Parsed payment info or null if not a payment
 */
export function parsePaymentTransaction(transaction, targetAddress) {
  try {
    if (!transaction || !transaction.meta || transaction.meta.err) {
      return null;
    }
    
    const { preBalances, postBalances, preTokenBalances, postTokenBalances } = transaction.meta;
    const { message } = transaction.transaction;
    
    // Check if this is a transfer to our target address
    const targetIndex = message.accountKeys.findIndex(key => key.toBase58() === targetAddress);
    
    if (targetIndex === -1) {
      return null; // Not a transfer to our address
    }
    
    // Calculate SOL amount transferred
    const preBalance = preBalances[targetIndex] || 0;
    const postBalance = postBalances[targetIndex] || 0;
    const solAmount = (postBalance - preBalance) / LAMPORTS_PER_SOL;
    
    if (solAmount <= 0) {
      return null; // No SOL received
    }
    
    // Find sender (account that lost SOL)
    let senderIndex = -1;
    for (let i = 0; i < preBalances.length; i++) {
      if (i !== targetIndex && preBalances[i] > postBalances[i]) {
        senderIndex = i;
        break;
      }
    }
    
    if (senderIndex === -1) {
      return null; // Couldn't identify sender
    }
    
    const senderAddress = message.accountKeys[senderIndex].toBase58();
    const fee = transaction.meta.fee / LAMPORTS_PER_SOL;
    
    return {
      signature: transaction.transaction.signatures[0],
      sender: senderAddress,
      receiver: targetAddress,
      amountSOL: solAmount,
      fee,
      blockTime: transaction.blockTime,
      slot: transaction.slot,
      type: 'SOL_TRANSFER'
    };
  } catch (error) {
    logger.error('Error parsing payment transaction:', error);
    return null;
  }
}

/**
 * Get recent transactions for a wallet with detailed information
 * @param {string} address - Wallet address
 * @param {number} limit - Number of transactions to fetch
 * @returns {Promise<Array>} Array of parsed transactions
 */
export async function getRecentTransactions(address, limit = 10) {
  try {
    const connection = solanaConfig.getConnection();
    const publicKey = new PublicKey(address);
    
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit });
    
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });
          
          if (tx && tx.meta && !tx.meta.err) {
            return parsePaymentTransaction(tx, address);
          }
          return null;
        } catch (error) {
          logger.warn(`Failed to get transaction ${sig.signature}:`, error);
          return null;
        }
      })
    );
    
    return transactions.filter(tx => tx !== null);
  } catch (error) {
    logger.error(`Error getting recent transactions for ${address}:`, error);
    throw new Error(`Failed to get recent transactions: ${error.message}`);
  }
}

/**
 * Check if a transaction is confirmed
 * @param {string} signature - Transaction signature
 * @returns {Promise<boolean>} True if confirmed
 */
export async function isTransactionConfirmed(signature) {
  try {
    const connection = solanaConfig.getConnection();
    
    const status = await connection.getSignatureStatus(signature);
    
    return status && status.value && status.value.confirmationStatus === 'confirmed';
  } catch (error) {
    logger.error(`Error checking transaction confirmation for ${signature}:`, error);
    return false;
  }
}

/**
 * Get transaction fee
 * @param {string} signature - Transaction signature
 * @returns {Promise<number>} Fee in SOL
 */
export async function getTransactionFee(signature) {
  try {
    const connection = solanaConfig.getConnection();
    
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });
    
    if (!transaction || !transaction.meta) {
      throw new Error('Transaction not found or invalid');
    }
    
    return transaction.meta.fee / LAMPORTS_PER_SOL;
  } catch (error) {
    logger.error(`Error getting transaction fee for ${signature}:`, error);
    throw new Error(`Failed to get transaction fee: ${error.message}`);
  }
}
