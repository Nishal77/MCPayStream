import axios from 'axios';
import logger from '../utils/logger.js';
import config from '../config/env.js';

/**
 * Send webhook notification for new payment
 * @param {Object} paymentData - Payment data
 * @param {string} webhookUrl - Webhook URL
 * @returns {Promise<boolean>} Success status
 */
export async function sendPaymentWebhook(paymentData, webhookUrl) {
  try {
    if (!webhookUrl) {
      logger.warn('No webhook URL configured, skipping webhook notification');
      return false;
    }

    const webhookPayload = {
      event: 'payment_received',
      timestamp: new Date().toISOString(),
      data: {
        signature: paymentData.signature,
        sender: paymentData.sender,
        receiver: paymentData.receiver,
        amountSOL: paymentData.amountSOL,
        amountUSD: paymentData.amountUSD,
        status: paymentData.status,
        blockTime: paymentData.blockTime,
        slot: paymentData.slot
      }
    };

    const response = await axios.post(webhookUrl, webhookPayload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCPayStream/1.0',
        'X-Webhook-Signature': generateWebhookSignature(webhookPayload)
      }
    });

    if (response.status >= 200 && response.status < 300) {
      logger.info(`Webhook sent successfully to ${webhookUrl}`);
      return true;
    } else {
      logger.warn(`Webhook returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error sending webhook to ${webhookUrl}:`, error);
    return false;
  }
}

/**
 * Send webhook notification for wallet balance update
 * @param {Object} walletData - Wallet data
 * @param {string} webhookUrl - Webhook URL
 * @returns {Promise<boolean>} Success status
 */
export async function sendBalanceWebhook(walletData, webhookUrl) {
  try {
    if (!webhookUrl) {
      logger.warn('No webhook URL configured, skipping balance webhook');
      return false;
    }

    const webhookPayload = {
      event: 'balance_updated',
      timestamp: new Date().toISOString(),
      data: {
        address: walletData.address,
        name: walletData.name,
        balance: walletData.balance,
        lastSolPrice: walletData.lastSolPrice,
        totalReceived: walletData.statistics?.totalReceived || 0,
        totalTransactions: walletData.statistics?.totalTransactions || 0
      }
    };

    const response = await axios.post(webhookUrl, webhookPayload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCPayStream/1.0',
        'X-Webhook-Signature': generateWebhookSignature(webhookPayload)
      }
    });

    if (response.status >= 200 && response.status < 300) {
      logger.info(`Balance webhook sent successfully to ${webhookUrl}`);
      return true;
    } else {
      logger.warn(`Balance webhook returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error sending balance webhook to ${webhookUrl}:`, error);
    return false;
  }
}

/**
 * Send webhook notification for transaction status change
 * @param {Object} transactionData - Transaction data
 * @param {string} webhookUrl - Webhook URL
 * @returns {Promise<boolean>} Success status
 */
export async function sendStatusWebhook(transactionData, webhookUrl) {
  try {
    if (!webhookUrl) {
      logger.warn('No webhook URL configured, skipping status webhook');
      return false;
    }

    const webhookPayload = {
      event: 'transaction_status_changed',
      timestamp: new Date().toISOString(),
      data: {
        signature: transactionData.signature,
        sender: transactionData.sender,
        receiver: transactionData.receiver,
        amountSOL: transactionData.amountSOL,
        amountUSD: transactionData.amountUSD,
        oldStatus: transactionData.oldStatus,
        newStatus: transactionData.status,
        blockTime: transactionData.blockTime,
        slot: transactionData.slot
      }
    };

    const response = await axios.post(webhookUrl, webhookPayload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCPayStream/1.0',
        'X-Webhook-Signature': generateWebhookSignature(webhookPayload)
      }
    });

    if (response.status >= 200 && response.status < 300) {
      logger.info(`Status webhook sent successfully to ${webhookUrl}`);
      return true;
    } else {
      logger.warn(`Status webhook returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error sending status webhook to ${webhookUrl}:`, error);
    return false;
  }
}

/**
 * Send webhook notification for daily summary
 * @param {Object} summaryData - Daily summary data
 * @param {string} webhookUrl - Webhook URL
 * @returns {Promise<boolean>} Success status
 */
