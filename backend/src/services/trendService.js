/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Multi-Day Trend Detection Service: backend/src/services/trendService.js
 * 
 * Detects concerning multi-day consecutive patterns (e.g. sleep duration
 * below monitoring level for 3 consecutive days, consecutive elevated stress, etc.)
 * 
 * NOTE: Rule-based trend detection only. No predictive modeling or machine learning.
 */

const { pool } = require('../config/db');

/**
 * Checks whether a numerical value meets a comparison rule.
 * 
 * @param {number} value 
 * @param {string} comparison '<', '<=', '>', '>=', 'BETWEEN', 'OUTSIDE'
 * @param {number|null} min 
 * @param {number|null} max 
 * @returns {boolean}
 */
function testCondition(value, comparison, min, max) {
  if (value === null || value === undefined || isNaN(value)) return false;

  switch (comparison) {
    case '<':
      return min !== null && value < min;
    case '<=':
      return min !== null && value <= min;
    case '>':
      return max !== null && value > max;
    case '>=':
      return max !== null && value >= max;
    case 'BETWEEN':
      return min !== null && max !== null && value >= min && value <= max;
    case 'OUTSIDE':
      return (min !== null && value < min) || (max !== null && value > max);
    default:
      return false;
  }
}

/**
 * Evaluates whether an indicator violates a consecutive-day rule.
 * 
 * @param {string} astronautId 
 * @param {string} indicatorId 
 * @param {string} targetDate Current check-in date (YYYY-MM-DD)
 * @param {number} currentValue Value on the current check-in date
 * @param {object} rule Rule configuration from health_rules table
 * @param {object} [dbConn]
 * @returns {Promise<{ triggered: boolean, consecutiveDays: number, description: string }>}
 */
async function evaluateConsecutiveTrend(astronautId, indicatorId, targetDate, currentValue, rule, dbConn = null) {
  const conn = dbConn || pool;
  const consecutiveRequired = rule.consecutive_days || 1;

  // 1. First test current day's measurement
  const currentMatches = testCondition(currentValue, rule.comparison, rule.threshold_min, rule.threshold_max);
  if (!currentMatches) {
    return {
      triggered: false,
      consecutiveDays: 0,
      description: 'Current measurement nominal.'
    };
  }

  // If rule requires only 1 day, it triggers immediately
  if (consecutiveRequired <= 1) {
    return {
      triggered: true,
      consecutiveDays: 1,
      description: rule.description
    };
  }

  // 2. Fetch preceding consecutive calendar days
  // We need (consecutiveRequired - 1) previous consecutive days immediately preceding targetDate
  const lookbackDays = consecutiveRequired - 1;
  const query = `
    SELECT 
      r.record_date,
      rv.value_numeric
    FROM health_records r
    JOIN health_record_values rv ON r.record_id = rv.record_id
    WHERE r.astronaut_id = ?
      AND rv.indicator_id = ?
      AND r.record_date >= DATE_SUB(?, INTERVAL ? DAY)
      AND r.record_date < ?
    ORDER BY r.record_date DESC
    LIMIT ?;
  `;

  const [rows] = await conn.query(query, [astronautId, indicatorId, targetDate, lookbackDays + 2, targetDate, lookbackDays]);

  let consecutiveCount = 1; // Current day already satisfies condition
  let expectedPrevDate = new Date(`${targetDate}T00:00:00Z`);

  for (const row of rows) {
    expectedPrevDate = new Date(expectedPrevDate.getTime() - 86400000);
    const rowDateStr = new Date(row.record_date).toISOString().slice(0, 10);
    const expectedDateStr = expectedPrevDate.toISOString().slice(0, 10);

    // Verify day continuity (must be strictly consecutive calendar days)
    if (rowDateStr !== expectedDateStr) {
      break; // Gap detected in consecutive tracking
    }

    const pastVal = parseFloat(row.value_numeric);
    if (testCondition(pastVal, rule.comparison, rule.threshold_min, rule.threshold_max)) {
      consecutiveCount++;
    } else {
      break; // Sequence broken
    }
  }

  const triggered = consecutiveCount >= consecutiveRequired;

  return {
    triggered,
    consecutiveDays: consecutiveCount,
    description: triggered
      ? `${rule.description} (${consecutiveCount} consecutive days)`
      : `Monitored ${consecutiveCount} of ${consecutiveRequired} consecutive days.`
  };
}

module.exports = {
  testCondition,
  evaluateConsecutiveTrend
};
