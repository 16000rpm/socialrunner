const { validationResult } = require('express-validator');

/**
 * Middleware to check validation results from express-validator
 * Returns 400 if validation fails
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  next();
}

module.exports = { validate };
