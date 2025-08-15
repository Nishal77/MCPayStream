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
export function parsePaymentTransaction(transaction, address) {
  try {
    if (!transaction || !transaction.meta || transaction.meta.err) {
      return null;
    }
    
    const message = transaction.transaction.message;
    const accountKeys = message.accountKeys;
    const targetAddress = address;
    
    // Find the account index for the target address
    const targetIndex = accountKeys.findIndex(key => key.toBase58() === targetAddress);
    if (targetIndex === -1) {
      return null;
    }
    
    // Calculate balance changes
    const preBalance = transaction.meta.preBalances[targetIndex];
    const postBalance = transaction.meta.postBalances[targetIndex];
    const deltaLamports = postBalance - preBalance;
    
    // Only process if there's a positive balance change (incoming SOL)
    if (deltaLamports <= 0) {
      return null;
    }
    
    // Find the sender by looking for accounts that lost SOL
    let senderIndex = -1;
    let maxLoss = 0;
    
    for (let i = 0; i < accountKeys.length; i++) {
      if (i !== targetIndex) {
        const preBalance = transaction.meta.preBalances[i];
        const postBalance = transaction.meta.postBalances[i];
        const loss = preBalance - postBalance;
        
        // Find the account with the biggest loss (excluding fees)
        if (loss > maxLoss && loss > 0) {
          maxLoss = loss;
          senderIndex = i;
        }
      }
    }
    
    if (senderIndex === -1) {
      // If no clear sender found, try to infer from the first account that's not the target
      for (let i = 0; i < accountKeys.length; i++) {
        if (i !== targetIndex && i < transaction.meta.preBalances.length) {
          senderIndex = i;
          break;
        }
      }
    }
    
    if (senderIndex === -1) {
      return null;
    }
    
    const solAmount = deltaLamports / LAMPORTS_PER_SOL;
    const senderAddress = accountKeys[senderIndex].toBase58();
    const fee = transaction.meta.fee / LAMPORTS_PER_SOL;
    
    // Verify this is a valid SOL transfer (amount should be reasonable)
    if (solAmount <= 0 || solAmount > 1000000) { // Max 1M SOL sanity check
      return null;
    }
    
    logger.info(`Parsed transaction: ${transaction.transaction.signatures[0]} - ${solAmount} SOL from ${senderAddress} to ${targetAddress}`);
    
    return {
      signature: transaction.transaction.signatures[0],
      fromAddress: senderAddress,
      toAddress: targetAddress,
      amountSOL: solAmount,
      direction: 'IN', // Always IN for this function since we filter for positive delta
      fee,
      blockTime: transaction.blockTime,
      slot: transaction.slot,
      type: 'SOL_TRANSFER',
      preBalance: preBalance / LAMPORTS_PER_SOL,
      postBalance: postBalance / LAMPORTS_PER_SOL
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
    
    // Get more signatures to account for non-payment transactions
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: limit * 5 });
    
    logger.info(`Fetching ${signatures.length} transactions for address: ${address}`);
    
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });
          
          if (tx && tx.meta && !tx.meta.err) {
            // Try to parse as payment transaction first
            const parsed = parsePaymentTransaction(tx, address);
            if (parsed) {
              logger.info(`Parsed payment transaction: ${parsed.signature} - ${parsed.amountSOL} SOL from ${parsed.fromAddress}`);
              return parsed;
            }
            
            // If not a payment transaction, try to extract any SOL transfer
            const solTransfer = extractSOLTransfer(tx, address);
            if (solTransfer) {
              logger.info(`Extracted SOL transfer: ${solTransfer.signature} - ${solTransfer.amountSOL} SOL`);
              return solTransfer;
            }
          }
          return null;
        } catch (error) {
          logger.warn(`Failed to get transaction ${sig.signature}:`, error);
          return null;
        }
      })
    );
    
    const validTransactions = transactions.filter(tx => tx !== null);
    logger.info(`Found ${validTransactions.length} valid transactions out of ${signatures.length} total`);
    
    // Sort by blockTime descending and limit to requested amount
    return validTransactions
      .sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0))
      .slice(0, limit);
  } catch (error) {
    logger.error(`Error getting recent transactions for ${address}:`, error);
    throw new Error(`Failed to get recent transactions: ${error.message}`);
  }
}

/**
 * Extract SOL transfer from any transaction type
 * @param {Object} transaction - Transaction object from Solana
 * @param {string} targetAddress - Address to check for transfers
 * @returns {Object|null} Transfer info or null if not a transfer
 */
function extractSOLTransfer(transaction, address) {
  try {
    if (!transaction || !transaction.meta || transaction.meta.err) {
      return null;
    }
    
    const message = transaction.transaction.message;
    const accountKeys = message.accountKeys;
    const targetAddress = address;
    
    // Find the account index for the target address
    const targetIndex = accountKeys.findIndex(key => key.toBase58() === targetAddress);
    if (targetIndex === -1) {
      return null;
    }
    
    // Calculate balance changes
    const preBalance = transaction.meta.preBalances[targetIndex];
    const postBalance = transaction.meta.postBalances[targetIndex];
    const deltaLamports = postBalance - preBalance;
    
    // Only process if there's a positive balance change (incoming SOL)
    if (deltaLamports <= 0) {
      return null;
    }
    
    const solAmount = deltaLamports / LAMPORTS_PER_SOL;
    
    // Find any account that lost SOL (potential sender)
    let senderAddress = 'Unknown';
    for (let i = 0; i < accountKeys.length; i++) {
      if (i !== targetIndex && i < transaction.meta.preBalances.length) {
        const preBalance = transaction.meta.preBalances[i];
        const postBalance = transaction.meta.postBalances[i];
        if (postBalance < preBalance) {
          senderAddress = accountKeys[i].toBase58();
          break;
        }
      }
    }
    
    // If no clear sender found, use the first account that's not the target
    if (senderAddress === 'Unknown') {
      for (let i = 0; i < accountKeys.length; i++) {
        if (i !== targetIndex && i < transaction.meta.preBalances.length) {
          senderAddress = accountKeys[i].toBase58();
          break;
        }
      }
    }
    
    const fee = transaction.meta.fee / LAMPORTS_PER_SOL;
    
    return {
      signature: transaction.transaction.signatures[0],
      fromAddress: senderAddress,
      toAddress: targetAddress,
      amountSOL: solAmount,
      direction: 'IN',
      fee,
      blockTime: transaction.blockTime,
      slot: transaction.slot,
      type: 'SOL_TRANSFER',
      preBalance: preBalance / LAMPORTS_PER_SOL,
      postBalance: postBalance / LAMPORTS_PER_SOL
    };
  } catch (error) {
    logger.error('Error extracting SOL transfer:', error);
    return null;
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
