/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Personal Baseline Service: backend/src/services/baselineService.js
 * 
 * Computes an astronaut's personal rolling 14-day baseline average
 * and calculates percentage deviation for current health measurements.
 * 
 * NOTE: Statistical comparison and rule-based evaluation only (No AI/ML).
 */

const { pool } = require('../config/db');

/**
 * Standard reference defaults used as fallbacks when insufficient historical
 * data exists (< 3 previous days of records).
 * NOTE: Illustrative demonstration reference values only.
 */
const REFERENCE_FALLBACKS = {
  HEART_RATE: 72.0,
  SPO2: 98.0,
  BP_SYSTOLIC: 120.0,
  BP_DIASTOLIC: 80.0,
  BODY_TEMP: 36.8,
  BODY_WEIGHT: 75.0,
  SLEEP_DURATION: 7.5,
  EXERCISE_DURATION: 2.0,
  HYDRATION: 2.8,
  RADIATION_DOSE: 0.40
};

/**
 * Calculates the personal 14-day baseline for a specific astronaut and indicator.
 * The window covers [recordDate - 14 days, recordDate - 1 day].
 * 
 * @param {string} astronautId 
 * @param {string} indicatorId 
 * @param {string} targetDate YYYY-MM-DD
 * @param {object} [dbConn] Optional MySQL connection for transaction reuse
 * @returns {Promise<{ baseline: number, count: number, isPersonal: boolean }>}
 */
async function calculateIndicatorBaseline(astronautId, indicatorId, targetDate, dbConn = null) {
  const conn = dbConn || pool;

  const query = `
    SELECT 
      AVG(rv.value_numeric) AS avg_value,
      COUNT(rv.value_numeric) AS record_count
    FROM health_record_values rv
    JOIN health_records r ON rv.record_id = r.record_id
    WHERE r.astronaut_id = ?
      AND rv.indicator_id = ?
      AND r.record_date >= DATE_SUB(?, INTERVAL 14 DAY)
      AND r.record_date < ?;
  `;

  const [rows] = await conn.query(query, [astronautId, indicatorId, targetDate, targetDate]);
  const result = rows[0];

  const count = result ? parseInt(result.record_count || 0, 10) : 0;

  // Require at least 3 historical days of records for a personal statistical baseline
  if (result && count >= 3 && result.avg_value !== null) {
    return {
      baseline: Math.round(parseFloat(result.avg_value) * 100) / 100,
      count,
      isPersonal: true
    };
  }

  // Fallback to reference baseline when insufficient history exists
  const fallback = REFERENCE_FALLBACKS[indicatorId] || null;
  return {
    baseline: fallback,
    count,
    isPersonal: false
  };
}

/**
 * Calculates percentage deviation of a measured value from its baseline.
 * Formula: ((Current - Baseline) / Baseline) * 100
 * 
 * @param {number} current Current measured value
 * @param {number} baseline Baseline reference or historical average
 * @returns {number|null} Percentage deviation rounded to 1 decimal place
 */
function calculateDeviationPercentage(current, baseline) {
  if (baseline === null || baseline === 0 || current === null) {
    return null;
  }
  const deviation = ((current - baseline) / baseline) * 100;
  return Math.round(deviation * 10) / 10;
}

/**
 * Computes baselines for all indicators present in a check-in payload.
 * 
 * @param {string} astronautId 
 * @param {string} targetDate 
 * @param {object} measurements Key-value map of indicator values
 * @param {object} [dbConn]
 * @returns {Promise<Record<string, { baseline: number, deviationPct: number, isPersonal: boolean }>>}
 */
async function calculateAllBaselines(astronautId, targetDate, measurements, dbConn = null) {
  const baselines = {};

  for (const [indicatorId, value] of Object.entries(measurements)) {
    if (typeof value === 'number' && !isNaN(value)) {
      const { baseline, isPersonal } = await calculateIndicatorBaseline(astronautId, indicatorId, targetDate, dbConn);
      const deviationPct = calculateDeviationPercentage(value, baseline);

      baselines[indicatorId] = {
        baseline,
        deviationPct,
        isPersonal
      };
    }
  }

  return baselines;
}

module.exports = {
  calculateIndicatorBaseline,
  calculateDeviationPercentage,
  calculateAllBaselines,
  REFERENCE_FALLBACKS
};
