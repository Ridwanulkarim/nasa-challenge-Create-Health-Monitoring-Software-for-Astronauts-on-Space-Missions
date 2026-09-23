/**
 * Step 4 In-Process Verification Test: backend/test-step4-api.js
 * Validates endpoint handlers, research catalog, and physical input range validation in-process.
 */

const { getResearchData } = require('./src/controllers/researchController');
const { submitHealthCheckin } = require('./src/controllers/healthController');

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('--- RUNNING STEP 4 REST API IN-PROCESS VERIFICATION TESTS ---\n');

  // Test 1: NASA Research Controller
  const mockReqResearch = {};
  const mockResResearch = createMockRes();
  getResearchData(mockReqResearch, mockResResearch);

  console.log(`[TEST 1] GET /api/research: Status = ${mockResResearch.statusCode}`);
  console.log(`         Hazards Count: ${mockResResearch.data.hazards.length}`);
  console.log(`         First Hazard:  "${mockResResearch.data.hazards[0].title}"`);
  console.log(`         Verified Sources Count: ${mockResResearch.data.sources.length}`);
  if (mockResResearch.statusCode !== 200 || mockResResearch.data.hazards.length !== 5) {
    console.error('Research catalog test failed!');
    process.exit(1);
  }

  // Test 2: Physical Range Validation Rejection (e.g. Heart Rate 5000 BPM)
  const mockReqInvalid = {
    user: { astronautId: 'AST-001', role: 'ASTRONAUT' },
    body: {
      record_date: '2026-09-21',
      indicators: {
        HEART_RATE: 5000, // Physically impossible
        SPO2: 98
      }
    }
  };
  const mockResInvalid = createMockRes();
  await submitHealthCheckin(mockReqInvalid, mockResInvalid, (err) => console.error(err));

  console.log(`\n[TEST 2] Physical range validation rejection: Status = ${mockResInvalid.statusCode}`);
  console.log(`         Error: "${mockResInvalid.data.error}"`);
  console.log(`         Details: "${mockResInvalid.data.details[0]}"`);

  if (mockResInvalid.statusCode !== 400 || !mockResInvalid.data.details[0].includes('outside plausible physical range')) {
    console.error('Physical range validation test failed!');
    process.exit(1);
  }

  // Test 3: Physical Range Validation Rejection (Negative weight)
  const mockReqNegative = {
    user: { astronautId: 'AST-001', role: 'ASTRONAUT' },
    body: {
      record_date: '2026-09-21',
      indicators: {
        BODY_WEIGHT: -15 // Physically impossible
      }
    }
  };
  const mockResNegative = createMockRes();
  await submitHealthCheckin(mockReqNegative, mockResNegative, (err) => console.error(err));
  console.log(`\n[TEST 3] Negative weight rejection: Status = ${mockResNegative.statusCode}`);
  console.log(`         Details: "${mockResNegative.data.details[0]}"`);

  if (mockResNegative.statusCode !== 400) {
    console.error('Negative weight validation test failed!');
    process.exit(1);
  }

  console.log('\n--- ALL STEP 4 REST API VERIFICATION TESTS PASSED! ---');
}

runTests();
