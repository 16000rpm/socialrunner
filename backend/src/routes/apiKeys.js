const express = require('express');
const apiKeyController = require('../controllers/apiKeyController');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(apiLimiter);

// Routes
router.get('/', apiKeyController.getKeys);
router.get('/status', apiKeyController.getKeysStatus);

module.exports = router;
