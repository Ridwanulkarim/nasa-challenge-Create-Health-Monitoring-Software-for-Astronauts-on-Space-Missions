/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Centralized Error Handling Middleware: backend/src/middleware/errorHandler.js
 */

function errorHandler(err, req, res, next) {
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal onboard server error.';

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
