/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Wearable Telemetry Routes: backend/src/routes/wearableRoutes.js
 */

const express = require('express');
const router = express.Router();
const wearableController = require('../controllers/wearableController');

// List paired devices (accessible openly for rapid prototype and testing)
router.get('/devices', wearableController.getAvailableDevices);

// Fetch simulated IoT wearable telemetry packet for device
router.get('/sync/:deviceType', wearableController.syncWearableTelemetry);

module.exports = router;
