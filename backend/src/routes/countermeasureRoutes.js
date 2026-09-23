/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Countermeasure Routes: backend/src/routes/countermeasureRoutes.js
 */

const express = require('express');
const router = express.Router();
const countermeasureController = require('../controllers/countermeasureController');
const authMiddleware = require('../middleware/authMiddleware');

// Optional auth for demo compatibility: if token present, attach user
router.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  next();
});

router.get('/active', countermeasureController.getActiveCountermeasures);
router.post('/log', countermeasureController.logCountermeasureCompletion);
router.post('/reset', countermeasureController.resetCountermeasures);

module.exports = router;
