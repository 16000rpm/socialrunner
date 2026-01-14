const apiKeyService = require('../services/apiKeyService');

/**
 * Get all API keys (decrypted)
 * GET /api/keys
 */
async function getKeys(req, res, next) {
  try {
    const keys = await apiKeyService.getApiKeys();

    res.status(200).json({
      success: true,
      ...keys
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get API keys status (boolean map)
 * GET /api/keys/status
 */
async function getKeysStatus(req, res, next) {
  try {
    const status = await apiKeyService.getApiKeysStatus();

    res.status(200).json({
      success: true,
      ...status
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getKeys,
  getKeysStatus
};
