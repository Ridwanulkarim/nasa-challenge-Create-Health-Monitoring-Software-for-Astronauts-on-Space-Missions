/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Autonomous In-Memory Deep-Space Telemetry Store: backend/src/services/inMemoryStore.js
 * 
 * Provides an offline, high-fidelity spacecraft simulation engine that activates
 * whenever MySQL is offline, unreachable (e.g. ECONNREFUSED), or deployed on cloud
 * serverless runtimes (such as Vercel).
 */

const bcrypt = require('bcryptjs');

// Generate 15 days of historical telemetry records
const baseDate = new Date('2026-09-08T00:00:00Z');
const totalDays = 15;

const ASTRONAUTS = [
  {
    astronaut_id: 'AST-001',
    mission_id: 'ARTEMIS-III',
    first_name: 'Sajid',
    last_name: '',
    role_title: 'Mission Commander',
    date_of_birth: '1988-04-12',
    created_at: '2026-09-01T00:00:00Z'
  },
  {
    astronaut_id: 'AST-002',
    mission_id: 'ARTEMIS-III',
    first_name: 'Elena',
    last_name: 'Rostova',
    role_title: 'Flight Engineer & Pilot',
    date_of_birth: '1991-08-25',
    created_at: '2026-09-01T00:00:00Z'
  },
  {
    astronaut_id: 'AST-003',
    mission_id: 'ARTEMIS-III',
    first_name: 'Marcus',
    last_name: 'Chen',
    role_title: 'Science Payload Specialist',
    date_of_birth: '1985-11-03',
    created_at: '2026-09-01T00:00:00Z'
  }
];

const MISSIONS = [
  {
    mission_id: 'ARTEMIS-III',
    name: 'Artemis III Lunar Transit & Surface',
    spacecraft: 'Orion MPCV / Starship HLS',
    launch_date: '2026-09-01',
    status: 'ACTIVE'
  }
];

const INDICATORS = [
  { indicator_id: 'HEART_RATE', code: 'HEART_RATE', name: 'Heart Rate', category: 'PHYSIOLOGICAL', unit: 'BPM', min: 30, max: 220 },
  { indicator_id: 'SPO2', code: 'SPO2', name: 'Blood Oxygen Saturation (SpO₂)', category: 'PHYSIOLOGICAL', unit: '%', min: 50, max: 100 },
  { indicator_id: 'BP_SYSTOLIC', code: 'BP_SYSTOLIC', name: 'Systolic Blood Pressure', category: 'PHYSIOLOGICAL', unit: 'mmHg', min: 60, max: 260 },
  { indicator_id: 'BP_DIASTOLIC', code: 'BP_DIASTOLIC', name: 'Diastolic Blood Pressure', category: 'PHYSIOLOGICAL', unit: 'mmHg', min: 40, max: 160 },
  { indicator_id: 'BODY_TEMP', code: 'BODY_TEMP', name: 'Core Body Temperature', category: 'PHYSIOLOGICAL', unit: '°C', min: 32.0, max: 43.0 },
  { indicator_id: 'BODY_WEIGHT', code: 'BODY_WEIGHT', name: 'Body Mass', category: 'PHYSIOLOGICAL', unit: 'kg', min: 35.0, max: 200.0 },
  { indicator_id: 'SLEEP_DURATION', code: 'SLEEP_DURATION', name: 'Sleep Duration', category: 'LIFESTYLE', unit: 'hrs', min: 0.0, max: 24.0 },
  { indicator_id: 'EXERCISE_DURATION', code: 'EXERCISE_DURATION', name: 'Exercise Duration', category: 'LIFESTYLE', unit: 'hrs', min: 0.0, max: 12.0 },
  { indicator_id: 'HYDRATION', code: 'HYDRATION', name: 'Hydration Intake', category: 'LIFESTYLE', unit: 'liters', min: 0.0, max: 10.0 },
  { indicator_id: 'RADIATION_DOSE', code: 'RADIATION_DOSE', name: 'Daily Radiation Dose (Simulated)', category: 'ENVIRONMENTAL', unit: 'mSv', min: 0.0, max: 50.0 }
];

