/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Health Telemetry Controller: backend/src/controllers/healthController.js
 */

const { pool } = require('../config/db');
const { evaluateHealthRecord } = require('../services/ruleEngineService');

// Physical plausible bounds validation catalog (cache)
const INDICATOR_BOUNDS = {
  HEART_RATE: { min: 30, max: 220, name: 'Heart Rate' },
  SPO2: { min: 50, max: 100, name: 'Blood Oxygen (SpO₂)' },
  BP_SYSTOLIC: { min: 60, max: 260, name: 'Systolic Blood Pressure' },
  BP_DIASTOLIC: { min: 40, max: 160, name: 'Diastolic Blood Pressure' },
  BODY_TEMP: { min: 32.0, max: 43.0, name: 'Body Temperature' },
  BODY_WEIGHT: { min: 35.0, max: 200.0, name: 'Body Mass' },
  SLEEP_DURATION: { min: 0.0, max: 24.0, name: 'Sleep Duration' },
  EXERCISE_DURATION: { min: 0.0, max: 12.0, name: 'Exercise Duration' },
  HYDRATION: { min: 0.0, max: 10.0, name: 'Hydration' },
  RADIATION_DOSE: { min: 0.0, max: 50.0, name: 'Daily Radiation Dose' }
};

/**
 * Validates physical plausibility ranges before rule engine evaluation.
 */
function validatePlausibleRanges(indicators) {
  const errors = [];
  for (const [key, value] of Object.entries(indicators)) {
    const bounds = INDICATOR_BOUNDS[key];
    if (bounds && typeof value === 'number') {
      if (value < bounds.min || value > bounds.max) {
        errors.push(`${bounds.name} value ${value} is outside plausible physical range [${bounds.min} - ${bounds.max}].`);
      }
    }
  }
  return errors;
}

/**
 * Submits or updates daily astronaut health check-in.
 * POST /api/health
 */
