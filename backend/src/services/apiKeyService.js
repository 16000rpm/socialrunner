const prisma = require('../config/database');
const { encrypt, decrypt } = require('./encryptionService');

/**
 * Get all decrypted API keys
 * @returns {Object} - {youtubeApiKey, rapidApiKey}
 */
async function getApiKeys() {
  try {
    // Fetch all active API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { isActive: true }
    });

    const result = {};

    // Decrypt each key
    for (const apiKey of apiKeys) {
      try {
        const decrypted = decrypt(apiKey.key, apiKey.iv, apiKey.authTag);

        // Map platform to expected key names
        if (apiKey.platform === 'youtube') {
          result.youtubeApiKey = decrypted;
        } else if (apiKey.platform === 'rapidapi') {
          result.rapidApiKey = decrypted;
        }
      } catch (error) {
        console.error(`[API Key Service] Failed to decrypt ${apiKey.platform} key:`, error.message);
      }
    }

    return result;
  } catch (error) {
    console.error('[API Key Service] Failed to get API keys:', error.message);
    throw new Error('Failed to retrieve API keys');
  }
}

/**
 * Get API keys status (boolean map of which keys exist)
 * @returns {Object} - {youtubeApiKey: boolean, rapidApiKey: boolean}
 */
async function getApiKeysStatus() {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: { isActive: true },
      select: { platform: true }
    });

    const status = {
      youtubeApiKey: false,
      rapidApiKey: false
    };

    apiKeys.forEach(apiKey => {
      if (apiKey.platform === 'youtube') {
        status.youtubeApiKey = true;
      } else if (apiKey.platform === 'rapidapi') {
        status.rapidApiKey = true;
      }
    });

    return status;
  } catch (error) {
    console.error('[API Key Service] Failed to get API keys status:', error.message);
    throw new Error('Failed to retrieve API keys status');
  }
}

/**
 * Set or update an API key
 * @param {string} platform - Platform name ('youtube' or 'rapidapi')
 * @param {string} key - API key to store
 * @returns {Object} - Created/updated API key
 */
async function setApiKey(platform, key) {
  try {
    // Encrypt the key
    const { encrypted, iv, authTag } = encrypt(key);

    // Upsert (create or update)
    const apiKey = await prisma.apiKey.upsert({
      where: { platform },
      update: {
        key: encrypted,
        iv,
        authTag,
        updatedAt: new Date()
      },
      create: {
        platform,
        key: encrypted,
        iv,
        authTag
      }
    });

    console.log(`[API Key Service] API key for ${platform} has been set/updated`);

    return {
      platform: apiKey.platform,
      isActive: apiKey.isActive,
      updatedAt: apiKey.updatedAt
    };
  } catch (error) {
    console.error(`[API Key Service] Failed to set API key for ${platform}:`, error.message);
    throw new Error(`Failed to set API key for ${platform}`);
  }
}

module.exports = {
  getApiKeys,
  getApiKeysStatus,
  setApiKey
};
