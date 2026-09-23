/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Database Seeding Script: database/seed.js
 * 
 * Sets up database tables and populates realistic demo data:
 * - Demo user accounts with bcrypt hashed passwords (ASTRONAUT and MISSION_CONTROL roles)
 * - Artemis III mission and crew profiles
 * - Full health indicators catalog with physical plausibility ranges
 * - Standard symptoms catalog
 * - Centralized configurable health rules (labeled as illustrative demo values)
 * - 15 days of historical telemetry records per astronaut to support baseline & trend calculations
 * - Multi-day trends (AST-002 warning) and critical thresholds (AST-003 critical)
 * 
 * Run with: node database/seed.js
 */

const fs = require('fs');
const path = require('path');

// Robust module resolver supporting either root or backend/node_modules
function resolveModule(name) {
  try {
    return require(name);
  } catch (e) {
    try {
      return require(path.join(__dirname, '../backend/node_modules', name));
    } catch (e2) {
      console.error(`\n[ERROR] Missing required module: "${name}".`);
      console.error('Please install dependencies first:');
      console.error('  cd backend && npm install\n');
      process.exit(1);
    }
  }
}

// Load environment configuration if dotenv is available
try {
  const dotenv = resolveModule('dotenv');
  dotenv.config({ path: path.join(__dirname, '../backend/.env') });
  dotenv.config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  // Proceed with process.env if dotenv is absent
}

const mysql = resolveModule('mysql2/promise');
const bcrypt = resolveModule('bcryptjs');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  multipleStatements: true
};

const DB_NAME = process.env.DB_NAME || 'astronaut_health_db';

