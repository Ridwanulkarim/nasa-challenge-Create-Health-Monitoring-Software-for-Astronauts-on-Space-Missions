/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * NASA Research Routes: backend/src/routes/researchRoutes.js
 */

const express = require('express');
const router = express.Router();
const researchController = require('../controllers/researchController');

// Research data endpoint (public/accessible to all authenticated and anonymous clients)
router.get('/', researchController.getResearchData);

module.exports = router;
