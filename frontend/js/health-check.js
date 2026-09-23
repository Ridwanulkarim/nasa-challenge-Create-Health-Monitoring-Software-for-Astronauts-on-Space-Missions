document.addEventListener('DOMContentLoaded', () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const dateInput = document.getElementById('checkin_date');
  if (dateInput) {
    dateInput.value = todayStr;
    dateInput.max = todayStr;
  }

  setFieldDefault('heart_rate', 72);
  setFieldDefault('spo2', 98);
  setFieldDefault('body_temp', 36.8);
  setFieldDefault('bp_systolic', 118);
  setFieldDefault('bp_diastolic', 76);
  setFieldDefault('body_weight', 75.0);
  setFieldDefault('sleep_duration', 7.5);
  setFieldDefault('exercise_duration', 2.0);
  setFieldDefault('hydration', 2.8);
  setFieldDefault('daily_radiation', 0.42);

  initWearableSync();

  const form = document.getElementById('health-check-form');
  if (form) {
    form.addEventListener('submit', handleCheckinSubmit);
  }
});

let activeWearableDevice = 'whoop';

const WEARABLE_CONFIGS = {
  whoop: {
    name: 'WHOOP 4.0 Bio-Strap',
    battery: '93% [Nominal]',
    protocol: 'BLE 5.3 Spacecraft Mesh',
    badgeText: '✓ WHOOP 4.0',
    color: 'var(--accent-cyan)'
  },
  fitbit: {
    name: 'Fitbit Sense Bio-Tracker',
    battery: '87% [Nominal]',
    protocol: 'BLE 5.0 Local Sync',
    badgeText: '✓ FITBIT SENSE',
    color: '#00e676'
  }
};

function initWearableSync() {
  const btnWhoop = document.getElementById('btn-select-whoop');
  const btnFitbit = document.getElementById('btn-select-fitbit');
  const btnSync = document.getElementById('btn-trigger-sync');
  const metaName = document.getElementById('meta-device-name');
  const metaBattery = document.getElementById('meta-device-battery');
  const metaProtocol = document.getElementById('meta-device-protocol');

  if (btnWhoop && btnFitbit) {
    btnWhoop.addEventListener('click', () => {
      activeWearableDevice = 'whoop';
      btnWhoop.classList.add('active');
      btnFitbit.classList.remove('active');
      if (metaName) {
        metaName.textContent = WEARABLE_CONFIGS.whoop.name;
        metaName.style.color = WEARABLE_CONFIGS.whoop.color;
      }
      if (metaBattery) metaBattery.textContent = WEARABLE_CONFIGS.whoop.battery;
      if (metaProtocol) metaProtocol.textContent = WEARABLE_CONFIGS.whoop.protocol;
    });

    btnFitbit.addEventListener('click', () => {
      activeWearableDevice = 'fitbit';
      btnFitbit.classList.add('active');
      btnWhoop.classList.remove('active');
      if (metaName) {
        metaName.textContent = WEARABLE_CONFIGS.fitbit.name;
        metaName.style.color = WEARABLE_CONFIGS.fitbit.color;
      }
      if (metaBattery) metaBattery.textContent = WEARABLE_CONFIGS.fitbit.battery;
      if (metaProtocol) metaProtocol.textContent = WEARABLE_CONFIGS.fitbit.protocol;
    });
  }

  if (btnSync) {
    btnSync.addEventListener('click', triggerWearableSync);
  }
}