async function submitHealthCheckin(req, res, next) {
  let conn = null;
  try {
    const astronautId = req.user.astronautId;
    if (!astronautId) {
      return res.status(403).json({
        success: false,
        error: 'Only crew members with an assigned astronaut ID can submit daily telemetry.'
      });
    }

    const {
      record_date,
      indicators = {},
      symptoms = [],
      behavioral = {},
      radiation = {},
      notes = ''
    } = req.body;

    // 1. Separate Physical Range Validation (Section 36 item 5)
    // Runs before database transaction to reject invalid physical bounds immediately
    const rangeErrors = validatePlausibleRanges(indicators);
    if (rangeErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Physical range validation failed.',
        details: rangeErrors
      });
    }

    // Use provided record_date or current UTC date
    const targetDate = record_date || new Date().toISOString().slice(0, 10);

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 2. Fetch astronaut's mission launch date to compute mission day
    const [astroRows] = await conn.query(`
      SELECT a.astronaut_id, m.launch_date 
      FROM astronauts a
      JOIN missions m ON a.mission_id = m.mission_id
      WHERE a.astronaut_id = ?;
    `, [astronautId]);

    if (astroRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Astronaut record not found.' });
    }

    const launchDate = new Date(astroRows[0].launch_date);
    const checkDate = new Date(targetDate);
    const missionDay = Math.max(1, Math.floor((checkDate - launchDate) / (1000 * 60 * 60 * 24)) + 1);

    // 3. Centralized Rule Engine Evaluation
    const evaluation = await evaluateHealthRecord(astronautId, targetDate, indicators, conn);

    // 4. Upsert Master Daily Health Record (UNIQUE: astronaut_id + record_date)
    const recordId = `rec-${astronautId}-${targetDate}`;
    await conn.query(`
      INSERT INTO health_records (
        record_id, astronaut_id, record_date, mission_day, 
        overall_status, evaluation_summary, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        mission_day = VALUES(mission_day),
        overall_status = VALUES(overall_status),
        evaluation_summary = VALUES(evaluation_summary),
        notes = VALUES(notes),
        updated_at = CURRENT_TIMESTAMP;
    `, [
      recordId, astronautId, targetDate, missionDay,
      evaluation.overallStatus, evaluation.evaluationSummary, notes
    ]);

    // 5. Replace Normalized Indicator Measurements
    await conn.query(`DELETE FROM health_record_values WHERE record_id = ?;`, [recordId]);

    for (const [indId, evalData] of Object.entries(evaluation.evaluatedIndicators)) {
      const valueId = `val-${recordId}-${indId}`;
      await conn.query(`
        INSERT INTO health_record_values (
          value_id, record_id, indicator_id, value_numeric, 
          status, baseline_value, deviation_pct, rule_triggered_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        valueId, recordId, indId, evalData.value,
        evalData.status, evalData.baseline, evalData.deviationPct, evalData.ruleTriggeredId
      ]);
    }

    // 6. Upsert Behavioral Check-in
    if (behavioral.mood && behavioral.stress_level && behavioral.loneliness_level) {
      const checkinId = `beh-${recordId}`;
      await conn.query(`
        INSERT INTO behavioral_checkins (
          checkin_id, record_id, mood, stress_level, loneliness_level, 
          crew_connection, concentration_difficulty, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          mood = VALUES(mood),
          stress_level = VALUES(stress_level),
          loneliness_level = VALUES(loneliness_level),
          crew_connection = VALUES(crew_connection),
          concentration_difficulty = VALUES(concentration_difficulty),
          notes = VALUES(notes);
      `, [
        checkinId, recordId,
        behavioral.mood, behavioral.stress_level, behavioral.loneliness_level,
        behavioral.crew_connection || 'STRONG',
        behavioral.concentration_difficulty ? 1 : 0,
        behavioral.notes || null
      ]);
    }

    // 7. Upsert Radiation Record (Cumulative Calculation)
    const dailyRadDose = parseFloat(radiation.simulated_daily_dose_msv || 0.40);
    // Find previous day's cumulative dose
    const [prevRad] = await conn.query(`
      SELECT simulated_cumulative_dose_msv 
      FROM radiation_records rad
      JOIN health_records r ON rad.record_id = r.record_id
      WHERE r.astronaut_id = ? AND r.record_date < ?
      ORDER BY r.record_date DESC LIMIT 1;
    `, [astronautId, targetDate]);

    const prevCumulative = prevRad.length > 0 ? parseFloat(prevRad[0].simulated_cumulative_dose_msv) : 5.0;
    const newCumulative = Math.round((prevCumulative + dailyRadDose) * 1000) / 1000;
    const radId = `rad-${recordId}`;

    await conn.query(`
      INSERT INTO radiation_records (
        radiation_id, record_id, simulated_daily_dose_msv, 
        simulated_cumulative_dose_msv, is_simulated, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        simulated_daily_dose_msv = VALUES(simulated_daily_dose_msv),
        simulated_cumulative_dose_msv = VALUES(simulated_cumulative_dose_msv),
        notes = VALUES(notes);
    `, [
      radId, recordId, dailyRadDose, newCumulative, true,
      radiation.notes || 'SIMULATED RADIATION DATA'
    ]);

    // 8. Replace Symptoms
    await conn.query(`DELETE FROM record_symptoms WHERE record_id = ?;`, [recordId]);
    if (Array.isArray(symptoms)) {
      for (const sym of symptoms) {
        if (sym.symptom_id && sym.severity_level) {
          const symId = `rsym-${recordId}-${sym.symptom_id}`;
          await conn.query(`
            INSERT INTO record_symptoms (id, record_id, symptom_id, severity_level, notes)
            VALUES (?, ?, ?, ?, ?);
          `, [symId, recordId, sym.symptom_id, sym.severity_level, sym.notes || null]);
        }
      }
    }

    // 9. Generate Alerts in database
    await conn.query(`DELETE FROM alerts WHERE record_id = ? AND is_read = FALSE;`, [recordId]);

    const generatedAlerts = [];
    for (const alt of evaluation.alertsToGenerate) {
      const alertId = `alt-${recordId}-${alt.indicatorId}`;
      await conn.query(`
        INSERT INTO alerts (
          alert_id, astronaut_id, record_id, indicator_id, 
          current_value, reason, severity, recommended_action, is_read
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE);
      `, [
        alertId, astronautId, recordId, alt.indicatorId,
        alt.currentValue, alt.reason, alt.severity, alt.recommendedAction
      ]);
      generatedAlerts.push({ alertId, ...alt });
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Daily health telemetry successfully processed and evaluated onboard.',
      evaluation: {
        recordId,
        recordDate: targetDate,
        missionDay,
        overallStatus: evaluation.overallStatus,
        evaluationSummary: evaluation.evaluationSummary,
        recommendedAction: evaluation.recommendedAction,
        indicators: evaluation.evaluatedIndicators,
        alerts: generatedAlerts
      }
    });

  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    next(error);
  } finally {
    if (conn) conn.release();
  }
}

/**
 * Returns the latest daily health telemetry for an astronaut.
 * GET /api/health/:astronautId/latest
 */
async function getLatestHealth(req, res, next) {
  try {
    const { astronautId } = req.params;

    // Fetch latest master record
    const [records] = await pool.query(`
      SELECT 
        r.record_id,
        r.astronaut_id,
        r.record_date,
        r.mission_day,
        r.overall_status,
        r.evaluation_summary,
        r.notes,
        r.updated_at,
        b.mood,
        b.stress_level,
        b.loneliness_level,
        b.crew_connection,
        b.concentration_difficulty,
        rad.simulated_daily_dose_msv,
        rad.simulated_cumulative_dose_msv
      FROM health_records r
      LEFT JOIN behavioral_checkins b ON r.record_id = b.record_id
      LEFT JOIN radiation_records rad ON r.record_id = rad.record_id
      WHERE r.astronaut_id = ?
      ORDER BY r.record_date DESC
      LIMIT 1;
    `, [astronautId]);

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No health telemetry records found for astronaut "${astronautId}".`
      });
    }

    const latest = records[0];

    // Fetch indicator measurements
    const [values] = await pool.query(`
      SELECT 
        rv.indicator_id,
        hi.name,
        hi.unit,
        hi.category,
        rv.value_numeric,
        rv.status,
        rv.baseline_value,
        rv.deviation_pct
      FROM health_record_values rv
      JOIN health_indicators hi ON rv.indicator_id = hi.indicator_id
      WHERE rv.record_id = ?;
    `, [latest.record_id]);

    // Fetch symptoms reported
    const [symptoms] = await pool.query(`
      SELECT 
        rs.symptom_id,
        sc.name,
        rs.severity_level,
        rs.notes
      FROM record_symptoms rs
      JOIN symptoms_catalog sc ON rs.symptom_id = sc.symptom_id
      WHERE rs.record_id = ?;
    `, [latest.record_id]);

    // Fetch active unread alerts
    const [alerts] = await pool.query(`
      SELECT 
        alert_id, indicator_id, current_value, reason, severity, 
        recommended_action, is_read, created_at
      FROM alerts
      WHERE astronaut_id = ? AND is_read = FALSE
      ORDER BY severity DESC, created_at DESC;
    `, [astronautId]);

    res.status(200).json({
      success: true,
      record: {
        ...latest,
        indicators: values,
        symptoms,
        activeAlerts: alerts
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Returns historical records table data with filters (?filter=today|7d|14d|30d).
 * GET /api/health/:astronautId/history
 */
async function getHealthHistory(req, res, next) {
  try {
    const { astronautId } = req.params;
    const { filter = '14d' } = req.query;

    let dayInterval = 14;
    if (filter === 'today') dayInterval = 1;
    else if (filter === '7d') dayInterval = 7;
    else if (filter === '14d') dayInterval = 14;
    else if (filter === '30d') dayInterval = 30;

    const [rows] = await pool.query(`
      SELECT 
        r.record_id,
        r.record_date,
        r.mission_day,
        r.overall_status,
        r.evaluation_summary,
        MAX(CASE WHEN rv.indicator_id = 'HEART_RATE' THEN rv.value_numeric END) AS heart_rate,
        MAX(CASE WHEN rv.indicator_id = 'SPO2' THEN rv.value_numeric END) AS spo2,
        MAX(CASE WHEN rv.indicator_id = 'SLEEP_DURATION' THEN rv.value_numeric END) AS sleep_duration,
        MAX(CASE WHEN rv.indicator_id = 'EXERCISE_DURATION' THEN rv.value_numeric END) AS exercise_duration,
        b.stress_level,
        b.mood,
        rad.simulated_daily_dose_msv AS radiation_daily,
        rad.simulated_cumulative_dose_msv AS radiation_cumulative
      FROM health_records r
      LEFT JOIN health_record_values rv ON r.record_id = rv.record_id
      LEFT JOIN behavioral_checkins b ON r.record_id = b.record_id
      LEFT JOIN radiation_records rad ON r.record_id = rad.record_id
      WHERE r.astronaut_id = ?
        AND r.record_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ? DAY)
      GROUP BY r.record_id, r.record_date, r.mission_day, r.overall_status, r.evaluation_summary, b.stress_level, b.mood, rad.simulated_daily_dose_msv, rad.simulated_cumulative_dose_msv
      ORDER BY r.record_date DESC;
    `, [astronautId, dayInterval]);

    res.status(200).json({
      success: true,
      filter,
      count: rows.length,
      history: rows
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Returns formatted time-series data for 14-day Chart.js rendering.
 * GET /api/health/:astronautId/trends
 */
async function getHealthTrends(req, res, next) {
  try {
    const { astronautId } = req.params;
    const days = parseInt(req.query.days || '14', 10);

    const [rows] = await pool.query(`
      SELECT 
        r.record_date,
        r.mission_day,
        MAX(CASE WHEN rv.indicator_id = 'HEART_RATE' THEN rv.value_numeric END) AS heart_rate,
        MAX(CASE WHEN rv.indicator_id = 'HEART_RATE' THEN rv.baseline_value END) AS heart_rate_baseline,
        MAX(CASE WHEN rv.indicator_id = 'SPO2' THEN rv.value_numeric END) AS spo2,
        MAX(CASE WHEN rv.indicator_id = 'SLEEP_DURATION' THEN rv.value_numeric END) AS sleep_duration,
        MAX(CASE WHEN rv.indicator_id = 'EXERCISE_DURATION' THEN rv.value_numeric END) AS exercise_duration,
        MAX(CASE WHEN rv.indicator_id = 'BODY_WEIGHT' THEN rv.value_numeric END) AS body_weight,
        b.stress_level,
        rad.simulated_cumulative_dose_msv AS radiation_cumulative
      FROM health_records r
      LEFT JOIN health_record_values rv ON r.record_id = rv.record_id
      LEFT JOIN behavioral_checkins b ON r.record_id = b.record_id
      LEFT JOIN radiation_records rad ON r.record_id = rad.record_id
      WHERE r.astronaut_id = ?
        AND r.record_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ? DAY)
      GROUP BY r.record_date, r.mission_day, b.stress_level, rad.simulated_cumulative_dose_msv
      ORDER BY r.record_date ASC;
    `, [astronautId, days]);

    // Format into chart series
    const dates = [];
    const heartRates = [];
    const heartRateBaselines = [];
    const spo2Levels = [];
    const sleepDurations = [];
    const exerciseDurations = [];
    const weights = [];
    const stressScores = []; // LOW: 1, MEDIUM: 2, HIGH: 3
    const cumulativeRadiation = [];

    for (const r of rows) {
      dates.push(new Date(r.record_date).toISOString().slice(5, 10)); // MM-DD
      heartRates.push(r.heart_rate !== null ? parseFloat(r.heart_rate) : null);
      heartRateBaselines.push(r.heart_rate_baseline !== null ? parseFloat(r.heart_rate_baseline) : 72.0);
      spo2Levels.push(r.spo2 !== null ? parseFloat(r.spo2) : null);
      sleepDurations.push(r.sleep_duration !== null ? parseFloat(r.sleep_duration) : null);
      exerciseDurations.push(r.exercise_duration !== null ? parseFloat(r.exercise_duration) : null);
      weights.push(r.body_weight !== null ? parseFloat(r.body_weight) : null);
      
      let stressNum = 1;
      if (r.stress_level === 'MEDIUM') stressNum = 2;
      else if (r.stress_level === 'HIGH') stressNum = 3;
      stressScores.push(stressNum);

      cumulativeRadiation.push(r.radiation_cumulative !== null ? parseFloat(r.radiation_cumulative) : null);
    }

    res.status(200).json({
      success: true,
      trends: {
        labels: dates,
        heartRate: heartRates,
        heartRateBaseline: heartRateBaselines,
        spo2: spo2Levels,
        sleep: sleepDurations,
        exercise: exerciseDurations,
        weight: weights,
        stress: stressScores,
        radiationCumulative: cumulativeRadiation
      }
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitHealthCheckin,
  getLatestHealth,
  getHealthHistory,
  getHealthTrends
};
