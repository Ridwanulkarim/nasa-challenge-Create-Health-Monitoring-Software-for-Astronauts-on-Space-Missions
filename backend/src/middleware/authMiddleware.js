/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Authentication Middleware: backend/src/middleware/authMiddleware.js
 * 
 * Verifies JWT tokens on protected routes and attaches the user payload to req.user.
 */

const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'nasa_space_apps_2026_super_secret_jwt_key_987654321';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No authorization token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      astronautId: decoded.astronautId
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Authorization token has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authorization token.'
    });
  }
}

module.exports = authMiddleware;
