/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Demo Scenario Controller: backend/src/controllers/demoController.js
 * 
 * Switches simulated scenarios (NORMAL, WARNING, CRITICAL) for demonstration.
 * Operates ONLY when DEMO_MODE=true in environment configuration.
 */

const { pool } = require('../config/db');

/**
 * Regenerates the authenticated astronaut's last 15 days of records
 * to visibly trigger the selected scenario's baselines, trends, and alerts.
 * POST /api/demo/scenario
 */
async function setDemoScenario(req, res, next) {
  const conn = await pool.getConnection();
  try {
    // 1. Verify DEMO_MODE flag
    if (process.env.DEMO_MODE !== 'true') {
      return res.status(403).json({
        success: false,
        error: 'Demo scenario switching is disabled in production mode. Set DEMO_MODE=true to enable.'
      });
    }

    const { scenario } = req.body;
    if (!['NORMAL', 'WARNING', 'CRITICAL'].includes(scenario)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scenario. Allowed values: NORMAL, WARNING, CRITICAL.'
      });
    }

    const astronautId = req.user.astronautId || req.body.astronaut_id || 'AST-001';

    await conn.beginTransaction();

    // 2. Clear existing records for this astronaut
    const [existingRecords] = await conn.query(
      `SELECT record_id FROM health_records WHERE astronaut_id = ?;`,
      [astronautId]
    );

    for (const r of existingRecords) {
      await conn.query(`DELETE FROM alerts WHERE record_id = ?;`, [r.record_id]);
      await conn.query(`DELETE FROM record_symptoms WHERE record_id = ?;`, [r.record_id]);
      await conn.query(`DELETE FROM behavioral_checkins WHERE record_id = ?;`, [r.record_id]);
      await conn.query(`DELETE FROM radiation_records WHERE record_id = ?;`, [r.record_id]);
      await conn.query(`DELETE FROM health_record_values WHERE record_id = ?;`, [r.record_id]);
    }
    await conn.query(`DELETE FROM health_records WHERE astronaut_id = ?;`, [astronautId]);

    // 3. Generate 15 Days of telemetry tailored to the chosen scenario
    const baseDate = new Date(Date.now() - 14 * 86400000);
    const totalDays = 15;
    let cumulativeRad = 5.2;

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const recDate = new Date(baseDate.getTime() + dayOffset * 86400000);
      const dateStr = recDate.toISOString().slice(0, 10);
      const missionDay = 7 + dayOffset;
      const recordId = `rec-${astronautId}-${dateStr}`;

      // Default baseline values
      let hr = 72;
      let spo2 = 98;
      let sys = 118;
      let dia = 76;
      let temp = 36.8;
      let weight = 75.0;
      let sleep = 7.5;
      let exercise = 2.0;
      let hydration = 2.8;
      let dailyRad = 0.42;
      cumulativeRad += dailyRad;

      let mood = 'GOOD';
      let stress = 'LOW';
      let loneliness = 'NOT_AT_ALL';
      let overallStatus = 'NORMAL';
      let summary = 'All physiological vitals and lifestyle indicators nominal within personal baseline limits.';
      let symptomsList = [];

      // Apply Scenario Tweaks
      if (scenario === 'WARNING') {
        // Multi-day sleep trend (< 6.0h for last 3 days) + elevated HR (+22% above 72 baseline)
        if (dayOffset === 12) {
          sleep = 5.2;
          stress = 'MEDIUM';
        } else if (dayOffset === 13) {
          sleep = 4.8;
          stress = 'HIGH';
          mood = 'LOW';
          symptomsList.push({ id: 'FATIGUE', sev: 'MILD' });
        } else if (dayOffset === 14) { // Today
          sleep = 4.4; // 3 consecutive days < 6.0h!
          hr = 88;     // 88 BPM (+22.2% above baseline of 72 BPM)
          stress = 'HIGH';
          mood = 'LOW';
          overallStatus = 'WARNING';
          summary = 'WARNING: Multi-day sleep deficit detected (3 consecutive days < 6.0h). Resting heart rate +22.2% above personal baseline.';
          symptomsList.push({ id: 'FATIGUE', sev: 'MODERATE' });
          symptomsList.push({ id: 'HEADACHE', sev: 'MILD' });
        }
      } else if (scenario === 'CRITICAL') {
        // Sudden drop on Day 14 (Today)
        if (dayOffset === 14) {
          spo2 = 89; // Drops below 90%
          hr = 104;  // Elevated
          sys = 135;
          temp = 37.4;
          stress = 'HIGH';
          mood = 'LOW';
          overallStatus = 'CRITICAL';
          summary = 'CRITICAL ALERT: SpO₂ has fallen below the configured critical rule (89%). Follow applicable emergency protocol.';
          symptomsList.push({ id: 'NAUSEA', sev: 'MODERATE' });
          symptomsList.push({ id: 'DIZZINESS', sev: 'MODERATE' });
        }
      }

      // Insert Master Record
      await conn.query(`
        INSERT INTO health_records (record_id, astronaut_id, record_date, mission_day, overall_status, evaluation_summary, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `, [recordId, astronautId, dateStr, missionDay, overallStatus, summary, `Scenario [${scenario}] data.`]);

      // Insert Indicator Values
      const values = [
        { ind: 'HEART_RATE', val: hr, status: (hr > 100 || (scenario === 'WARNING' && dayOffset === 14)) ? 'WARNING' : 'NORMAL' },
        { ind: 'SPO2', val: spo2, status: spo2 < 90 ? 'CRITICAL' : (spo2 < 94 ? 'WARNING' : 'NORMAL') },
        { ind: 'BP_SYSTOLIC', val: sys, status: sys > 140 ? 'WARNING' : 'NORMAL' },
        { ind: 'BP_DIASTOLIC', val: dia, status: 'NORMAL' },
        { ind: 'BODY_TEMP', val: temp, status: temp > 38.0 ? 'WARNING' : 'NORMAL' },
        { ind: 'BODY_WEIGHT', val: weight, status: 'NORMAL' },
        { ind: 'SLEEP_DURATION', val: sleep, status: (scenario === 'WARNING' && dayOffset === 14) ? 'WARNING' : 'NORMAL' },
        { ind: 'EXERCISE_DURATION', val: exercise, status: 'NORMAL' },
        { ind: 'HYDRATION', val: hydration, status: 'NORMAL' },
        { ind: 'RADIATION_DOSE', val: dailyRad, status: 'NORMAL' }
      ];

      for (const v of values) {
        let baselineVal = null;
        let devPct = null;
        if (dayOffset === 14 && v.ind === 'HEART_RATE') {
          baselineVal = 72.0;
          devPct = Math.round(((v.val - baselineVal) / baselineVal) * 1000) / 10;
        } else if (dayOffset === 14 && v.ind === 'SPO2') {
          baselineVal = 98.0;
          devPct = Math.round(((v.val - baselineVal) / baselineVal) * 1000) / 10;
        }

        await conn.query(`
          INSERT INTO health_record_values (value_id, record_id, indicator_id, value_numeric, status, baseline_value, deviation_pct)
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `, [`val-${recordId}-${v.ind}`, recordId, v.ind, v.val, v.status, baselineVal, devPct]);
      }

      // Insert Behavioral
      await conn.query(`
        INSERT INTO behavioral_checkins (checkin_id, record_id, mood, stress_level, loneliness_level, crew_connection, concentration_difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `, [`beh-${recordId}`, recordId, mood, stress, loneliness, 'STRONG', false]);

      // Insert Radiation
      await conn.query(`
        INSERT INTO radiation_records (radiation_id, record_id, simulated_daily_dose_msv, simulated_cumulative_dose_msv, is_simulated, notes)
        VALUES (?, ?, ?, ?, ?, ?);
      `, [`rad-${recordId}`, recordId, dailyRad, cumulativeRad, true, 'SIMULATED RADIATION DATA']);

      // Insert Symptoms
      for (const sym of symptomsList) {
        await conn.query(`
          INSERT INTO record_symptoms (id, record_id, symptom_id, severity_level, notes)
          VALUES (?, ?, ?, ?, ?);
        `, [`rsym-${recordId}-${sym.id}`, recordId, sym.id, sym.sev, 'Demo scenario reported symptom']);
      }

      // Insert Alerts for Today (Day 14)
      if (dayOffset === 14) {
        if (scenario === 'WARNING') {
          await conn.query(`
            INSERT INTO alerts (alert_id, astronaut_id, record_id, indicator_id, current_value, reason, severity, recommended_action, is_read)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE);
          `, [
            `alt-${recordId}-sleep`,
            astronautId,
            recordId,
            'SLEEP_DURATION',
            `${sleep} hrs`,
            'Sleep duration has remained below the configured monitoring level for 3 consecutive days.',
            'WARNING',
            'Recheck the indicator and follow the applicable mission health protocol.'
          ]);

          await conn.query(`
            INSERT INTO alerts (alert_id, astronaut_id, record_id, indicator_id, current_value, reason, severity, recommended_action, is_read)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE);
          `, [
            `alt-${recordId}-hr`,
            astronautId,
            recordId,
            'HEART_RATE',
            `${hr} BPM (+22.2% dev)`,
            'Heart rate deviated by more than 20% from personal 14-day baseline.',
            'WARNING',
            'Recheck the indicator and follow the applicable mission health protocol.'
          ]);
        } else if (scenario === 'CRITICAL') {
          await conn.query(`
            INSERT INTO alerts (alert_id, astronaut_id, record_id, indicator_id, current_value, reason, severity, recommended_action, is_read)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE);
          `, [
            `alt-${recordId}-spo2`,
            astronautId,
            recordId,
            'SPO2',
            `${spo2}%`,
            'SpO₂ has fallen below the configured critical rule.',
            'CRITICAL',
            'Follow the applicable onboard emergency medical protocol. Contact Mission Control when communication is available.'
          ]);
        }
      }
    }

    await conn.commit();

    res.status(200).json({
      success: true,
      message: `Scenario switched to [${scenario}] successfully. 15 historical telemetry records regenerated.`,
      scenario,
      astronautId,
      disclaimer: "The health values displayed in this prototype are simulated data for demonstration purposes. The monitored health indicators and health considerations are informed by NASA's human spaceflight research."
    });

  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

module.exports = {
  setDemoScenario
};
