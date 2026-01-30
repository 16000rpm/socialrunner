const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validation rules
const googleAuthValidation = [
  body('idToken')
    .notEmpty()
    .withMessage('Google ID token required')
];

// Routes
router.post('/google', authLimiter, googleAuthValidation, validate, authController.googleAuth);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
