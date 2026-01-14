/**
 * Global error handler middleware
 * Catches errors and returns consistent JSON responses
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Default error response
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: message
  });
}

module.exports = { errorHandler };