async function triggerWearableSync() {
  const btnSync = document.getElementById('btn-trigger-sync');
  const syncToast = document.getElementById('wearable-sync-toast');
  const syncToastMsg = document.getElementById('sync-toast-msg');
  const metaBattery = document.getElementById('meta-device-battery');
  if (!btnSync) return;

  const originalContent = btnSync.innerHTML;
  btnSync.disabled = true;
  btnSync.innerHTML = `
    <svg class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    INGESTING TELEMETRY...
  `;

  try {
    const res = await window.api.get(`/wearables/sync/${activeWearableDevice}`);
    if (res && res.success && res.telemetry) {
      const t = res.telemetry;
      const device = res.device || WEARABLE_CONFIGS[activeWearableDevice];
      const cfg = WEARABLE_CONFIGS[activeWearableDevice];

      if (metaBattery && device.battery) {
        metaBattery.textContent = `${device.battery}% [Nominal]`;
      }

      const syncFields = [
        { id: 'heart_rate', val: t.heart_rate, tagId: 'sync-tag-hr' },
        { id: 'spo2', val: t.spo2, tagId: 'sync-tag-spo2' },
        { id: 'body_temp', val: t.body_temp, tagId: 'sync-tag-temp' },
        { id: 'sleep_duration', val: t.sleep_duration, tagId: 'sync-tag-sleep' },
        { id: 'exercise_duration', val: t.exercise_duration, tagId: 'sync-tag-exercise' }
      ];

      syncFields.forEach(item => {
        const input = document.getElementById(item.id);
        const tag = document.getElementById(item.tagId);

        if (input && item.val !== undefined) {
          input.value = item.val;
          input.classList.remove('input-synced-highlight');
          void input.offsetWidth; // trigger DOM reflow to restart css animation
          input.classList.add('input-synced-highlight');
        }

        if (tag) {
          tag.textContent = cfg.badgeText;
          tag.style.display = 'inline-block';
        }
      });

      if (syncToast && syncToastMsg) {
        syncToast.style.borderColor = 'var(--status-normal-border)';
        syncToast.style.background = 'rgba(0, 230, 118, 0.12)';
        syncToast.style.color = 'var(--status-normal-text)';
        syncToastMsg.innerHTML = `<strong>✓ LIVE TELEMETRY INGESTED:</strong> 5 physiological metrics auto-populated from <strong>${device.name}</strong> [Packet: <code>${res.packetId}</code> &bull; Continuous BLE stream]`;
        syncToast.style.display = 'block';
      }
    }
  } catch (err) {
    console.error('Failed to sync wearable stream:', err);
    if (syncToast && syncToastMsg) {
      syncToast.style.borderColor = 'var(--status-critical-border)';
      syncToast.style.background = 'var(--status-critical-bg)';
      syncToast.style.color = 'var(--status-critical-text)';
      syncToastMsg.textContent = `Telemetry sync error: ${err.message || 'Wearable mesh connection interrupted'}`;
      syncToast.style.display = 'block';
    }
  } finally {
    btnSync.disabled = false;
    btnSync.innerHTML = originalContent;
  }
}


function setFieldDefault(id, val) {
  const elem = document.getElementById(id);
  if (elem && !elem.value) elem.value = val;
}

