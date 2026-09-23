/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Main Express Application Server: backend/server.js
 * 
 * Configures onboard server, helmet security headers, CORS, static frontend
 * serving, API route handlers, and centralized error logging.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const astronautRoutes = require('./src/routes/astronautRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const alertRoutes = require('./src/routes/alertRoutes');
const missionControlRoutes = require('./src/routes/missionControlRoutes');
const researchRoutes = require('./src/routes/researchRoutes');
const demoRoutes = require('./src/routes/demoRoutes');
const wearableRoutes = require('./src/routes/wearableRoutes');
const countermeasureRoutes = require('./src/routes/countermeasureRoutes');
const dossierController = require('./src/controllers/dossierController');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with content security policy adapted for local assets
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Enable CORS for local testing
app.use(cors());

// Parse incoming JSON and URL-encoded request bodies
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets: prioritize React SPA (frontend/dist) if built, fallback to frontend/
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const frontendRawPath = path.join(__dirname, '../frontend');
const staticPath = fs.existsSync(path.join(frontendDistPath, 'index.html')) ? frontendDistPath : frontendRawPath;
app.use(express.static(staticPath));

// System Health Probe Endpoint
app.get('/api/health-check', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'Spacecraft Onboard Health Telemetry System',
    timestamp: new Date().toISOString(),
    onboardAutonomy: true,
    demoMode: process.env.DEMO_MODE === 'true'
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/astronauts', astronautRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/mission-control', missionControlRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/wearables', wearableRoutes);
app.use('/api/countermeasures', countermeasureRoutes);
app.get('/api/dossier/:astronautId?', dossierController.getClinicalDossier);

// Fallback route for Single Page Application navigation
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.originalUrl}`
    });
  }
  // Serve static index.html for non-API routes (SPA routing)
  const indexPath = path.join(staticPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If frontend index.html not yet created, return status JSON
      res.status(200).json({
        message: 'Spacecraft Onboard Telemetry Server is running.',
        apiDoc: '/api/health-check',
        auth: '/api/auth/login'
      });
    }
  });
});

// Centralized error handling
app.use(errorHandler);

// Start server and test database connectivity
async function startServer() {
  await testConnection();
  app.listen(PORT, () => {
    console.log('================================================================');
    console.log(`  SPACECRAFT HEALTH TELEMETRY SERVER ACTIVE`);
    console.log(`  Listening on: http://localhost:${PORT}`);
    console.log(`  Environment:  ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Demo Mode:    ${process.env.DEMO_MODE || 'true'}`);
    console.log('================================================================');
  });
}

// Start if executed directly
if (require.main === module) {
  startServer();
}

module.exports = app;
