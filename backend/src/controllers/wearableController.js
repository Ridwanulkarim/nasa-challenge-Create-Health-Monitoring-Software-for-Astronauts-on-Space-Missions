/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Wearable Biosensor Controller: backend/src/controllers/wearableController.js
 * 
 * Simulates high-frequency IoT telemetry ingestion from astronaut-worn
 * commercial and spaceflight biometrics (WHOOP 4.0 Strap, Fitbit Sense).
 * Automatically populates objective physiological indicators (Heart Rate,
 * SpO2, Temperature, Sleep, Exercise) without manual astronaut typing.
 */

const { pool } = require('../config/db');

/**
 * Returns list of paired astronaut wearables and their status
 * GET /api/wearables/devices
 */
async function getAvailableDevices(req, res) {
  try {
    const devices = [
      {
        id: 'whoop_4',
        name: 'WHOOP 4.0 Bio-Strap',
        vendor: 'WHOOP Inc. (Human Performance System)',
        type: 'WHOOP',
        model: 'Spacecraft Certified 4.0 Strap',
        battery: 94,
        status: 'CONNECTED',
        protocol: 'BLE 5.3 Spacecraft Mesh',
        samplingRate: '100 Hz continuous',
        sensors: ['5 LED PPG Array', 'Skin Temperature Sensor', '3-Axis Accelerometer'],
        lastSync: new Date(Date.now() - 45000).toISOString(),
        accentColor: '#00f0ff'
      },
      {
        id: 'fitbit_sense',
        name: 'Fitbit Sense Bio-Tracker',
        vendor: 'Fitbit / Google',
        type: 'FITBIT',
        model: 'Advanced Health Smartwatch',
        battery: 88,
        status: 'CONNECTED',
        protocol: 'BLE 5.0 Local Sync',
        samplingRate: 'Multi-path continuous',
        sensors: ['Multi-path Optical HR', 'Red/Infrared SpO2', 'cEDA Stress Sensor', 'Skin Temp'],
        lastSync: new Date(Date.now() - 120000).toISOString(),
        accentColor: '#00e676'
      }
    ];

    res.status(200).json({
      success: true,
      totalDevices: devices.length,
      activeDevice: 'whoop_4',
      devices
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Ingests live telemetry stream from specified wearable
 * GET /api/wearables/sync/:deviceType
 */
async function syncWearableTelemetry(req, res) {
  try {
    const deviceType = (req.params.deviceType || 'whoop').toLowerCase();
    const astronautId = req.user ? req.user.astronautId : 'AST-001';

    // 1. Determine astronaut's current operational state from recent records
    let currentScenario = 'NORMAL';
    try {
      const [rows] = await pool.query(
        `SELECT overall_status FROM health_records WHERE astronaut_id = ? ORDER BY record_date DESC, created_at DESC LIMIT 1;`,
        [astronautId]
      );
      if (rows.length > 0 && rows[0].overall_status) {
        currentScenario = rows[0].overall_status;
      }
    } catch {
      // fallback to nominal
    }

    // Small jitter to simulate real continuous physiological sensor sampling
    const jitter = (Math.random() - 0.5) * 1.5;

    let telemetry = {};

    if (deviceType.includes('whoop')) {
      // WHOOP 4.0 Profile
      if (currentScenario === 'CRITICAL') {
        telemetry = {
          heart_rate: Math.round(116 + jitter * 2),
          spo2: +(88.5 + jitter * 0.4).toFixed(1),
          body_temp: +(38.2 + jitter * 0.1).toFixed(1),
          sleep_duration: +(4.2 + jitter * 0.2).toFixed(1),
          exercise_duration: 0.5,
          hrv_ms: Math.round(24 + jitter),
          recovery_score: 18,
          strain_score: 18.4,
          skin_temp_deviation: '+1.4°C'
        };
      } else if (currentScenario === 'WARNING') {
        telemetry = {
          heart_rate: Math.round(92 + jitter * 2),
          spo2: +(95.0 + jitter * 0.3).toFixed(1),
          body_temp: +(37.4 + jitter * 0.1).toFixed(1),
          sleep_duration: +(5.2 + jitter * 0.2).toFixed(1),
          exercise_duration: 1.0,
          hrv_ms: Math.round(42 + jitter),
          recovery_score: 41,
          strain_score: 16.8,
          skin_temp_deviation: '+0.6°C'
        };
      } else {
        // Nominal
        telemetry = {
          heart_rate: Math.round(71 + jitter * 2),
          spo2: +(98.2 + (Math.random() * 0.6)).toFixed(1),
          body_temp: +(36.7 + jitter * 0.1).toFixed(1),
          sleep_duration: +(7.6 + jitter * 0.1).toFixed(1),
          exercise_duration: +(2.1 + jitter * 0.1).toFixed(1),
          hrv_ms: Math.round(68 + jitter * 2),
          recovery_score: 88,
          strain_score: 13.5,
          skin_temp_deviation: '+0.1°C'
        };
      }

      return res.status(200).json({
        success: true,
        device: {
          id: 'whoop_4',
          name: 'WHOOP 4.0 Bio-Strap',
          type: 'WHOOP',
          battery: 93,
          firmware: 'v4.18.2-Astro',
          sensorTechnology: '5-LED Optical PPG & Galvanic Array'
        },
        syncTimestamp: new Date().toISOString(),
        packetId: `PKT-WHP-${Date.now().toString(36).toUpperCase()}`,
        telemetry
      });

    } else {
      // Fitbit Sense Profile
      if (currentScenario === 'CRITICAL') {
        telemetry = {
          heart_rate: Math.round(114 + jitter * 2),
          spo2: +(89.0 + jitter * 0.4).toFixed(1),
          body_temp: +(38.1 + jitter * 0.1).toFixed(1),
          sleep_duration: +(4.4 + jitter * 0.2).toFixed(1),
          exercise_duration: 0.6,
          daily_steps: 3200,
          eda_stress_score: 22,
          active_zone_minutes: 18
        };
      } else if (currentScenario === 'WARNING') {
        telemetry = {
          heart_rate: Math.round(90 + jitter * 2),
          spo2: +(95.2 + jitter * 0.3).toFixed(1),
          body_temp: +(37.3 + jitter * 0.1).toFixed(1),
          sleep_duration: +(5.4 + jitter * 0.2).toFixed(1),
          exercise_duration: 1.1,
          daily_steps: 6400,
          eda_stress_score: 45,
          active_zone_minutes: 42
        };
      } else {
        // Nominal
        telemetry = {
          heart_rate: Math.round(72 + jitter * 2),
          spo2: +(98.0 + (Math.random() * 0.5)).toFixed(1),
          body_temp: +(36.8 + jitter * 0.1).toFixed(1),
          sleep_duration: +(7.4 + jitter * 0.1).toFixed(1),
          exercise_duration: +(2.0 + jitter * 0.1).toFixed(1),
          daily_steps: 11250,
          eda_stress_score: 84,
          active_zone_minutes: 95
        };
      }

      return res.status(200).json({
        success: true,
        device: {
          id: 'fitbit_sense',
          name: 'Fitbit Sense Bio-Tracker',
          type: 'FITBIT',
          battery: 87,
          firmware: 'v62.4.1-Orbit',
          sensorTechnology: 'Multi-Path Optical Array & cEDA'
        },
        syncTimestamp: new Date().toISOString(),
        packetId: `PKT-FIT-${Date.now().toString(36).toUpperCase()}`,
        telemetry
      });
    }

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAvailableDevices,
  syncWearableTelemetry
};
