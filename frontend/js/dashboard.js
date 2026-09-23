document.addEventListener('DOMContentLoaded', async () => {
  const user = window.api.getUser();
  if (!user || !user.astronautId) return;

  try {
    const res = await window.api.get(`/health/${user.astronautId}/latest`);
    if (res.success && res.record) {
      renderDashboard(res.record);
    }
  } catch (err) {
    document.getElementById('overall-status-summary').textContent =
      'No health records found yet. Please perform your first daily check-in.';
  }

  loadCountermeasures();
});

function renderDashboard(record) {
  document.getElementById('mission-day-badge').textContent = `Mission Day ${record.mission_day} (${record.record_date})`;

  const panel = document.getElementById('annunciator-panel');
  const badge = document.getElementById('overall-status-badge');
  const title = document.getElementById('overall-status-title');
  const summary = document.getElementById('overall-status-summary');
  const actionText = document.getElementById('recommended-action-text');
  const statusIcon = document.getElementById('status-icon');

  panel.className = `annunciator-panel ${record.overall_status}`;
  badge.className = `status-badge ${record.overall_status}`;
  badge.textContent = record.overall_status;

  if (record.overall_status === 'CRITICAL') {
    statusIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    title.textContent = 'CRITICAL TELEMETRY ALERT — Immediate Onboard Action Required';
    actionText.textContent = 'Follow applicable emergency medical protocol. Contact Mission Control when comms available.';
    actionText.style.color = '#ff8080';
  } else if (record.overall_status === 'WARNING') {
    statusIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    title.textContent = 'TELEMETRY WARNING — Recheck Indicator & Follow Health Protocol';
    actionText.textContent = 'Recheck indicator and follow applicable mission health protocol.';
    actionText.style.color = '#fde047';
  } else {
    statusIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    title.textContent = 'Telemetry Nominal — Continue Routine Monitoring';
    actionText.textContent = 'Continue routine monitoring.';
    actionText.style.color = '#e2e8f0';
  }

  summary.textContent = record.evaluation_summary || 'All vitals nominal within personal baseline limits.';

  const grid = document.getElementById('telemetry-grid');
  grid.innerHTML = '';
  const indicators = record.indicators || [];

  indicators.forEach(ind => {
    const card = document.createElement('div');
    card.className = 'metric-card';

    let devText = 'Baseline: Nominal';
    let devClass = 'nominal';
    if (ind.deviation_pct !== null && ind.deviation_pct !== undefined) {
      const sign = ind.deviation_pct > 0 ? '+' : '';
      devText = `${sign}${ind.deviation_pct}% vs baseline`;
      if (Math.abs(ind.deviation_pct) >= 20) devClass = 'positive';
      else if (ind.deviation_pct < 0) devClass = 'negative';
    }

    card.innerHTML = `
      <div class="metric-header">
        <span class="metric-name">${ind.name}</span>
        <span class="status-badge ${ind.status}">${ind.status}</span>
      </div>
      <div class="metric-value-row">
        <span class="metric-value">${ind.value_numeric}</span>
        <span class="metric-unit">${ind.unit}</span>
      </div>
      <div class="metric-baseline-row">
        <span>14d Avg: ${ind.baseline_value !== null ? ind.baseline_value + ' ' + ind.unit : 'Ref'}</span>
        <span class="metric-deviation ${devClass}">${devText}</span>
      </div>
    `;
    grid.appendChild(card);
  });

  const alertsContainer = document.getElementById('alerts-container');
  const activeAlerts = record.activeAlerts || [];

  if (activeAlerts.length === 0) {
    alertsContainer.innerHTML = `
      <div style="background: rgba(0, 230, 118, 0.06); border: 1px solid rgba(0, 230, 118, 0.2); padding: 10px 14px; border-radius: var(--radius-sm); color: var(--status-normal-text); font-family: var(--font-mono); font-size: 11.5px; display: flex; align-items: center; gap: 8px;">
        <span>✓</span> Zero active alerts. All evaluated telemetry nominal.
      </div>
    `;
  } else {
    alertsContainer.innerHTML = '';
    activeAlerts.forEach(alt => {
      const alertDiv = document.createElement('div');
      alertDiv.className = `alert-card-item ${alt.severity}`;
      alertDiv.style.cssText = 'padding: 13px 18px; margin-bottom: 10px;';

      const formattedTime = new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      alertDiv.innerHTML = `
        <div class="alert-card-main">
          <div class="alert-card-header">
            <span class="status-badge ${alt.severity}">
              <span class="comms-dot" style="background: currentColor; width: 6px; height: 6px;"></span>
              ${alt.severity}
            </span>
            <span class="mono alert-id-badge">${alt.alert_id}</span>
            <span class="alert-telemetry-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              ${alt.indicator_name || alt.indicator_id}: <strong>${alt.current_value}</strong>
            </span>
            <span class="mono alert-timestamp">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${formattedTime}
            </span>
          </div>
          <h4 class="alert-card-title" style="font-size: 13.5px; margin-bottom: 6px;">${alt.reason}</h4>
          <div class="alert-protocol-box" style="margin-top: 6px; padding: 8px 12px;">
            <div class="alert-protocol-label">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Protocol Directive:
            </div>
            <p class="alert-protocol-text" style="font-size: 11.5px;">${alt.recommended_action}</p>
          </div>
        </div>
        <div class="alert-card-actions">
          <button onclick="acknowledgeAlert('${alt.alert_id}')" class="btn-ack-alert" style="padding: 6px 12px; font-size: 10.5px;">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Acknowledge
          </button>
        </div>
      `;
      alertsContainer.appendChild(alertDiv);
    });
  }

  document.getElementById('beh-mood').textContent = record.mood ? record.mood.replace(/_/g, ' ') : 'NOMINAL';
  document.getElementById('beh-stress').textContent = record.stress_level || 'LOW';
  document.getElementById('beh-loneliness').textContent = record.loneliness_level ? record.loneliness_level.replace(/_/g, ' ') : 'NONE';
  document.getElementById('beh-connection').textContent = record.crew_connection || 'STRONG';

  const concElem = document.getElementById('beh-concentration');
  if (record.concentration_difficulty) {
    concElem.textContent = 'Difficulty Reported';
    concElem.style.color = 'var(--status-warning-text)';
  } else {
    concElem.textContent = 'Nominal / Focused';
    concElem.style.color = 'var(--status-normal-text)';
  }

  const dailyDose = record.simulated_daily_dose_msv || 0.42;
  const cumDose = record.simulated_cumulative_dose_msv || 5.62;
  document.getElementById('rad-daily').innerHTML = `${dailyDose} <span style="font-size: 11px; color: var(--text-dim);">mSv</span>`;
  document.getElementById('rad-cumulative').innerHTML = `${cumDose} <span style="font-size: 11px; color: var(--text-dim);">mSv</span>`;
  
  const pct = Math.min(100, Math.round((cumDose / 50.0) * 1000) / 10);
  document.getElementById('rad-progress-pct').textContent = `${pct}% of 50 mSv limit`;
  document.getElementById('rad-progress-bar').style.width = `${pct}%`;

  const symptomsContainer = document.getElementById('symptoms-container');
  const symptoms = record.symptoms || [];
  if (symptoms.length === 0) {
    symptomsContainer.innerHTML = '<span style="font-size: 12px; color: var(--text-dim); font-family: var(--font-mono);">No symptoms reported for current check-in.</span>';
  } else {
    symptomsContainer.innerHTML = '';
    symptoms.forEach(s => {
      const badge = document.createElement('span');
      badge.className = 'status-badge WARNING';
      badge.innerHTML = `<svg class="hud-icon" style="color: var(--status-warning-text); margin-right: 4px;" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>${s.name} (${s.severity_level})${s.notes ? ' — ' + s.notes : ''}`;
      symptomsContainer.appendChild(badge);
    });
  }
}

