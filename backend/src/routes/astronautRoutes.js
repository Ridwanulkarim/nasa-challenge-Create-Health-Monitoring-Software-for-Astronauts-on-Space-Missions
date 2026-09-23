/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Astronaut Routes: backend/src/routes/astronautRoutes.js
 */

const express = require('express');
const router = express.Router();
const astronautController = require('../controllers/astronautController');
const authMiddleware = require('../middleware/authMiddleware');
const { astronautOwnershipGuard } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Get current astronaut's profile
router.get('/me', astronautController.getMyProfile);
router.patch('/me', astronautController.updateMyProfile);

// Get specific astronaut's profile (guarded by ownership or Mission Control)
router.get('/:id', astronautOwnershipGuard, astronautController.getAstronautById);

module.exports = router;
