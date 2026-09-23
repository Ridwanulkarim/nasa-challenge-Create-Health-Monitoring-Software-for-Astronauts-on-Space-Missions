/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Authentication Routes: backend/src/routes/authRoutes.js
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route: Login
router.post('/login', authController.login);

// Protected route: Current session profile
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
