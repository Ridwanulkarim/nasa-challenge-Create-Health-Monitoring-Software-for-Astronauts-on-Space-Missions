/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Countermeasure Engine Controller: backend/src/controllers/countermeasureController.js
 * 
 * Fulfills the NASA requirement: "enables astronauts to evaluate and ACT on the status of their health".
 * Dynamically prescribes clinical, exercise, and physiological countermeasures
 * based on evaluated telemetry, and tracks crew protocol compliance.
 */

const { pool } = require('../config/db');

// Ensure countermeasure_logs table exists
async function initCountermeasureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS countermeasure_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        astronaut_id VARCHAR(32) NOT NULL,
        protocol_id VARCHAR(64) NOT NULL,
        protocol_title VARCHAR(255) NOT NULL,
        category VARCHAR(64) NOT NULL,
        duration_minutes INT DEFAULT 30,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        INDEX idx_cm_astro (astronaut_id, completed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.warn('[DB] Countermeasure table init note:', err.message);
  }
}

initCountermeasureTable();

/**
 * GET /api/countermeasures/active
 * Returns dynamic countermeasure prescriptions based on current health status and symptoms
 */
async function getActiveCountermeasures(req, res) {
  try {
    const astronautId = req.user ? req.user.astronautId : 'AST-001';

    // 1. Fetch latest health record
    let latestRecord = null;
    try {
      const [rows] = await pool.query(
        `SELECT record_id, record_date, mission_day, overall_status, evaluation_summary FROM health_records WHERE astronaut_id = ? ORDER BY record_date DESC, created_at DESC LIMIT 1;`,
        [astronautId]
      );
      if (rows.length > 0) latestRecord = rows[0];
    } catch (e) {
      // fallback
    }

    // 2. Fetch today's completed logs
    let completedProtocolIds = new Set();
    try {
      const [logs] = await pool.query(
        `SELECT protocol_id FROM countermeasure_logs WHERE astronaut_id = ? AND DATE(completed_at) = CURDATE();`,
        [astronautId]
      );
      logs.forEach(l => completedProtocolIds.add(l.protocol_id));
    } catch (e) {
      // fallback
    }

    const overallStatus = latestRecord ? latestRecord.overall_status : 'NORMAL';

    // 3. Generate tailored aerospace countermeasures
    const protocols = [];

    // Protocol 1: Musculoskeletal ARED Resistive Exercise
    protocols.push({
      id: 'CM-ARED-01',
      title: 'ARED High-Resistance Leg Press & Deadlifts',
      category: 'EXERCISE_RESISTIVE',
      urgency: overallStatus === 'CRITICAL' ? 'URGENT' : 'REQUIRED',
      durationMinutes: 45,
      targetSystem: 'Skeletal & Muscle Mass',
      description: 'Perform 4 sets of 10 repetitions at 75% body-equivalent load to mitigate microgravity bone mineral density loss and postural muscle atrophy.',
      rationale: 'NASA HRP Standard: Counteracts lower limb muscle cross-sectional area reduction in zero-G.',
      completed: completedProtocolIds.has('CM-ARED-01')
    });

    // Protocol 2: Cardiovascular Aerobic Cycle or T2 Treadmill
    protocols.push({
      id: 'CM-T2-02',
      title: 'T2 Colbert Treadmill / CEVIS Interval Cycle',
      category: 'EXERCISE_AEROBIC',
      urgency: 'REQUIRED',
      durationMinutes: 30,
      targetSystem: 'Cardiovascular Conditioning',
      description: 'Perform 30 minutes of aerobic interval training at 70-85% VO2 max with harness bungee tethering.',
      rationale: 'Maintains stroke volume and orthostatic tolerance upon planetary re-entry.',
      completed: completedProtocolIds.has('CM-T2-02')
    });

    // Protocol 3: Fluid Shift & SANS Countermeasure (Lower Body Negative Pressure)
    if (overallStatus === 'CRITICAL' || overallStatus === 'WARNING') {
      protocols.push({
        id: 'CM-LBNP-03',
        title: 'Chibis Lower Body Negative Pressure (LBNP) Session',
        category: 'PHYSIOLOGICAL_FLUID',
        urgency: 'CRITICAL',
        durationMinutes: 25,
        targetSystem: 'Cephalic Venous Decompression / SANS',
        description: 'Seal into LBNP chamber at 25-35 mmHg negative pressure to draw pooled cephalic blood and interstitial fluid back to caudal vessels.',
        rationale: 'Relieves intracranial pressure and retrobulbar optic nerve swelling associated with SANS.',
        completed: completedProtocolIds.has('CM-LBNP-03')
      });
    }

    // Protocol 4: Hyper-Hydration Electrolyte Replenishment
    protocols.push({
      id: 'CM-HYDR-04',
      title: 'Electrolyte Mineral Rehydration Infusion',
      category: 'HYDRATION_NUTRITION',
      urgency: overallStatus === 'CRITICAL' ? 'URGENT' : 'ROUTINE',
      durationMinutes: 10,
      targetSystem: 'Plasma Volume Maintenance',
      description: 'Consume 500 mL water fortified with sodium chloride and potassium citrate hydration pouch from ECLSS supply.',
      rationale: 'Expands circulating plasma volume and prevents microgravity hypovolemia.',
      completed: completedProtocolIds.has('CM-HYDR-04')
    });

    // Protocol 5: Circadian Light & Cognitive Hygiene Protocol
    protocols.push({
      id: 'CM-CIRC-05',
      title: 'Spectrally Filtered Circadian Phase Shifting',
      category: 'BEHAVIORAL_COGNITIVE',
      urgency: 'ROUTINE',
      durationMinutes: 20,
      targetSystem: 'Circadian Rhythm & Neuro-fatigue',
      description: 'Engage in 20-minute blue-attenuated (650nm) cabin lighting session followed by 15-minute autonomous mindfulness relaxation.',
      rationale: 'Regulates melatonin secretion during orbital sunrise/sunset cycles (16 sunsets per 24 hours).',
      completed: completedProtocolIds.has('CM-CIRC-05')
    });

    // Calculate daily compliance score
    const completedCount = protocols.filter(p => p.completed).length;
    const complianceScore = Math.round((completedCount / protocols.length) * 100);

    res.status(200).json({
      success: true,
      astronautId,
      missionDay: latestRecord ? latestRecord.mission_day : 23,
      overallStatus,
      totalProtocols: protocols.length,
      completedProtocols: completedCount,
      complianceScore,
      protocols
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/countermeasures/log
 * Astronaut marks a countermeasure protocol as completed
 */
async function logCountermeasureCompletion(req, res) {
  try {
    const astronautId = req.user ? req.user.astronautId : 'AST-001';
    const { protocol_id, protocol_title, category, duration_minutes, notes } = req.body;

    if (!protocol_id) {
      return res.status(400).json({ success: false, error: 'Protocol ID is required.' });
    }

    // Insert completion log
    await pool.query(
      `INSERT INTO countermeasure_logs (astronaut_id, protocol_id, protocol_title, category, duration_minutes, notes) VALUES (?, ?, ?, ?, ?, ?);`,
      [
        astronautId,
        protocol_id,
        protocol_title || 'Autonomous Spaceflight Countermeasure',
        category || 'EXERCISE',
        duration_minutes || 30,
        notes || 'Verified by astronaut on orbit'
      ]
    );

    res.status(201).json({
      success: true,
      message: `Protocol ${protocol_id} successfully verified and logged onboard.`,
      loggedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getActiveCountermeasures,
  logCountermeasureCompletion
};
