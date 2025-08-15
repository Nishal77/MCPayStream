import QRCode from 'qrcode';
import logger from './logger.js';

/**
 * Generate QR code for wallet address
 * @param {string} address - Wallet address
 * @param {Object} options - QR code options
 * @returns {Promise<string>} Base64 encoded QR code
 */
export async function generateWalletQRCode(address, options = {}) {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256,
      ...options
    };

    const qrCodeDataURL = await QRCode.toDataURL(address, defaultOptions);
    
    logger.info(`QR code generated for wallet: ${address}`);
    return qrCodeDataURL;
  } catch (error) {
    logger.error(`Error generating QR code for wallet ${address}:`, error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Generate QR code with custom styling
 * @param {string} address - Wallet address
 * @param {Object} styling - Custom styling options
 * @returns {Promise<string>} Base64 encoded QR code
 */
export async function generateStyledQRCode(address, styling = {}) {
  try {
    const {
      foreground = '#1E293B', // Dark blue
      background = '#FFFFFF',
      logo = null,
      logoSize = 0.2,
      cornerSquareColor = '#3B82F6', // Blue
      cornerDotColor = '#3B82F6',
      dotsStyle = 'dots',
      cornersSquareStyle = 'extra-rounded',
      cornersDotStyle = 'dot'
    } = styling;

    const options = {
      errorCorrectionLevel: 'H', // Higher error correction for logo
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300,
      color: {
        dark: foreground,
        light: background
      },
      rendererOpts: {
        quality: 1
      }
    };

    let qrCodeDataURL = await QRCode.toDataURL(address, options);
    
    // If logo is provided, overlay it on the QR code
    if (logo) {
      qrCodeDataURL = await overlayLogoOnQRCode(qrCodeDataURL, logo, logoSize);
    }

    logger.info(`Styled QR code generated for wallet: ${address}`);
    return qrCodeDataURL;
  } catch (error) {
    logger.error(`Error generating styled QR code for wallet ${address}:`, error);
    throw new Error(`Failed to generate styled QR code: ${error.message}`);
  }
}

/**
 * Generate QR code for payment request
 * @param {Object} paymentData - Payment request data
 * @returns {Promise<string>} Base64 encoded QR code
 */
export async function generatePaymentQRCode(paymentData) {
  try {
    const {
      address,
      amount,
      memo = '',
      reference = ''
    } = paymentData;

    // Create Solana payment URL
    const paymentURL = `solana:${address}?amount=${amount}&memo=${encodeURIComponent(memo)}&reference=${encodeURIComponent(reference)}`;
    
    const qrCodeDataURL = await QRCode.toDataURL(paymentURL, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 256,
      color: {
        dark: '#14B8A6', // Teal color for payments
        light: '#FFFFFF'
      }
    });

    logger.info(`Payment QR code generated for wallet: ${address}`);
    return qrCodeDataURL;
  } catch (error) {
    logger.error(`Error generating payment QR code:`, error);
    throw new Error(`Failed to generate payment QR code: ${error.message}`);
  }
}

/**
 * Generate QR code for wallet connection
 * @param {Object} connectionData - Wallet connection data
 * @returns {Promise<string>} Base64 encoded QR code
 */
export async function generateConnectionQRCode(connectionData) {
  try {
    const {
      address,
      name = '',
      description = '',
      website = ''
    } = connectionData;

    // Create wallet connection data
    const connectionInfo = {
      type: 'wallet_connection',
      address,
      name,
      description,
      website,
      timestamp: new Date().toISOString()
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(connectionInfo), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 256,
      color: {
        dark: '#8B5CF6', // Purple color for connections
        light: '#FFFFFF'
      }
    });

    logger.info(`Connection QR code generated for wallet: ${address}`);
    return qrCodeDataURL;
  } catch (error) {
    logger.error(`Error generating connection QR code:`, error);
    throw new Error(`Failed to generate connection QR code: ${error.message}`);
  }
}

/**
 * Generate QR code with custom colors
 * @param {string} data - Data to encode
 * @param {Object} colors - Color scheme
 * @returns {Promise<string>} Base64 encoded QR code
 */
export async function generateCustomColorQRCode(data, colors = {}) {
  try {
    const {
      primary = '#3B82F6',    // Blue
      secondary = '#1E293B',  // Dark blue
      accent = '#10B981',     // Green
      background = '#FFFFFF'  // White
    } = colors;

    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 256,
      color: {
        dark: primary,
        light: background
      }
    });

    logger.info('Custom color QR code generated');
    return qrCodeDataURL;
  } catch (error) {
    logger.error('Error generating custom color QR code:', error);
    throw new Error(`Failed to generate custom color QR code: ${error.message}`);
  }
}

/**
 * Generate QR code for different sizes
 * @param {string} data - Data to encode
 * @param {string} size - Size preset ('small', 'medium', 'large', 'xlarge')
 * @returns {Promise<string>} Base64 encoded QR code
 */
export async function generateSizedQRCode(data, size = 'medium') {
  try {
    const sizeMap = {
      small: 128,
      medium: 256,
      large: 512,
      xlarge: 1024
    };

    const width = sizeMap[size] || sizeMap.medium;

    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    logger.info(`Sized QR code generated (${size}: ${width}x${width})`);
    return qrCodeDataURL;
  } catch (error) {
    logger.error('Error generating sized QR code:', error);
    throw new Error(`Failed to generate sized QR code: ${error.message}`);
  }
}

/**
 * Validate QR code data
 * @param {string} data - Data to validate
 * @returns {boolean} True if valid
 */
export function validateQRCodeData(data) {
  if (!data || typeof data !== 'string') {
    return false;
  }

  // Check if data is too long for QR code
  if (data.length > 2953) {
    return false;
  }

  return true;
}

/**
 * Get QR code information
 * @param {string} data - Data that would be encoded
 * @returns {Object} QR code information
 */
export function getQRCodeInfo(data) {
  if (!validateQRCodeData(data)) {
    return {
      valid: false,
      error: 'Invalid data for QR code'
    };
  }

  const dataLength = data.length;
  const estimatedSize = Math.ceil(dataLength / 100) * 100; // Rough estimation

  return {
    valid: true,
    dataLength,
    estimatedSize,
    maxCapacity: 2953,
    recommendedSize: dataLength < 100 ? 'small' : 
                    dataLength < 500 ? 'medium' : 
                    dataLength < 1500 ? 'large' : 'xlarge'
  };
}

/**
 * Helper function to overlay logo on QR code (placeholder)
 * @param {string} qrCodeDataURL - Base64 QR code
 * @param {string} logoDataURL - Base64 logo
 * @param {number} logoSize - Logo size as fraction of QR code
 * @returns {Promise<string>} QR code with logo overlay
 */
async function overlayLogoOnQRCode(qrCodeDataURL, logoDataURL, logoSize = 0.2) {
  // This is a placeholder - in a real implementation, you'd use a canvas
  // to overlay the logo on the QR code
  logger.warn('Logo overlay not implemented - returning original QR code');
  return qrCodeDataURL;
}
