/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Demo Scenario Routes: backend/src/routes/demoRoutes.js
 */

const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demoController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// POST /api/demo/scenario (Guarded by DEMO_MODE=true)
router.post('/scenario', demoController.setDemoScenario);

module.exports = router;
