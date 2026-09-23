/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Mission Control Routes: backend/src/routes/missionControlRoutes.js
 */

const express = require('express');
const router = express.Router();
const missionControlController = require('../controllers/missionControlController');
const authMiddleware = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

// All Mission Control routes require JWT auth and MISSION_CONTROL role
router.use(authMiddleware);
router.use(roleMiddleware(['MISSION_CONTROL']));

// Fleet overview roster with health statuses
router.get('/astronauts', missionControlController.getFleetOverview);

// Individual astronaut health telemetry drill-down
router.get('/astronauts/:id/health', missionControlController.getAstronautHealthDetail);

// Fleet-wide active alerts
router.get('/alerts', missionControlController.getFleetAlerts);

module.exports = router;