async function handleCheckinSubmit(e) {
  e.preventDefault();

  const errorBanner = document.getElementById('form-error-banner');
  const submitBtn = document.getElementById('btn-submit-checkin');
  errorBanner.style.display = 'none';

  const hr = parseFloat(document.getElementById('heart_rate').value);
  const spo2 = parseFloat(document.getElementById('spo2').value);
  const temp = parseFloat(document.getElementById('body_temp').value);
  const sys = parseFloat(document.getElementById('bp_systolic').value);
  const dia = parseFloat(document.getElementById('bp_diastolic').value);
  const weight = parseFloat(document.getElementById('body_weight').value);
  const sleep = parseFloat(document.getElementById('sleep_duration').value);
  const exercise = parseFloat(document.getElementById('exercise_duration').value);
  const hydration = parseFloat(document.getElementById('hydration').value);
  const dailyRad = parseFloat(document.getElementById('daily_radiation').value);
  const recordDate = document.getElementById('checkin_date').value;
  const notes = document.getElementById('checkin_notes').value;

  if (hr < 30 || hr > 220) return showFormError('Heart rate must be between 30 and 220 BPM.');
  if (spo2 < 50 || spo2 > 100) return showFormError('Blood oxygen (SpO₂) must be between 50% and 100%.');
  if (temp < 32.0 || temp > 43.0) return showFormError('Body temperature must be between 32.0°C and 43.0°C.');
  if (sys < 60 || sys > 260 || dia < 40 || dia > 160) return showFormError('Blood pressure readings are outside plausible limits.');
  if (weight < 35.0 || weight > 200.0) return showFormError('Body mass must be between 35.0 kg and 200.0 kg.');

  const mood = document.querySelector('input[name="mood"]:checked')?.value || 'GOOD';
  const stress = document.querySelector('input[name="stress"]:checked')?.value || 'LOW';
  const loneliness = document.querySelector('input[name="loneliness"]:checked')?.value || 'NOT_AT_ALL';
  const connection = document.querySelector('input[name="connection"]:checked')?.value || 'STRONG';
  const difficultyConcentrating = document.getElementById('concentration_difficulty')?.checked || false;

  const symptoms = [];
  document.querySelectorAll('.symptom-toggle-row').forEach(row => {
    const checkbox = row.querySelector('.symptom-checkbox');
    if (checkbox && checkbox.checked) {
      const severity = row.querySelector('.symptom-severity')?.value || 'MILD';
      symptoms.push({
        symptom_id: checkbox.value,
        severity_level: severity,
        notes: null
      });
    }
  });

  const payload = {
    record_date: recordDate,
    indicators: {
      HEART_RATE: hr,
      SPO2: spo2,
      BP_SYSTOLIC: sys,
      BP_DIASTOLIC: dia,
      BODY_TEMP: temp,
      BODY_WEIGHT: weight,
      SLEEP_DURATION: sleep,
      EXERCISE_DURATION: exercise,
      HYDRATION: hydration
    },
    behavioral: {
      mood,
      stress_level: stress,
      loneliness_level: loneliness,
      crew_connection: connection,
      concentration_difficulty: difficultyConcentrating,
      notes: null
    },
    radiation: {
      simulated_daily_dose_msv: dailyRad,
      notes: 'SIMULATED RADIATION DATA'
    },
    symptoms,
    notes
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Evaluating onboard rules...';

  try {
    const res = await window.api.post('/health', payload);
    if (res.success && res.evaluation) {
      showEvaluationModal(res.evaluation);
    } else {
      window.location.href = 'dashboard.html';
    }
  } catch (err) {
    showFormError(err.message || 'Failed to submit health check-in.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'EVALUATE TELEMETRY & SAVE ONBOARD';
  }
}

function showFormError(msg) {
  const banner = document.getElementById('form-error-banner');
  banner.textContent = msg;
  banner.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showEvaluationModal(evalData) {
  const modal = document.getElementById('evaluation-modal');
  const badge = document.getElementById('modal-status-badge');
  const summary = document.getElementById('modal-summary');
  const action = document.getElementById('modal-action');
  const alertsSection = document.getElementById('modal-alerts-section');
  const alertsList = document.getElementById('modal-alerts-list');

  badge.className = `status-badge ${evalData.overallStatus}`;
  badge.textContent = evalData.overallStatus;
  summary.textContent = evalData.evaluationSummary || 'All measurements nominal.';
  action.textContent = evalData.recommendedAction || 'Continue routine monitoring.';

  const alerts = evalData.alerts || [];
  if (alerts.length > 0) {
    alertsSection.style.display = 'block';
    alertsList.innerHTML = '';
    alerts.forEach(a => {
      const div = document.createElement('div');
      div.className = `alert-card-item ${a.severity || 'WARNING'}`;
      div.style.cssText = 'padding: 8px 12px 8px 14px; margin-bottom: 6px; font-size: 11.5px;';
      div.innerHTML = `
        <div class="alert-card-main" style="display: flex; align-items: center; gap: 8px;">
          <span class="status-badge ${a.severity}" style="font-size: 9.5px; padding: 2px 6px;">${a.severity}</span>
          <strong style="color: var(--text-highlight);">${a.reason}</strong>
        </div>
      `;
      alertsList.appendChild(div);
    });
  } else {
    alertsSection.style.display = 'none';
  }

  modal.style.display = 'flex';
}
