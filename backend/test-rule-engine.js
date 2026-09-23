/**
 * Step 3 Verification Test: backend/test-rule-engine.js
 * Validates the Rule Engine, Personal Baseline math, and Multi-Day Trend logic.
 */

const { calculateDeviationPercentage, REFERENCE_FALLBACKS } = require('./src/services/baselineService');
const { testCondition } = require('./src/services/trendService');
const { evaluateHealthRecord } = require('./src/services/ruleEngineService');

async function runTests() {
  console.log('--- RUNNING STEP 3 RULE ENGINE & BASELINE VERIFICATION TESTS ---\n');

  // Test 1: Deviation Percentage Math
  const baseline = 72.0;
  const currentHR = 88.0;
  const dev = calculateDeviationPercentage(currentHR, baseline);
  console.log(`[TEST 1] Baseline deviation calculation (72.0 -> 88.0 BPM): ${dev}% (Expected: 22.2%)`);
  if (Math.abs(dev - 22.2) > 0.1) {
    console.error('Deviation calculation mismatch!');
    process.exit(1);
  }

  // Test 2: Condition Testing (<, >, <=, >=, OUTSIDE)
  const cond1 = testCondition(89, '<', 90, null); // SpO2 < 90
  const cond2 = testCondition(98, '<', 90, null); // SpO2 nominal
  const cond3 = testCondition(104, '>', null, 100); // HR > 100
  console.log(`[TEST 2] Condition testing: SpO2 89 < 90 (${cond1}), SpO2 98 < 90 (${cond2}), HR 104 > 100 (${cond3})`);
  if (!cond1 || cond2 || !cond3) {
    console.error('Condition test failed!');
    process.exit(1);
  }

  // Test 3: Normal Scenario Evaluation
  const normalPayload = {
    HEART_RATE: 72,
    SPO2: 98,
    BP_SYSTOLIC: 118,
    BP_DIASTOLIC: 76,
    BODY_TEMP: 36.8,
    BODY_WEIGHT: 75.0,
    SLEEP_DURATION: 7.5,
    EXERCISE_DURATION: 2.0,
    HYDRATION: 2.8
  };

  // Mock db connection returning empty rows so fallback baselines are used
  const mockConn = {
    query: async () => [[]]
  };

  const normalResult = await evaluateHealthRecord('AST-TEST', '2026-09-21', normalPayload, mockConn);
  console.log(`[TEST 3] Normal check-in evaluation: Overall Status = ${normalResult.overallStatus}`);
  console.log(`         Summary: "${normalResult.evaluationSummary}"`);
  console.log(`         Action:  "${normalResult.recommendedAction}"`);
  if (normalResult.overallStatus !== 'NORMAL') {
    console.error('Normal evaluation failed!');
    process.exit(1);
  }

  // Test 4: Warning Scenario Evaluation (Baseline deviation: HR = 95 BPM with baseline 72 BPM -> +31.9%)
  const warningPayload = {
    ...normalPayload,
    HEART_RATE: 95 // Exceeds 20% deviation threshold
  };
  const warnResult = await evaluateHealthRecord('AST-TEST', '2026-09-21', warningPayload, mockConn);
  console.log(`\n[TEST 4] Warning check-in evaluation: Overall Status = ${warnResult.overallStatus}`);
  console.log(`         Summary: "${warnResult.evaluationSummary}"`);
  console.log(`         Action:  "${warnResult.recommendedAction}"`);
  if (warnResult.overallStatus !== 'WARNING') {
    console.error('Warning evaluation failed!');
    process.exit(1);
  }

  // Test 5: Critical Scenario Evaluation (Critical SpO2 < 90%)
  const criticalPayload = {
    ...normalPayload,
    SPO2: 88 // Critical hypoxia
  };
  const critResult = await evaluateHealthRecord('AST-TEST', '2026-09-21', criticalPayload, mockConn);
  console.log(`\n[TEST 5] Critical check-in evaluation: Overall Status = ${critResult.overallStatus}`);
  console.log(`         Summary: "${critResult.evaluationSummary}"`);
  console.log(`         Action:  "${critResult.recommendedAction}"`);
  
  // Verify mandatory wording from Section 36 item 11
  const spo2Alert = critResult.alertsToGenerate.find(a => a.indicatorId === 'SPO2');
  console.log(`         Critical SpO2 Alert Reason: "${spo2Alert ? spo2Alert.reason : 'NONE'}"`);

  if (critResult.overallStatus !== 'CRITICAL') {
    console.error('Critical evaluation failed!');
    process.exit(1);
  }
  if (!spo2Alert || spo2Alert.reason !== 'SpO₂ has fallen below the configured critical rule.') {
    console.error('Mandatory SpO2 wording failed!');
    process.exit(1);
  }

  console.log('\n--- ALL STEP 3 RULE ENGINE & BASELINE TESTS PASSED! ---');
}

runTests();