export async function sendDailySummaryWebhook(summaryData, webhookUrl) {
  try {
    if (!webhookUrl) {
      logger.warn('No webhook URL configured, skipping daily summary webhook');
      return false;
    }

    const webhookPayload = {
      event: 'daily_summary',
      timestamp: new Date().toISOString(),
      data: {
        date: summaryData.date,
        walletAddress: summaryData.walletAddress,
        totalTransactions: summaryData.totalTransactions,
        totalReceivedSOL: summaryData.totalReceivedSOL,
        totalReceivedUSD: summaryData.totalReceivedUSD,
        averageAmountSOL: summaryData.averageAmountSOL,
        averageAmountUSD: summaryData.averageAmountUSD,
        uniqueSenders: summaryData.uniqueSenders,
        topSenders: summaryData.topSenders
      }
    };

    const response = await axios.post(webhookUrl, webhookPayload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCPayStream/1.0',
        'X-Webhook-Signature': generateWebhookSignature(webhookPayload)
      }
    });

    if (response.status >= 200 && response.status < 300) {
      logger.info(`Daily summary webhook sent successfully to ${webhookUrl}`);
      return true;
    } else {
      logger.warn(`Daily summary webhook returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error sending daily summary webhook to ${webhookUrl}:`, error);
    return false;
  }
}

/**
 * Send webhook notification for error events
 * @param {Object} errorData - Error data
 * @param {string} webhookUrl - Webhook URL
 * @returns {Promise<boolean>} Success status
 */
export async function sendErrorWebhook(errorData, webhookUrl) {
  try {
    if (!webhookUrl) {
      logger.warn('No webhook URL configured, skipping error webhook');
      return false;
    }

    const webhookPayload = {
      event: 'error_occurred',
      timestamp: new Date().toISOString(),
      data: {
        error: errorData.message,
        code: errorData.code,
        stack: errorData.stack,
        context: errorData.context,
        severity: errorData.severity || 'error'
      }
    };

    const response = await axios.post(webhookUrl, webhookPayload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCPayStream/1.0',
        'X-Webhook-Signature': generateWebhookSignature(webhookPayload)
      }
    });

    if (response.status >= 200 && response.status < 300) {
      logger.info(`Error webhook sent successfully to ${webhookUrl}`);
      return true;
    } else {
      logger.warn(`Error webhook returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error sending error webhook to ${webhookUrl}:`, error);
    return false;
  }
}

/**
 * Test webhook endpoint
 * @param {string} webhookUrl - Webhook URL to test
 * @returns {Promise<Object>} Test result
 */
export async function testWebhook(webhookUrl) {
  try {
    const testPayload = {
      event: 'webhook_test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from MCPayStream',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };

    const response = await axios.post(webhookUrl, testPayload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCPayStream/1.0',
        'X-Webhook-Signature': generateWebhookSignature(testPayload)
      }
    });

    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      responseTime: response.headers['x-response-time'] || 'unknown'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.response?.status
    };
  }
}

/**
 * Generate webhook signature for security
 * @param {Object} payload - Webhook payload
 * @returns {string} Generated signature
 */
function generateWebhookSignature(payload) {
  // In a production environment, you'd use a secret key to generate HMAC
  // For now, we'll use a simple hash
  const payloadString = JSON.stringify(payload);
  const timestamp = new Date().toISOString();
  
  // Simple signature - replace with proper HMAC in production
  return Buffer.from(`${payloadString}:${timestamp}`).toString('base64');
}

/**
 * Validate webhook signature
 * @param {Object} payload - Webhook payload
 * @param {string} signature - Received signature
 * @returns {boolean} True if valid
 */
export function validateWebhookSignature(payload, signature) {
  const expectedSignature = generateWebhookSignature(payload);
  return expectedSignature === signature;
}

/**
 * Retry webhook delivery with exponential backoff
 * @param {Function} webhookFunction - Webhook function to retry
 * @param {Array} args - Arguments for the webhook function
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<boolean>} Success status
 */
export async function retryWebhook(webhookFunction, args, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await webhookFunction(...args);
      if (result) {
        return true;
      }
    } catch (error) {
      logger.warn(`Webhook attempt ${attempt} failed:`, error.message);
    }

    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  logger.error(`Webhook failed after ${maxRetries} attempts`);
  return false;
}