let USERS = [
  {
    user_id: 'usr-ast-001',
    username: 'commander',
    email: 'sajid@nasa.space',
    password_hash: bcrypt.hashSync('AstroPass2026!', 6),
    role: 'ASTRONAUT',
    astronaut_id: 'AST-001'
  },
  {
    user_id: 'usr-ast-002',
    username: 'pilot',
    email: 'elena.rostova@nasa.space',
    password_hash: bcrypt.hashSync('AstroPass2026!', 6),
    role: 'ASTRONAUT',
    astronaut_id: 'AST-002'
  },
  {
    user_id: 'usr-ast-003',
    username: 'specialist',
    email: 'marcus.chen@nasa.space',
    password_hash: bcrypt.hashSync('AstroPass2026!', 6),
    role: 'ASTRONAUT',
    astronaut_id: 'AST-003'
  },
  {
    user_id: 'usr-mc-001',
    username: 'flight_director',
    email: 'flight.director@jsc.nasa.gov',
    password_hash: bcrypt.hashSync('MissionControl2026!', 6),
    role: 'MISSION_CONTROL',
    astronaut_id: null
  }
];

let HEALTH_RECORDS = [];
let HEALTH_RECORD_VALUES = [];
let BEHAVIORAL_CHECKINS = [];
let RADIATION_RECORDS = [];
let ALERTS = [];
let COUNTERMEASURE_LOGS = [];