async function acknowledgeAlert(alertId) {
  try {
    await window.api.patch(`/alerts/${alertId}/read`);
    window.location.reload();
  } catch (err) {
    alert(`Failed: ${err.message}`);
  }
}
window.acknowledgeAlert = acknowledgeAlert;

async function loadCountermeasures(fresh = true) {
  const container = document.getElementById('countermeasures-list');
  if (!container) return;

  try {
    const endpoint = fresh ? '/countermeasures/active?fresh=true' : '/countermeasures/active';
    const res = await window.api.get(endpoint);
    if (res && res.success && res.protocols) {
      renderCountermeasures(res);
    }
  } catch (err) {
    console.warn('Could not load countermeasures:', err);
  }
}

function renderCountermeasures(data) {
  const container = document.getElementById('countermeasures-list');
  const progressBar = document.getElementById('cm-progress-bar');
  const progressText = document.getElementById('cm-progress-text');
  const complianceBadge = document.getElementById('cm-compliance-badge');
  const resetBtn = document.getElementById('btn-reset-cm');
  if (!container) return;

  // Bind Reset button if available
  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = 'true';
    resetBtn.addEventListener('click', async () => {
      resetBtn.disabled = true;
      resetBtn.textContent = '...';
      try {
        await window.api.post('/countermeasures/reset', {});
      } catch (e) {}
      await loadCountermeasures(true);
      resetBtn.disabled = false;
      resetBtn.textContent = '↻ Reset';
    });
  }

  if (complianceBadge) {
    complianceBadge.textContent = `Adherence: ${data.complianceScore}%`;
    complianceBadge.className = `status-badge ${data.complianceScore >= 75 ? 'NORMAL' : (data.complianceScore >= 40 ? 'WARNING' : 'CRITICAL')}`;
  }

  if (progressBar) progressBar.style.width = `${data.complianceScore}%`;
  if (progressText) progressText.textContent = `${data.completedProtocols} of ${data.totalProtocols} Protocols Verified (${data.complianceScore}%)`;

  container.innerHTML = '';
  data.protocols.forEach(p => {
    const row = document.createElement('div');
    row.style.cssText = `background: rgba(0, 0, 0, 0.3); border: 1px solid ${p.completed ? 'rgba(0, 230, 118, 0.35)' : 'var(--border-subtle)'}; border-radius: var(--radius-sm); padding: 12px 14px; display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; transition: all 0.2s ease;`;

    row.innerHTML = `
      <div style="flex: 1 1 280px;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <strong style="font-size: 13px; color: ${p.completed ? 'var(--status-normal-text)' : 'var(--text-highlight)'};">${p.title}</strong>
          <span class="status-badge ${p.urgency === 'CRITICAL' ? 'CRITICAL' : (p.urgency === 'URGENT' ? 'WARNING' : 'NORMAL')}" style="font-size: 9px; padding: 1px 5px;">
            ${p.urgency}
          </span>
          <span class="mono" style="font-size: 10px; color: var(--accent-cyan);">${p.durationMinutes} MIN</span>
        </div>
        <p style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px; line-height: 1.4;">${p.description}</p>
        <div style="font-size: 10px; color: var(--text-dim); margin-top: 4px; font-family: var(--font-mono);">
          Target: <span style="color: var(--accent-cyan);">${p.targetSystem}</span> &bull; ${p.rationale}
        </div>
      </div>
      <div>
        ${p.completed ? `
          <button type="button" class="btn-verified-cm" data-id="${p.id}" style="font-size: 11px; color: var(--status-normal-text); font-weight: 700; display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; background: rgba(0, 230, 118, 0.1); border: 1px solid rgba(0, 230, 118, 0.3); border-radius: 4px; cursor: pointer;" title="Click to reset and log again">
            ✓ VERIFIED ONBOARD
          </button>
        ` : `
          <button type="button" class="btn-primary btn-log-cm" data-id="${p.id}" data-title="${p.title}" data-category="${p.category}" data-duration="${p.durationMinutes}" style="padding: 6px 14px; font-size: 11px;">
            LOG COMPLETED
          </button>
        `}
      </div>
    `;

    container.appendChild(row);
  });

  // Attach click listeners to "LOG COMPLETED" buttons
  container.querySelectorAll('.btn-log-cm').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      const category = btn.getAttribute('data-category');
      const duration = parseInt(btn.getAttribute('data-duration') || '30', 10);

      try {
        await window.api.post('/countermeasures/log', {
          protocol_id: id,
          protocol_title: title,
          category,
          duration_minutes: duration
        });
        loadCountermeasures(false);
      } catch (err) {
        alert('Failed to log protocol completion: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'LOG COMPLETED';
      }
    });
  });

  // Attach click listeners to "✓ VERIFIED ONBOARD" buttons to allow unlogging/resetting
  container.querySelectorAll('.btn-verified-cm').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Resetting...';
      try {
        await window.api.post('/countermeasures/reset', {});
        await loadCountermeasures(true);
      } catch (err) {
        await loadCountermeasures(true);
      }
    });
  });
}