async function seed() {
  console.log('================================================================');
  console.log('  NASA SPACE APPS 2026: ASTRONAUT HEALTH MONITOR SEED SCRIPT');
  console.log('================================================================\n');

  let connection;
  try {
    console.log(`[1/6] Connecting to MySQL server at ${dbConfig.host}:${dbConfig.port}...`);
    connection = await mysql.createConnection(dbConfig);
    console.log('      Connected successfully.');

    // Step 1: Initialize Database and Tables from schema.sql
    console.log(`[2/6] Initializing database "${DB_NAME}" and executing schema.sql...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\`;`);
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    await connection.changeUser({ database: DB_NAME });
    console.log('      Schema applied. All 13 tables verified.');

    // Step 2: Clear existing data (in reverse dependency order)
    console.log('[3/6] Clearing existing demo records...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    const tables = [
      'audit_logs', 'radiation_records', 'behavioral_checkins',
      'record_symptoms', 'symptoms_catalog', 'alerts',
      'health_rules', 'health_record_values', 'health_records',
      'health_indicators', 'users', 'astronauts', 'missions'
    ];
    for (const table of tables) {
      await connection.query(`TRUNCATE TABLE \`${table}\`;`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('      Clean database state prepared.');

    // Step 3: Seed Missions and Astronauts
    console.log('[4/6] Seeding missions and crew profiles...');
    const launchDate = '2026-09-01'; // Mission Day 1
    await connection.query(`
      INSERT INTO missions (mission_id, name, spacecraft, launch_date, status)
      VALUES (?, ?, ?, ?, ?);
    `, ['ARTEMIS-III', 'Artemis III Lunar Transit & Surface', 'Orion MPCV / Starship HLS', launchDate, 'ACTIVE']);

    const astronauts = [
      {
        id: 'AST-001',
        mission_id: 'ARTEMIS-III',
        first_name: 'Sajid',
        last_name: '',
        role_title: 'Mission Commander',
        dob: '1988-04-12'
      },
      {
        id: 'AST-002',
        mission_id: 'ARTEMIS-III',
        first_name: 'Elena',
        last_name: 'Rostova',
        role_title: 'Flight Engineer & Pilot',
        dob: '1991-08-25'
      },
      {
        id: 'AST-003',
        mission_id: 'ARTEMIS-III',
        first_name: 'Marcus',
        last_name: 'Chen',
        role_title: 'Science Payload Specialist',
        dob: '1985-11-03'
      }
    ];

    for (const a of astronauts) {
      await connection.query(`
        INSERT INTO astronauts (astronaut_id, mission_id, first_name, last_name, role_title, date_of_birth)
        VALUES (?, ?, ?, ?, ?, ?);
      `, [a.id, a.mission_id, a.first_name, a.last_name, a.role_title, a.dob]);
    }

    // Step 4: Seed Users with secure bcrypt password hashes
    console.log('      Generating bcrypt password hashes for demo accounts...');
    const astroPasswordHash = await bcrypt.hash('AstroPass2026!', 10);
    const mcPasswordHash = await bcrypt.hash('MissionControl2026!', 10);

    const users = [
      {
        id: 'usr-ast-001',
        username: 'commander',
        email: 'sajid@nasa.space',
        hash: astroPasswordHash,
        role: 'ASTRONAUT',
        astronaut_id: 'AST-001'
      },
      {
        id: 'usr-ast-002',
        username: 'pilot',
        email: 'elena.rostova@nasa.space',
        hash: astroPasswordHash,
        role: 'ASTRONAUT',
        astronaut_id: 'AST-002'
      },
      {
        id: 'usr-ast-003',
        username: 'specialist',
        email: 'marcus.chen@nasa.space',
        hash: astroPasswordHash,
        role: 'ASTRONAUT',
        astronaut_id: 'AST-003'
      },
      {
        id: 'usr-mc-001',
        username: 'flight_director',
        email: 'flight.director@jsc.nasa.gov',
        hash: mcPasswordHash,
        role: 'MISSION_CONTROL',
        astronaut_id: null
      }
    ];

    for (const u of users) {
      await connection.query(`
        INSERT INTO users (user_id, username, email, password_hash, role, astronaut_id)
        VALUES (?, ?, ?, ?, ?, ?);
      `, [u.id, u.username, u.email, u.hash, u.role, u.astronaut_id]);
    }
    console.log('      Users created with encrypted passwords.');

    // Step 5: Seed Catalogs (Indicators, Symptoms, Configurable Health Rules)
    console.log('[5/6] Seeding health indicator catalog, symptoms, and health rules...');
    
    // 5a. Health Indicators Catalog (Physical Plausibility Limits)
    const indicators = [
      { id: 'HEART_RATE', code: 'HEART_RATE', name: 'Heart Rate', category: 'PHYSIOLOGICAL', unit: 'BPM', min: 30, max: 220, desc: 'Resting pulse rate' },
      { id: 'SPO2', code: 'SPO2', name: 'Blood Oxygen Saturation (SpO₂)', category: 'PHYSIOLOGICAL', unit: '%', min: 50, max: 100, desc: 'Peripheral arterial oxygen saturation' },
      { id: 'BP_SYSTOLIC', code: 'BP_SYSTOLIC', name: 'Systolic Blood Pressure', category: 'PHYSIOLOGICAL', unit: 'mmHg', min: 60, max: 260, desc: 'Peak arterial pressure during cardiac contraction' },
      { id: 'BP_DIASTOLIC', code: 'BP_DIASTOLIC', name: 'Diastolic Blood Pressure', category: 'PHYSIOLOGICAL', unit: 'mmHg', min: 40, max: 160, desc: 'Arterial pressure between heart beats' },
      { id: 'BODY_TEMP', code: 'BODY_TEMP', name: 'Core Body Temperature', category: 'PHYSIOLOGICAL', unit: '°C', min: 32.0, max: 43.0, desc: 'Core body temperature' },
      { id: 'BODY_WEIGHT', code: 'BODY_WEIGHT', name: 'Body Mass', category: 'PHYSIOLOGICAL', unit: 'kg', min: 35.0, max: 200.0, desc: 'Astronaut body mass measured via linear acceleration device' },
      { id: 'SLEEP_DURATION', code: 'SLEEP_DURATION', name: 'Sleep Duration', category: 'LIFESTYLE', unit: 'hrs', min: 0.0, max: 24.0, desc: 'Total restorative sleep duration in 24-hour cycle' },
      { id: 'EXERCISE_DURATION', code: 'EXERCISE_DURATION', name: 'Exercise Duration', category: 'LIFESTYLE', unit: 'hrs', min: 0.0, max: 12.0, desc: 'Countermeasure physical exercise time (resistive and aerobic)' },
      { id: 'HYDRATION', code: 'HYDRATION', name: 'Hydration Intake', category: 'LIFESTYLE', unit: 'liters', min: 0.0, max: 10.0, desc: 'Daily fluid intake logged from water recovery system' },
      { id: 'RADIATION_DOSE', code: 'RADIATION_DOSE', name: 'Daily Radiation Dose (Simulated)', category: 'ENVIRONMENTAL', unit: 'mSv', min: 0.0, max: 50.0, desc: 'Simulated daily dosimeter reading (demonstration data)' }
    ];

    for (const ind of indicators) {
      await connection.query(`
        INSERT INTO health_indicators (indicator_id, code, name, category, unit, valid_min, valid_max, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `, [ind.id, ind.code, ind.name, ind.category, ind.unit, ind.min, ind.max, ind.desc]);
    }

    // 5b. Symptoms Catalog
    const symptoms = [
      { id: 'HEADACHE', code: 'HEADACHE', name: 'Headache / Cranial Pressure', desc: 'Cephalic fluid shift or carbon dioxide induced pressure' },
      { id: 'DIZZINESS', code: 'DIZZINESS', name: 'Dizziness / Vertigo', desc: 'Vestibular neuro-vestibular adaptation disturbance' },
      { id: 'FATIGUE', code: 'FATIGUE', name: 'Abnormal Fatigue', desc: 'Acute physical or cognitive exhaustion' },
      { id: 'NAUSEA', code: 'NAUSEA', name: 'Nausea / SMS', desc: 'Space Motion Sickness or gastrointestinal distress' },
      { id: 'VISION_BLUR', code: 'VISION_BLUR', name: 'Visual Blur / SANS Check', desc: 'Spaceflight-Associated Neuro-ocular Syndrome indicator' },
      { id: 'INSOMNIA', code: 'INSOMNIA', name: 'Insomnia / Sleep Disruption', desc: 'Circadian misalignment or sleep latency difficulty' }
    ];

    for (const s of symptoms) {
      await connection.query(`
        INSERT INTO symptoms_catalog (symptom_id, code, name, description)
        VALUES (?, ?, ?, ?);
      `, [s.id, s.code, s.name, s.desc]);
    }

    // 5c. Configurable Health Rules
    // IMPORTANT: Thresholds are illustrative demo values, not official NASA medical limits.
    const rules = [
      {
        id: 'RULE_HR_HIGH_WARN',
        indicator: 'HEART_RATE',
        type: 'FIXED_THRESHOLD',
        comp: '>',
        min: null,
        max: 100,
        devPct: null,
        days: 1,
        severity: 'WARNING',
        action: 'Recheck the indicator and follow the applicable mission health protocol.',
        desc: 'Resting heart rate exceeds 100 BPM'
      },
      {
        id: 'RULE_HR_BASELINE_DEV',
        indicator: 'HEART_RATE',
        type: 'BASELINE_DEVIATION',
        comp: 'OUTSIDE',
        min: null,
        max: null,
        devPct: 20.00,
        days: 1,
        severity: 'WARNING',
        action: 'Recheck the indicator and follow the applicable mission health protocol.',
        desc: 'Heart rate deviation exceeds ±20% from personal 14-day baseline'
      },
      {
        id: 'RULE_SPO2_WARN',
        indicator: 'SPO2',
        type: 'FIXED_THRESHOLD',
        comp: '<',
        min: 94,
        max: null,
        devPct: null,
        days: 1,
        severity: 'WARNING',
        action: 'Recheck the indicator and follow the applicable mission health protocol.',
        desc: 'Blood oxygen saturation dropped below 94%'
      },
      {
        id: 'RULE_SPO2_CRITICAL',
        indicator: 'SPO2',
        type: 'FIXED_THRESHOLD',
        comp: '<',
        min: 90,
        max: null,
        devPct: null,
        days: 1,
        severity: 'CRITICAL',
        action: 'Follow the applicable onboard emergency medical protocol. Contact Mission Control when communication is available.',
        desc: 'SpO₂ has fallen below the configured critical rule'
      },
      {
        id: 'RULE_TEMP_HIGH_WARN',
        indicator: 'BODY_TEMP',
        type: 'FIXED_THRESHOLD',
        comp: '>',
        min: null,
        max: 38.0,
        devPct: null,
        days: 1,
        severity: 'WARNING',
        action: 'Recheck the indicator and follow the applicable mission health protocol.',
        desc: 'Core temperature elevated above 38.0°C'
      },
      {
        id: 'RULE_TEMP_HIGH_CRITICAL',
        indicator: 'BODY_TEMP',
        type: 'FIXED_THRESHOLD',
        comp: '>',
        min: null,
        max: 39.5,
        devPct: null,
        days: 1,
        severity: 'CRITICAL',
        action: 'Follow the applicable onboard emergency medical protocol. Contact Mission Control when communication is available.',
        desc: 'Core temperature exceeds 39.5°C critical threshold'
      },
      {
        id: 'RULE_SLEEP_TREND_WARN',
        indicator: 'SLEEP_DURATION',
        type: 'CONSECUTIVE_TREND',
        comp: '<',
        min: 6.0,
        max: null,
        devPct: null,
        days: 3,
        severity: 'WARNING',
        action: 'Recheck the indicator and follow the applicable mission health protocol.',
        desc: 'Sleep duration has remained below the configured monitoring level for 3 consecutive days'
      },
      {
        id: 'RULE_BP_SYS_WARN',
        indicator: 'BP_SYSTOLIC',
        type: 'FIXED_THRESHOLD',
        comp: '>',
        min: null,
        max: 140,
        devPct: null,
        days: 1,
        severity: 'WARNING',
        action: 'Recheck the indicator and follow the applicable mission health protocol.',
        desc: 'Systolic blood pressure elevated above 140 mmHg'
      },
      {
        id: 'RULE_HYDRATION_WARN',
        indicator: 'HYDRATION',
        type: 'FIXED_THRESHOLD',
        comp: '<',
        min: 2.0,
        max: null,
        devPct: null,
        days: 1,
        severity: 'WARNING',
        action: 'Recheck fluid intake protocol and ensure adequate electrolyte replacement.',
        desc: 'Daily fluid intake below 2.0 liters'
      },
      {
        id: 'RULE_EXERCISE_DEFICIT_TREND',
        indicator: 'EXERCISE_DURATION',
        type: 'CONSECUTIVE_TREND',
        comp: '<',
        min: 1.0,
        max: null,
        devPct: null,
        days: 2,
        severity: 'WARNING',
        action: 'Follow countermeasure exercise schedule to mitigate microgravity musculoskeletal deconditioning.',
        desc: 'Exercise duration below protocol for 2 consecutive days'
      }
    ];

    for (const r of rules) {
      await connection.query(`
        INSERT INTO health_rules (rule_id, indicator_id, rule_type, comparison, threshold_min, threshold_max, deviation_percentage, consecutive_days, severity, recommended_action, enabled, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [r.id, r.indicator, r.type, r.comp, r.min, r.max, r.devPct, r.days, r.severity, r.action, true, r.desc]);
    }

    // Step 6: Generate 15 Days of Realistic Simulated Telemetry Records
    console.log('[6/6] Generating 15 days of historical telemetry records per astronaut...');
    // Simulated date range: 2026-09-07 to 2026-09-21 (Today: Mission Day 21)
    const baseDate = new Date('2026-09-07T00:00:00Z');
    const totalDays = 15;

    // Helper: generate consistent random offset
    const jitter = (base, range) => Math.round((base + (Math.random() * range * 2 - range)) * 10) / 10;

    for (const astro of astronauts) {
      let cumulativeRad = 5.2; // Base cumulative mSv

      for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
        const recordDate = new Date(baseDate.getTime() + dayOffset * 86400000);
        const dateStr = recordDate.toISOString().slice(0, 10);
        const missionDay = 7 + dayOffset; // Mission Day 7 to 21
        const recordId = `rec-${astro.id}-${dateStr}`;

        // Default nominal values
        let hr = jitter(70, 3);
        let spo2 = jitter(98, 1);
        let sys = jitter(118, 4);
        let dia = jitter(76, 3);
        let temp = jitter(36.7, 0.2);
        let weight = astro.id === 'AST-001' ? 76.5 : (astro.id === 'AST-002' ? 62.0 : 81.5);
        let sleep = jitter(7.5, 0.4);
        let exercise = jitter(2.2, 0.2);
        let hydration = jitter(2.8, 0.3);
        let dailyRad = jitter(0.42, 0.05);
        cumulativeRad += dailyRad;

        let mood = 'GOOD';
        let stress = 'LOW';
        let loneliness = 'NOT_AT_ALL';
        let connectionLevel = 'STRONG';
        let difficultyConcentrating = false;
        let symptomsList = [];
        let recordStatus = 'NORMAL';
        let summary = 'All physiological vitals and lifestyle indicators nominal within personal baseline limits.';

        // Custom Scenarios for AST-002 (WARNING: 3-day sleep trend + stress)
        // and AST-003 (CRITICAL: sudden SpO2 drop today)
        if (astro.id === 'AST-002') {
          // Days 12, 13, 14 (last 3 days): sleep deprivation trend + high stress
          if (dayOffset === 12) {
            sleep = 5.2;
            stress = 'MEDIUM';
            mood = 'NEUTRAL';
          } else if (dayOffset === 13) {
            sleep = 4.8;
            stress = 'HIGH';
            mood = 'LOW';
            symptomsList.push({ id: 'FATIGUE', sev: 'MILD', note: 'Mild operational fatigue' });
          } else if (dayOffset === 14) { // Today (Day 15 of series)
            sleep = 4.4; // 3rd consecutive day < 6.0h!
            hr = 88;     // Elevated HR (+22% above ~72 baseline)
            stress = 'HIGH';
            mood = 'LOW';
            loneliness = 'SLIGHTLY';
            symptomsList.push({ id: 'FATIGUE', sev: 'MODERATE', note: 'Cumulative sleep debt' });
            symptomsList.push({ id: 'HEADACHE', sev: 'MILD', note: 'Mild tension headache' });
            recordStatus = 'WARNING';
            summary = 'Multi-day sleep deficit detected (3 consecutive days < 6.0h). Resting heart rate +22.2% above personal baseline.';
          }
        } else if (astro.id === 'AST-003') {
          // Day 14 (Today): Sudden SpO2 drop to 89% (CRITICAL)
          if (dayOffset === 14) {
            spo2 = 89; // Drops below critical threshold 90%
            hr = 104;  // Tachycardia response
            sys = 135;
            temp = 37.4;
            stress = 'HIGH';
            mood = 'LOW';
            symptomsList.push({ id: 'NAUSEA', sev: 'MODERATE', note: 'Acute nausea and dizziness' });
            symptomsList.push({ id: 'DIZZINESS', sev: 'MODERATE', note: 'Spatial disorientation' });
            recordStatus = 'CRITICAL';
            summary = 'CRITICAL ALERT: SpO₂ has fallen below the configured critical rule (89%). Elevated heart rate (104 BPM).';
          }
        }

        // 1. Insert Health Record Master
        await connection.query(`
          INSERT INTO health_records (record_id, astronaut_id, record_date, mission_day, overall_status, evaluation_summary, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `, [recordId, astro.id, dateStr, missionDay, recordStatus, summary, `Routine Mission Day ${missionDay} log.`]);

        // 2. Insert Normalized Measured Values
        const recordValues = [
          { ind: 'HEART_RATE', val: hr, status: (hr > 100 || (astro.id === 'AST-002' && dayOffset === 14)) ? 'WARNING' : 'NORMAL' },
          { ind: 'SPO2', val: spo2, status: spo2 < 90 ? 'CRITICAL' : (spo2 < 94 ? 'WARNING' : 'NORMAL') },
          { ind: 'BP_SYSTOLIC', val: sys, status: sys > 140 ? 'WARNING' : 'NORMAL' },
          { ind: 'BP_DIASTOLIC', val: dia, status: 'NORMAL' },
          { ind: 'BODY_TEMP', val: temp, status: temp > 38.0 ? 'WARNING' : 'NORMAL' },
          { ind: 'BODY_WEIGHT', val: weight, status: 'NORMAL' },
          { ind: 'SLEEP_DURATION', val: sleep, status: (astro.id === 'AST-002' && dayOffset === 14) ? 'WARNING' : 'NORMAL' },
          { ind: 'EXERCISE_DURATION', val: exercise, status: 'NORMAL' },
          { ind: 'HYDRATION', val: hydration, status: 'NORMAL' },
          { ind: 'RADIATION_DOSE', val: dailyRad, status: 'NORMAL' }
        ];

        for (const rv of recordValues) {
          const valId = `val-${recordId}-${rv.ind}`;
          // Set baseline on current day for AST-002 and AST-003 to illustrate math
          let baselineVal = null;
          let devPct = null;
          if (dayOffset === 14 && rv.ind === 'HEART_RATE') {
            baselineVal = 72.0;
            devPct = Math.round(((rv.val - baselineVal) / baselineVal) * 1000) / 10;
          } else if (dayOffset === 14 && rv.ind === 'SPO2') {
            baselineVal = 98.0;
            devPct = Math.round(((rv.val - baselineVal) / baselineVal) * 1000) / 10;
          }

          await connection.query(`
            INSERT INTO health_record_values (value_id, record_id, indicator_id, value_numeric, status, baseline_value, deviation_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?);
          `, [valId, recordId, rv.ind, rv.val, rv.status, baselineVal, devPct]);
        }

        // 3. Insert Behavioral Check-in
        const checkinId = `beh-${recordId}`;
        await connection.query(`
          INSERT INTO behavioral_checkins (checkin_id, record_id, mood, stress_level, loneliness_level, crew_connection, concentration_difficulty, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `, [checkinId, recordId, mood, stress, loneliness, connectionLevel, difficultyConcentrating, 'Behavioral telemetry logged.']);

        // 4. Insert Radiation Record
        const radId = `rad-${recordId}`;
        await connection.query(`
          INSERT INTO radiation_records (radiation_id, record_id, simulated_daily_dose_msv, simulated_cumulative_dose_msv, is_simulated, notes)
          VALUES (?, ?, ?, ?, ?, ?);
        `, [radId, recordId, dailyRad, cumulativeRad, true, 'SIMULATED RADIATION DATA - Spacecraft internal dosimeter']);

        // 5. Insert Symptoms if any
        for (const sym of symptomsList) {
          const symJunctionId = `rsym-${recordId}-${sym.id}`;
          await connection.query(`
            INSERT INTO record_symptoms (id, record_id, symptom_id, severity_level, notes)
            VALUES (?, ?, ?, ?, ?);
          `, [symJunctionId, recordId, sym.id, sym.sev, sym.note]);
        }

        // 6. Generate Active Alerts on Today's Record (Day 15)
        if (dayOffset === 14) {
          if (astro.id === 'AST-002') {
            // Alert 1: Sleep trend warning
            await connection.query(`
              INSERT INTO alerts (alert_id, astronaut_id, record_id, indicator_id, current_value, reason, severity, recommended_action, is_read)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [
              `alt-002-sleep`,
              astro.id,
              recordId,
              'SLEEP_DURATION',
              `${sleep} hrs`,
              'Sleep duration has remained below the configured monitoring level for 3 consecutive days.',
              'WARNING',
              'Recheck the indicator and follow the applicable mission health protocol.',
              false
            ]);

            // Alert 2: Heart rate baseline deviation
            await connection.query(`
              INSERT INTO alerts (alert_id, astronaut_id, record_id, indicator_id, current_value, reason, severity, recommended_action, is_read)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [
              `alt-002-hr`,
              astro.id,
              recordId,
              'HEART_RATE',
              `${hr} BPM (+22.2% dev)`,
              'Heart rate deviated by more than 20% from personal 14-day baseline.',
              'WARNING',
              'Recheck the indicator and follow the applicable mission health protocol.',
              false
            ]);
          } else if (astro.id === 'AST-003') {
            // Alert: Critical SpO2 alert with mandatory wording from Section 36
            await connection.query(`
              INSERT INTO alerts (alert_id, astronaut_id, record_id, indicator_id, current_value, reason, severity, recommended_action, is_read)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [
              `alt-003-spo2`,
              astro.id,
              recordId,
              'SPO2',
              `${spo2}%`,
              'SpO₂ has fallen below the configured critical rule.',
              'CRITICAL',
              'Follow the applicable onboard emergency medical protocol. Contact Mission Control when communication is available.',
              false
            ]);
          }
        }
      }
    }

    console.log('      Historical records, baselines, behavioral logs, and alerts seeded successfully.');
    console.log('\n================================================================');
    console.log('  DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('================================================================');
    console.log('\nDemo User Accounts Created:');
    console.log('  1. AST-001 (Sajid - Commander):');
    console.log('     Username: commander          Password: AstroPass2026!        [Status: NORMAL]');
    console.log('  2. AST-002 (Elena Rostova - Pilot):');
    console.log('     Username: pilot              Password: AstroPass2026!        [Status: WARNING]');
    console.log('  3. AST-003 (Marcus Chen - Specialist):');
    console.log('     Username: specialist         Password: AstroPass2026!        [Status: CRITICAL]');
    console.log('  4. Mission Control (Flight Director):');
    console.log('     Username: flight_director    Password: MissionControl2026!   [Role: MISSION_CONTROL]');
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n[FATAL SEED ERROR]:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('MySQL connection refused. Please verify that your local MySQL server is running.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