// Seed 15 days of telemetry for AST-001, AST-002, AST-003
function initializeTelemetry() {
  HEALTH_RECORDS = [];
  HEALTH_RECORD_VALUES = [];
  BEHAVIORAL_CHECKINS = [];
  RADIATION_RECORDS = [];
  ALERTS = [];
  COUNTERMEASURE_LOGS = [];

  const jitter = (base, range) => Math.round((base + (Math.sin(base) * range)) * 10) / 10;

  for (const astro of ASTRONAUTS) {
    let cumulativeRad = 5.2;

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const recDate = new Date(baseDate.getTime() + dayOffset * 86400000);
      const dateStr = recDate.toISOString().slice(0, 10);
      const missionDay = 8 + dayOffset;
      const recordId = `rec-${astro.astronaut_id}-${dateStr}`;

      let hr = 72 + (dayOffset % 3);
      let spo2 = 98 - (dayOffset % 2);
      let sys = 118 + (dayOffset % 4);
      let dia = 76 + (dayOffset % 3);
      let temp = 36.8;
      let weight = astro.astronaut_id === 'AST-001' ? 76.5 : (astro.astronaut_id === 'AST-002' ? 62.0 : 81.5);
      let sleep = 7.4 + (dayOffset % 2) * 0.4;
      let exercise = 2.0;
      let hydration = 2.8;
      let dailyRad = 0.42;
      cumulativeRad += dailyRad;

      let mood = 'GOOD';
      let stress = 'LOW';
      let recordStatus = 'NORMAL';
      let summary = 'All physiological vitals and lifestyle indicators nominal within personal baseline limits.';

      // Astronaut 2 (Warning scenario: sleep deficit trend)
      if (astro.astronaut_id === 'AST-002' && dayOffset >= 12) {
        sleep = 4.6;
        hr = 88;
        stress = 'HIGH';
        mood = 'LOW';
        recordStatus = 'WARNING';
        summary = 'Multi-day sleep deficit detected (3 consecutive days < 6.0h). Resting heart rate +22.2% above baseline.';
      }

      // Astronaut 3 (Critical scenario: SpO2 drop today)
      if (astro.astronaut_id === 'AST-003' && dayOffset === 14) {
        spo2 = 89;
        hr = 104;
        sys = 136;
        stress = 'HIGH';
        recordStatus = 'CRITICAL';
        summary = 'CRITICAL ALERT: SpO₂ has fallen below configured safety threshold (89%). Tachycardia response detected.';
      }

      HEALTH_RECORDS.push({
        record_id: recordId,
        astronaut_id: astro.astronaut_id,
        record_date: `${dateStr}T12:00:00.000Z`,
        mission_day: missionDay,
        overall_status: recordStatus,
        evaluation_summary: summary,
        notes: `Telemetry batch for Day ${missionDay}`,
        updated_at: new Date().toISOString()
      });

      // Values
      const valuesMap = {
        HEART_RATE: { val: hr, baseline: 72, dev: Math.round(((hr - 72) / 72) * 100) },
        SPO2: { val: spo2, baseline: 98, dev: Math.round(((spo2 - 98) / 98) * 100) },
        BP_SYSTOLIC: { val: sys, baseline: 118, dev: 0 },
        BP_DIASTOLIC: { val: dia, baseline: 76, dev: 0 },
        BODY_TEMP: { val: temp, baseline: 36.8, dev: 0 },
        BODY_WEIGHT: { val: weight, baseline: weight, dev: 0 },
        SLEEP_DURATION: { val: sleep, baseline: 7.5, dev: 0 },
        EXERCISE_DURATION: { val: exercise, baseline: 2.0, dev: 0 },
        HYDRATION: { val: hydration, baseline: 2.8, dev: 0 },
        RADIATION_DOSE: { val: dailyRad, baseline: 0.42, dev: 0 }
      };

      for (const ind of INDICATORS) {
        const item = valuesMap[ind.indicator_id] || { val: 0, baseline: null, dev: null };
        HEALTH_RECORD_VALUES.push({
          id: `val-${recordId}-${ind.indicator_id}`,
          record_id: recordId,
          indicator_id: ind.indicator_id,
          name: ind.name,
          unit: ind.unit,
          category: ind.category,
          value_numeric: item.val.toFixed(2),
          status: (ind.indicator_id === 'SPO2' && item.val < 90) ? 'CRITICAL' : ((ind.indicator_id === 'SLEEP_DURATION' && item.val < 6.0) ? 'WARNING' : 'NORMAL'),
          baseline_value: item.baseline ? item.baseline.toFixed(2) : null,
          deviation_pct: item.dev !== null ? item.dev.toFixed(2) : null
        });
      }

      BEHAVIORAL_CHECKINS.push({
        record_id: recordId,
        mood,
        stress_level: stress,
        loneliness_level: 'NOT_AT_ALL',
        crew_connection: 'STRONG',
        concentration_difficulty: 0
      });

      RADIATION_RECORDS.push({
        record_id: recordId,
        simulated_daily_dose_msv: dailyRad.toFixed(3),
        simulated_cumulative_dose_msv: cumulativeRad.toFixed(3)
      });
    }

    // Default Alerts for AST-001
    ALERTS.push({
      alert_id: 'alt-AST001-RAD-01',
      astronaut_id: 'AST-001',
      record_id: `rec-AST-001-${baseDate.toISOString().slice(0, 10)}`,
      indicator_id: 'RADIATION_DOSE',
      indicator_name: 'Cosmic Radiation Dosimeter',
      indicator_unit: 'mSv',
      current_value: '0.48 mSv',
      reason: 'Elevated Galactic Cosmic Ray (GCR) flux detected during transit trajectory.',
      severity: 'WARNING',
      recommended_action: 'Verify habitat storm shelter shielding and check dosimeter sensor calibration.',
      is_read: 0,
      read_at: null,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    });

    ALERTS.push({
      alert_id: 'alt-AST001-SPO2-02',
      astronaut_id: 'AST-001',
      record_id: `rec-AST-001-${baseDate.toISOString().slice(0, 10)}`,
      indicator_id: 'SPO2',
      indicator_name: 'Blood Oxygen Saturation (SpO₂)',
      indicator_unit: '%',
      current_value: '93%',
      reason: 'SpO2 transient reduction during high-intensity EVA exercise protocol.',
      severity: 'WARNING',
      recommended_action: 'Increase ECLSS cabin O2 concentration and maintain 15-minute rest interval.',
      is_read: 1,
      read_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 3600000 * 20).toISOString()
    });

    // Active Alert for AST-002
    ALERTS.push({
      alert_id: 'alt-AST002-SLEEP-01',
      astronaut_id: 'AST-002',
      record_id: `rec-AST-002-2026-09-22`,
      indicator_id: 'SLEEP_DURATION',
      indicator_name: 'Sleep Duration',
      indicator_unit: 'hrs',
      current_value: '4.4 hrs',
      reason: 'Multi-day sleep deficit detected (3 consecutive days < 6.0h). Resting heart rate +22.2% above baseline.',
      severity: 'WARNING',
      recommended_action: 'Follow sleep hygiene protocol, schedule 90-minute circadian rest opportunity, and review workload.',
      is_read: 0,
      read_at: null,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    });

    // Critical Alert for AST-003
    ALERTS.push({
      alert_id: 'alt-AST003-SPO2-01',
      astronaut_id: 'AST-003',
      record_id: `rec-AST-003-2026-09-22`,
      indicator_id: 'SPO2',
      indicator_name: 'Blood Oxygen Saturation (SpO₂)',
      indicator_unit: '%',
      current_value: '89%',
      reason: 'CRITICAL ALERT: SpO₂ has fallen below configured safety threshold (89%). Tachycardia response detected.',
      severity: 'CRITICAL',
      recommended_action: 'Follow QRH Protocol HYPOX-1. Administer supplemental O2 via mask. Recheck cabin partial pressure.',
      is_read: 0,
      read_at: null,
      created_at: new Date(Date.now() - 3600000 * 1).toISOString()
    });
  }
}

