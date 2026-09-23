/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Centralized Rule Evaluation Engine: backend/src/services/ruleEngineService.js
 * 
 * Central orchestrator for rule-based telemetry evaluation:
 * 1. Evaluates Fixed Threshold Rules (single abnormal measurements)
 * 2. Evaluates Personal Baseline Deviations (14-day statistical comparison)
 * 3. Evaluates Multi-Day Consecutive Trend Rules
 * 4. Aggregates transparent Overall Status (NORMAL, WARNING, CRITICAL)
 * 5. Compiles actionable mission-oriented alerts (No medical diagnosis)
 * 
 * IMPORTANT:
 * All numerical threshold values configured in this rule engine are illustrative
 * demonstration values. They are NOT official NASA medical limits or diagnostic standards.
 */

const { pool } = require('../config/db');
const { calculateAllBaselines } = require('./baselineService');
const { evaluateConsecutiveTrend, testCondition } = require('./trendService');

// Fallback rule definitions if database is temporarily unreachable
const DEFAULT_RULES = [
  {
    rule_id: 'RULE_SPO2_CRITICAL',
    indicator_id: 'SPO2',
    rule_type: 'FIXED_THRESHOLD',
    comparison: '<',
    threshold_min: 90.0,
    threshold_max: null,
    deviation_percentage: null,
    consecutive_days: 1,
    severity: 'CRITICAL',
    recommended_action: 'Follow the applicable onboard emergency medical protocol. Contact Mission Control when communication is available.',
    description: 'SpO₂ has fallen below the configured critical rule'
  },
  {
    rule_id: 'RULE_SPO2_WARN',
    indicator_id: 'SPO2',
    rule_type: 'FIXED_THRESHOLD',
    comparison: '<',
    threshold_min: 94.0,
    threshold_max: null,
    deviation_percentage: null,
    consecutive_days: 1,
    severity: 'WARNING',
    recommended_action: 'Recheck the indicator and follow the applicable mission health protocol.',
    description: 'Blood oxygen saturation below 94%'
  },
  {
    rule_id: 'RULE_HR_HIGH_WARN',
    indicator_id: 'HEART_RATE',
    rule_type: 'FIXED_THRESHOLD',
    comparison: '>',
    threshold_min: null,
    threshold_max: 100.0,
    deviation_percentage: null,
    consecutive_days: 1,
    severity: 'WARNING',
    recommended_action: 'Recheck the indicator and follow the applicable mission health protocol.',
    description: 'Resting heart rate exceeds 100 BPM'
  },
  {
    rule_id: 'RULE_HR_BASELINE_DEV',
    indicator_id: 'HEART_RATE',
    rule_type: 'BASELINE_DEVIATION',
    comparison: 'OUTSIDE',
    threshold_min: null,
    threshold_max: null,
    deviation_percentage: 20.0,
    consecutive_days: 1,
    severity: 'WARNING',
    recommended_action: 'Recheck the indicator and follow the applicable mission health protocol.',
    description: 'Heart rate deviated by more than 20% from personal 14-day baseline'
  },
  {
    rule_id: 'RULE_TEMP_HIGH_WARN',
    indicator_id: 'BODY_TEMP',
    rule_type: 'FIXED_THRESHOLD',
    comparison: '>',
    threshold_min: null,
    threshold_max: 38.0,
    deviation_percentage: null,
    consecutive_days: 1,
    severity: 'WARNING',
    recommended_action: 'Recheck the indicator and follow the applicable mission health protocol.',
    description: 'Core body temperature elevated above 38.0°C'
  },
  {
    rule_id: 'RULE_TEMP_HIGH_CRITICAL',
    indicator_id: 'BODY_TEMP',
    rule_type: 'FIXED_THRESHOLD',
    comparison: '>',
    threshold_min: null,
    threshold_max: 39.5,
    deviation_percentage: null,
    consecutive_days: 1,
    severity: 'CRITICAL',
    recommended_action: 'Follow the applicable onboard emergency medical protocol. Contact Mission Control when communication is available.',
    description: 'Core body temperature exceeds 39.5°C critical threshold'
  },
  {
    rule_id: 'RULE_SLEEP_TREND_WARN',
    indicator_id: 'SLEEP_DURATION',
    rule_type: 'CONSECUTIVE_TREND',
    comparison: '<',
    threshold_min: 6.0,
    threshold_max: null,
    deviation_percentage: null,
    consecutive_days: 3,
    severity: 'WARNING',
    recommended_action: 'Recheck the indicator and follow the applicable mission health protocol.',
    description: 'Sleep duration has remained below the configured monitoring level for 3 consecutive days'
  },
  {
    rule_id: 'RULE_BP_SYS_WARN',
    indicator_id: 'BP_SYSTOLIC',
    rule_type: 'FIXED_THRESHOLD',
    comparison: '>',
    threshold_min: null,
    threshold_max: 140.0,
    deviation_percentage: null,
    consecutive_days: 1,
    severity: 'WARNING',
    recommended_action: 'Recheck the indicator and follow the applicable mission health protocol.',
    description: 'Systolic blood pressure elevated above 140 mmHg'
  },
  {
    rule_id: 'RULE_HYDRATION_WARN',
    indicator_id: 'HYDRATION',
    rule_type: 'FIXED_THRESHOLD',
    comparison: '<',
    threshold_min: 2.0,
    threshold_max: null,
    deviation_percentage: null,
    consecutive_days: 1,
    severity: 'WARNING',
    recommended_action: 'Recheck fluid intake protocol and ensure adequate electrolyte replacement.',
    description: 'Daily fluid intake below 2.0 liters'
  }
];

