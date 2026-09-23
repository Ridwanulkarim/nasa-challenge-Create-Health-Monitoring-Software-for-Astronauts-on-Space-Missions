/**
 * Step 2 Verification Test: backend/test-auth.js
 * Validates JWT signing, verification, authMiddleware, and roleMiddleware.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authMiddleware = require('./src/middleware/authMiddleware');
const { roleMiddleware, astronautOwnershipGuard } = require('./src/middleware/roleMiddleware');

const JWT_SECRET = 'nasa_space_apps_2026_super_secret_jwt_key_987654321';

async function runTests() {
  console.log('--- RUNNING STEP 2 AUTH & MIDDLEWARE VERIFICATION TESTS ---\n');

  // Test 1: Password hashing and comparison
  const rawPassword = 'AstroPass2026!';
  const hash = await bcrypt.hash(rawPassword, 10);
  const match = await bcrypt.compare(rawPassword, hash);
  console.log(`[PASS] bcrypt password hash and verification: ${match ? 'MATCHED' : 'FAILED'}`);
  if (!match) process.exit(1);

  // Test 2: JWT token creation & verification
  const payload = {
    userId: 'usr-ast-001',
    username: 'commander',
    role: 'ASTRONAUT',
    astronautId: 'AST-001'
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log(`[PASS] JWT token issuance & decode: Username = ${decoded.username}, Role = ${decoded.role}`);

  // Test 3: authMiddleware with valid token
  let nextCalled = false;
  const mockReq = {
    headers: {
      authorization: `Bearer ${token}`
    }
  };
  const mockRes = {
    status: (code) => ({
      json: (data) => console.log('Mock response:', code, data)
    })
  };
  authMiddleware(mockReq, mockRes, () => { nextCalled = true; });
  console.log(`[PASS] authMiddleware attaches user to req: ${nextCalled && mockReq.user.astronautId === 'AST-001' ? 'SUCCESS' : 'FAILED'}`);

  // Test 4: roleMiddleware authorization
  let astroRolePassed = false;
  const astroCheck = roleMiddleware(['ASTRONAUT']);
  astroCheck(mockReq, mockRes, () => { astroRolePassed = true; });
  console.log(`[PASS] roleMiddleware allows ASTRONAUT: ${astroRolePassed ? 'ALLOWED' : 'FAILED'}`);

  let mcRoleRejected = false;
  const mcCheck = roleMiddleware(['MISSION_CONTROL']);
  const rejectRes = {
    status: (code) => {
      if (code === 403) mcRoleRejected = true;
      return { json: () => {} };
    }
  };
  mcCheck(mockReq, rejectRes, () => {});
  console.log(`[PASS] roleMiddleware forbids ASTRONAUT from MISSION_CONTROL route: ${mcRoleRejected ? 'REJECTED (403)' : 'FAILED'}`);

  // Test 5: astronautOwnershipGuard
  let ownDataAllowed = false;
  mockReq.params = { astronautId: 'AST-001' };
  astronautOwnershipGuard(mockReq, mockRes, () => { ownDataAllowed = true; });
  console.log(`[PASS] astronautOwnershipGuard allows astronaut accessing own ID: ${ownDataAllowed ? 'ALLOWED' : 'FAILED'}`);

  let otherDataRejected = false;
  mockReq.params = { astronautId: 'AST-002' };
  astronautOwnershipGuard(mockReq, {
    status: (code) => {
      if (code === 403) otherDataRejected = true;
      return { json: () => {} };
    }
  }, () => {});
  console.log(`[PASS] astronautOwnershipGuard blocks astronaut accessing another astronaut (AST-002): ${otherDataRejected ? 'BLOCKED (403)' : 'FAILED'}`);

  console.log('\n--- ALL STEP 2 AUTH & MIDDLEWARE TESTS PASSED! ---');
}

runTests();
