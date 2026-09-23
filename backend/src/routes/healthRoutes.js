/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Health Telemetry Routes: backend/src/routes/healthRoutes.js
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const authMiddleware = require('../middleware/authMiddleware');
const { roleMiddleware, astronautOwnershipGuard } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Submit daily check-in (ASTRONAUT role only)
router.post('/', roleMiddleware(['ASTRONAUT']), healthController.submitHealthCheckin);

// Get latest telemetry for astronaut
router.get('/:astronautId/latest', astronautOwnershipGuard, healthController.getLatestHealth);

// Get historical telemetry table
router.get('/:astronautId/history', astronautOwnershipGuard, healthController.getHealthHistory);

// Get 14-day trends data for Chart.js
router.get('/:astronautId/trends', astronautOwnershipGuard, healthController.getHealthTrends);

module.exports = router;