/**
 * Loads active health rules from database with fallback.
 * @param {object} [dbConn] 
 * @returns {Promise<Array>}
 */
async function loadRules(dbConn = null) {
  const conn = dbConn || pool;
  try {
    const [rows] = await conn.query(`
      SELECT * FROM health_rules WHERE enabled = TRUE ORDER BY severity DESC, rule_type ASC;
    `);
    if (rows.length > 0) return rows;
  } catch (error) {
    console.warn('[RULE ENGINE] Database rules query failed, using built-in defaults:', error.message);
  }
  return DEFAULT_RULES;
}

/**
 * Evaluates a complete daily check-in payload against configurable rules,
 * personal baselines, and multi-day trends.
 * 
 * @param {string} astronautId 
 * @param {string} recordDate (YYYY-MM-DD)
 * @param {object} measurements Key-value map of numerical indicators
 * @param {object} [dbConn]
 * @returns {Promise<{
 *   overallStatus: 'NORMAL'|'WARNING'|'CRITICAL',
 *   evaluationSummary: string,
 *   recommendedAction: string,
 *   evaluatedIndicators: Record<string, { value: number, status: string, baseline: number, deviationPct: number, ruleTriggeredId: string }>,
 *   alertsToGenerate: Array<{ indicatorId: string, currentValue: string, reason: string, severity: string, recommendedAction: string }>
 * }>}
 */
