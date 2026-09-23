/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Alert Routes: backend/src/routes/alertRoutes.js
 */

const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/authMiddleware');
const { astronautOwnershipGuard } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Get alerts for astronaut
router.get('/:astronautId', astronautOwnershipGuard, alertController.getAlertsForAstronaut);

// Mark alert as read/acknowledged
router.patch('/:id/read', alertController.markAlertRead);

module.exports = router;
