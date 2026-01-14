const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = Buffer.from(process.env.API_KEY_ENCRYPTION_KEY || '', 'hex');

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('API_KEY_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @param {string} plaintext - Text to encrypt
 * @returns {Object} - {encrypted, iv, authTag} all as hex strings
 */
function encrypt(plaintext) {
  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    // Encrypt the plaintext
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('[Encryption Service] Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param {string} encrypted - Hex string of encrypted data
 * @param {string} ivHex - Hex string of initialization vector
 * @param {string} authTagHex - Hex string of authentication tag
 * @returns {string} - Decrypted plaintext
 */
function decrypt(encrypted, ivHex, authTagHex) {
  try {
    // Convert hex strings to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Encryption Service] Decryption failed:', error);
    throw new Error('Decryption failed - data may be corrupted or tampered');
  }
}

module.exports = {
  encrypt,
  decrypt
};