async function evaluateHealthRecord(astronautId, recordDate, measurements, dbConn = null) {
  const conn = dbConn || pool;

  // 1. Calculate Personal Baselines and Deviations
  const baselines = await calculateAllBaselines(astronautId, recordDate, measurements, conn);

  // 2. Load Active Rules
  const rules = await loadRules(conn);

  // Status tracker per indicator
  const evaluatedIndicators = {};
  for (const [ind, val] of Object.entries(measurements)) {
    const baseInfo = baselines[ind] || { baseline: null, deviationPct: null };
    evaluatedIndicators[ind] = {
      value: val,
      status: 'NORMAL',
      baseline: baseInfo.baseline,
      deviationPct: baseInfo.deviationPct,
      ruleTriggeredId: null
    };
  }

  const triggeredRules = [];
  const alertsToGenerate = [];

  // 3. Evaluate Each Active Rule
  for (const rule of rules) {
    const indicatorId = rule.indicator_id;
    const measuredVal = measurements[indicatorId];

    if (measuredVal === undefined || measuredVal === null || isNaN(measuredVal)) {
      continue;
    }

    let isRuleTriggered = false;
    let triggerReason = '';

    // 3a. FIXED THRESHOLD RULE
    if (rule.rule_type === 'FIXED_THRESHOLD') {
      if (testCondition(measuredVal, rule.comparison, rule.threshold_min, rule.threshold_max)) {
        isRuleTriggered = true;
        // Check for specific SpO2 mandatory wording
        if (indicatorId === 'SPO2' && rule.severity === 'CRITICAL') {
          triggerReason = 'SpO₂ has fallen below the configured critical rule.';
        } else {
          triggerReason = rule.description;
        }
      }
    }

    // 3b. PERSONAL BASELINE DEVIATION RULE
    else if (rule.rule_type === 'BASELINE_DEVIATION') {
      const baseInfo = baselines[indicatorId];
      if (baseInfo && baseInfo.deviationPct !== null && rule.deviation_percentage !== null) {
        if (Math.abs(baseInfo.deviationPct) >= rule.deviation_percentage) {
          isRuleTriggered = true;
          const sign = baseInfo.deviationPct > 0 ? '+' : '';
          triggerReason = `${rule.description} (${sign}${baseInfo.deviationPct}% deviation from personal baseline of ${baseInfo.baseline}).`;
        }
      }
    }

    // 3c. CONSECUTIVE TREND RULE
    else if (rule.rule_type === 'CONSECUTIVE_TREND') {
      const trendResult = await evaluateConsecutiveTrend(astronautId, indicatorId, recordDate, measuredVal, rule, conn);
      if (trendResult.triggered) {
        isRuleTriggered = true;
        triggerReason = trendResult.description;
      }
    }

    // If triggered, update indicator status and register alert
    if (isRuleTriggered) {
      const currentIndicatorStatus = evaluatedIndicators[indicatorId].status;

      // Escalate status: CRITICAL > WARNING > NORMAL
      if (rule.severity === 'CRITICAL') {
        evaluatedIndicators[indicatorId].status = 'CRITICAL';
        evaluatedIndicators[indicatorId].ruleTriggeredId = rule.rule_id;
      } else if (rule.severity === 'WARNING' && currentIndicatorStatus !== 'CRITICAL') {
        evaluatedIndicators[indicatorId].status = 'WARNING';
        evaluatedIndicators[indicatorId].ruleTriggeredId = rule.rule_id;
      }

      triggeredRules.push({
        ruleId: rule.rule_id,
        indicatorId,
        severity: rule.severity,
        reason: triggerReason,
        action: rule.recommended_action
      });

      alertsToGenerate.push({
        indicatorId,
        currentValue: `${measuredVal}`,
        reason: triggerReason,
        severity: rule.severity,
        recommendedAction: rule.recommended_action
      });
    }
  }

  // 4. Determine Overall Status
  let overallStatus = 'NORMAL';
  let recommendedAction = 'Continue routine monitoring.';

  const hasCritical = triggeredRules.some(r => r.severity === 'CRITICAL');
  const hasWarning = triggeredRules.some(r => r.severity === 'WARNING');

  if (hasCritical) {
    overallStatus = 'CRITICAL';
    recommendedAction = 'Follow the applicable onboard emergency medical protocol. Contact Mission Control when communication is available.';
  } else if (hasWarning) {
    overallStatus = 'WARNING';
    recommendedAction = 'Recheck the indicator and follow the applicable mission health protocol.';
  }

  // 5. Generate Human-Readable Transparent Summary
  let evaluationSummary = '';
  if (overallStatus === 'NORMAL') {
    evaluationSummary = 'All physiological vitals and lifestyle indicators are nominal within personal baseline limits.';
  } else {
    const reasons = triggeredRules.map(r => `[${r.severity}] ${r.reason}`).join('; ');
    evaluationSummary = `${overallStatus} Status: ${reasons}`;
  }

  return {
    overallStatus,
    evaluationSummary,
    recommendedAction,
    evaluatedIndicators,
    alertsToGenerate,
    triggeredRules
  };
}

module.exports = {
  loadRules,
  evaluateHealthRecord,
  DEFAULT_RULES
};