initializeTelemetry();

/**
 * Intelligent SQL Query Engine that processes SQL queries in memory
 */
async function query(sql, params = []) {
  const norm = (sql || '').trim().replace(/\s+/g, ' ');
  const upper = norm.toUpperCase();

  // 1. SELECT ALERTS
  if (upper.includes('FROM ALERTS')) {
    if (upper.includes('WHERE ALERT_ID =') || upper.includes('WHERE A.ALERT_ID =')) {
      const alertId = params[0];
      const match = ALERTS.filter(a => a.alert_id === alertId);
      return [match];
    }

    const astroId = params[0] || 'AST-001';
    let filtered = ALERTS.filter(a => a.astronaut_id === astroId || astroId === 'all');
    if (upper.includes('IS_READ = FALSE')) {
      filtered = filtered.filter(a => !a.is_read);
    }
    return [filtered];
  }

  // 2. UPDATE ALERTS
  if (upper.startsWith('UPDATE ALERTS')) {
    const alertId = params[params.length - 1];
    const item = ALERTS.find(a => a.alert_id === alertId);
    if (item) {
      item.is_read = 1;
      item.read_at = new Date().toISOString();
    }
    return [{ affectedRows: item ? 1 : 0 }];
  }

  // 3. SELECT HEALTH RECORDS LATEST
  if (upper.includes('FROM HEALTH_RECORDS') && upper.includes('LIMIT 1')) {
    const astroId = params[0] || 'AST-001';
    const astroRecs = HEALTH_RECORDS.filter(r => r.astronaut_id === astroId);
    const latest = astroRecs[astroRecs.length - 1];
    if (!latest) return [[]];

    const b = BEHAVIORAL_CHECKINS.find(x => x.record_id === latest.record_id) || {};
    const rad = RADIATION_RECORDS.find(x => x.record_id === latest.record_id) || {};

    const joined = [{
      ...latest,
      ...b,
      ...rad
    }];
    return [joined];
  }

  // 4. SELECT HEALTH RECORD VALUES
  if (upper.includes('FROM HEALTH_RECORD_VALUES')) {
    const recId = params[0];
    const vals = HEALTH_RECORD_VALUES.filter(v => v.record_id === recId);
    return [vals];
  }

  // 5. SELECT RECORD SYMPTOMS
  if (upper.includes('FROM RECORD_SYMPTOMS')) {
    return [[]];
  }

  // 6. SELECT HEALTH HISTORY
  if (upper.includes('FROM HEALTH_RECORDS') && (upper.includes('ORDER BY') || upper.includes('GROUP BY'))) {
    const astroId = params[0] || 'AST-001';
    const recs = HEALTH_RECORDS.filter(r => r.astronaut_id === astroId);

    const historyRows = recs.map(r => {
      const hrVal = HEALTH_RECORD_VALUES.find(v => v.record_id === r.record_id && v.indicator_id === 'HEART_RATE');
      const spo2Val = HEALTH_RECORD_VALUES.find(v => v.record_id === r.record_id && v.indicator_id === 'SPO2');
      const sleepVal = HEALTH_RECORD_VALUES.find(v => v.record_id === r.record_id && v.indicator_id === 'SLEEP_DURATION');
      const exerVal = HEALTH_RECORD_VALUES.find(v => v.record_id === r.record_id && v.indicator_id === 'EXERCISE_DURATION');
      const b = BEHAVIORAL_CHECKINS.find(x => x.record_id === r.record_id) || {};
      const rad = RADIATION_RECORDS.find(x => x.record_id === r.record_id) || {};

      return {
        record_id: r.record_id,
        record_date: r.record_date,
        mission_day: r.mission_day,
        overall_status: r.overall_status,
        evaluation_summary: r.evaluation_summary,
        heart_rate: hrVal ? parseFloat(hrVal.value_numeric) : 72,
        spo2: spo2Val ? parseFloat(spo2Val.value_numeric) : 98,
        sleep_duration: sleepVal ? parseFloat(sleepVal.value_numeric) : 7.5,
        exercise_duration: exerVal ? parseFloat(exerVal.value_numeric) : 2.0,
        mood: b.mood || 'GOOD',
        stress_level: b.stress_level || 'LOW',
        radiation_daily: rad.simulated_daily_dose_msv || '0.420',
        radiation_cumulative: rad.simulated_cumulative_dose_msv || '11.500'
      };
    });

    return [historyRows];
  }

  // 7. SELECT COUNTERMEASURE LOGS
  if (upper.includes('FROM COUNTERMEASURE_LOGS')) {
    const astroId = params[0] || 'AST-001';
    const logs = COUNTERMEASURE_LOGS.filter(l => l.astronaut_id === astroId);
    return [logs];
  }

  // 8. INSERT COUNTERMEASURE LOG
  if (upper.startsWith('INSERT INTO COUNTERMEASURE_LOGS')) {
    const [astroId, protId, title, cat, dur] = params;
    COUNTERMEASURE_LOGS.push({
      id: COUNTERMEASURE_LOGS.length + 1,
      astronaut_id: astroId,
      protocol_id: protId,
      protocol_title: title,
      category: cat,
      duration_minutes: dur,
      completed_at: new Date().toISOString()
    });
    return [{ affectedRows: 1, insertId: COUNTERMEASURE_LOGS.length }];
  }

  // 8b. DELETE COUNTERMEASURE LOGS
  if (upper.startsWith('DELETE FROM COUNTERMEASURE_LOGS')) {
    const astroId = params[0] || 'AST-001';
    COUNTERMEASURE_LOGS = COUNTERMEASURE_LOGS.filter(l => l.astronaut_id !== astroId);
    return [{ affectedRows: 1 }];
  }

  // 9. SELECT ASTRONAUTS / PROFILE
  if (upper.includes('FROM ASTRONAUTS')) {
    if (upper.includes('WHERE A.ASTRONAUT_ID = ?') || upper.includes('WHERE ASTRONAUT_ID = ?')) {
      const aid = params[0] || 'AST-001';
      const found = ASTRONAUTS.find(a => a.astronaut_id === aid) || ASTRONAUTS[0];
      return [[found]];
    }
    return [ASTRONAUTS];
  }

  // 10. UPDATE ASTRONAUTS
  if (upper.startsWith('UPDATE ASTRONAUTS')) {
    const [first, last, role, aid] = params;
    const a = ASTRONAUTS.find(x => x.astronaut_id === aid);
    if (a) {
      if (first) a.first_name = first;
      if (last !== undefined) a.last_name = last;
      if (role) a.role_title = role;
    }
    return [{ affectedRows: 1 }];
  }

  // 11. SELECT USERS
  if (upper.includes('FROM USERS')) {
    if (params.length > 0) {
      const match = USERS.find(u => 
        u.user_id === params[0] ||
        u.username === params[0] ||
        u.email === params[0] ||
        u.astronaut_id === params[0]
      );
      if (match) {
        const astro = ASTRONAUTS.find(a => a.astronaut_id === match.astronaut_id) || {};
        return [[{
          ...match,
          first_name: astro.first_name || 'Sajid',
          last_name: astro.last_name || '',
          role_title: astro.role_title || 'Mission Commander',
          mission_name: 'Artemis III Lunar Transit & Surface',
          mission_id: 'ARTEMIS-III'
        }]];
      }
    }
    return [USERS];
  }

  // 12. SELECT MISSIONS
  if (upper.includes('FROM MISSIONS')) {
    return [MISSIONS];
  }

  // 13. DEMO SCENARIO INJECTION
  if (upper.includes('UPDATE RECORD_VALUES') || upper.includes('DEMO')) {
    return [{ affectedRows: 1 }];
  }

  // Fallback default
  return [[]];
}

/**
 * Mock connection supporting transactions in memory
 */
function getConnection() {
  return {
    async query(sql, params) {
      return query(sql, params);
    },
    async execute(sql, params) {
      return query(sql, params);
    },
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {}
  };
}

module.exports = {
  query,
  getConnection,
  initializeTelemetry,
  ASTRONAUTS,
  ALERTS,
  HEALTH_RECORDS
};
