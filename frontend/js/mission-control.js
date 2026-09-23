document.addEventListener('DOMContentLoaded', async () => {
  await loadFleetData();
  await loadFleetAlerts();
});

async function loadFleetData() {
  const grid = document.getElementById('fleet-grid');

  try {
    const res = await window.api.get('/mission-control/astronauts');
    if (!res.success || !res.fleet) return;

    const fleet = res.fleet;

    document.getElementById('stat-total-crew').textContent = fleet.length;
    document.getElementById('stat-normal-crew').textContent = fleet.filter(a => a.overall_status === 'NORMAL').length;
    document.getElementById('stat-warning-crew').textContent = fleet.filter(a => a.overall_status === 'WARNING').length;
    document.getElementById('stat-critical-crew').textContent = fleet.filter(a => a.overall_status === 'CRITICAL').length;

    grid.innerHTML = '';
    fleet.forEach(a => {
      const card = document.createElement('div');
      card.className = `astronaut-fleet-card ${a.overall_status}`;

      const checkinDate = a.last_checkin_date 
        ? new Date(a.last_checkin_date).toISOString().slice(0, 10) 
        : 'Pending';

      card.innerHTML = `
        <div>
          <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="mono" style="font-size: 12px; font-weight: 800; color: var(--accent-cyan);">${a.astronaut_id}</span>
                <span class="mono" style="font-size: 11px; color: var(--text-dim);">Day ${a.mission_day || '--'}</span>
              </div>
              <h3 style="font-size: 17px; font-weight: 800; color: var(--text-highlight); margin-top: 2px;">
                ${a.first_name} ${a.last_name}
              </h3>
              <span style="font-size: 11.5px; color: var(--text-muted);">${a.role_title}</span>
            </div>
            <span class="status-badge ${a.overall_status}">${a.overall_status}</span>
          </div>

          <div style="background: rgba(10, 16, 31, 0.85); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 14px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; color: var(--text-muted); margin-bottom: 5px;">
              <span>Mission:</span>
              <span style="color: var(--text-highlight); font-weight: 600;">${a.mission_name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-muted); margin-bottom: 5px;">
              <span>Spacecraft:</span>
              <span class="mono" style="color: var(--accent-cyan); font-weight: 600;">${a.spacecraft}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
              <span>Telemetry Sync:</span>
              <span class="mono" style="color: var(--text-highlight);">${checkinDate}</span>
            </div>
          </div>

          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.45; margin-bottom: 16px; min-height: 34px;">
            ${a.evaluation_summary || 'Telemetry nominal within configured baselines.'}
          </p>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid var(--border-subtle);">
          <span class="mono" style="font-size: 11px; color: ${a.active_alerts_count > 0 ? 'var(--status-critical-text)' : 'var(--text-dim)'}; font-weight: 700; display: inline-flex; align-items: center;">
            ${a.active_alerts_count > 0 ? `<svg class="hud-icon" style="color: var(--status-critical-text); margin-right: 4px;" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${a.active_alerts_count} Active Alert(s)` : 'Zero Alerts'}
          </span>
          <button onclick="openDrilldown('${a.astronaut_id}')" class="btn-primary" style="padding: 6px 14px; font-size: 11px;">
            Inspect Dossier →
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<div class="card" style="color: var(--status-critical-text);">Failed to load fleet data: ${err.message}</div>`;
  }
}

async function loadFleetAlerts() {
  const tbody = document.getElementById('fleet-alerts-body');
  const countBadge = document.getElementById('alerts-count-badge');

  try {
    const res = await window.api.get('/mission-control/alerts');
    if (!res.success || !res.alerts || res.alerts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--status-normal-text); padding: 20px;">✓ Zero active fleet alerts. All crew members reporting within expected bounds.</td></tr>';
      countBadge.textContent = '0 ACTIVE';
      return;
    }

    countBadge.textContent = `${res.alerts.length} ACTIVE ALERTS`;
    tbody.innerHTML = '';

    res.alerts.forEach(alt => {
      const tr = document.createElement('tr');
      const timeStr = new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      tr.innerHTML = `
        <td><span class="status-badge ${alt.severity}">${alt.severity}</span></td>
        <td><strong style="color: var(--text-highlight);">${alt.astronaut_name}</strong> <span class="mono" style="font-size: 11px; color: var(--text-dim);">(${alt.astronaut_id})</span></td>
        <td class="mono">${alt.indicator_name || alt.indicator_id}</td>
        <td class="mono" style="font-weight: 800; color: var(--text-highlight);">${alt.current_value}</td>
        <td style="font-size: 12px;">${alt.reason}</td>
        <td style="font-size: 11.5px; color: var(--accent-cyan);">${alt.recommended_action}</td>
        <td class="mono" style="font-size: 11px; color: var(--text-dim);">${timeStr}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--status-critical-text); padding: 16px;">Error loading fleet alerts: ${err.message}</td></tr>`;
  }
}

async function openDrilldown(astronautId) {
  const modal = document.getElementById('drilldown-modal');
  const title = document.getElementById('modal-crew-title');
  const content = document.getElementById('modal-crew-details');

  modal.style.display = 'flex';
  content.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">Loading crew telemetry...</p>';

  try {
    const res = await window.api.get(`/mission-control/astronauts/${astronautId}/health`);
    if (!res.success) throw new Error(res.error);

    const { astronaut, latestRecord, indicators, activeAlerts } = res;
    title.innerHTML = `<span>👨‍🚀</span> ${astronaut.first_name} ${astronaut.last_name} (${astronaut.astronaut_id}) Telemetry Dossier`;

    let indHtml = '<div class="telemetry-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-top: 10px;">';
    indicators.forEach(ind => {
      let dev = '';
      if (ind.deviation_pct !== null) {
        const sign = ind.deviation_pct > 0 ? '+' : '';
        dev = `<div class="mono" style="font-size: 10px; color: ${Math.abs(ind.deviation_pct) >= 20 ? 'var(--status-warning-text)' : 'var(--text-dim)'};">${sign}${ind.deviation_pct}% vs baseline</div>`;
      }
      indHtml += `
        <div style="background: rgba(10, 16, 31, 0.85); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <div style="font-size: 10px; text-transform: uppercase; color: var(--text-dim); display: flex; justify-content: space-between; font-family: var(--font-mono);">
            <span>${ind.name}</span>
            <span class="status-badge ${ind.status || 'NORMAL'}" style="font-size: 8px; padding: 1px 4px;">${ind.status || 'NORMAL'}</span>
          </div>
          <div class="mono" style="font-size: 20px; font-weight: 800; color: var(--text-highlight); margin: 4px 0;">
            ${ind.value !== null ? ind.value : '--'} <span style="font-size: 10px; color: var(--accent-cyan); font-weight: normal;">${ind.unit}</span>
          </div>
          ${dev}
        </div>
      `;
    });
    indHtml += '</div>';

    let alertsHtml = '';
    if (activeAlerts && activeAlerts.length > 0) {
      alertsHtml = '<div style="margin-top: 16px;"><h4 style="font-size: 12px; color: var(--status-critical-text); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 8px;">Active Operational Alerts</h4>';
      activeAlerts.forEach(a => {
        alertsHtml += `
          <div style="background: rgba(255, 23, 68, 0.08); border-left: 3px solid var(--status-critical-border); padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: 6px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <strong style="color: var(--text-highlight);">${a.reason}</strong>
              <span class="mono" style="color: var(--accent-cyan); font-size: 11px;">${a.indicator_name}: ${a.current_value}</span>
            </div>
            <div style="color: var(--text-muted); font-size: 11.5px;">Protocol: ${a.recommended_action}</div>
          </div>
        `;
      });
      alertsHtml += '</div>';
    }

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.3); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 14px;">
        <div>
          <span style="font-size: 11px; color: var(--text-dim); text-transform: uppercase;">Flight Assignment</span>
          <div style="font-weight: 700; color: var(--text-highlight); font-size: 13px;">${astronaut.role_title} — ${astronaut.mission_name}</div>
        </div>
        <div>
          <span style="font-size: 11px; color: var(--text-dim); text-transform: uppercase;">Current Flight Status</span>
          <div><span class="status-badge ${astronaut.overall_status}">${astronaut.overall_status}</span></div>
        </div>
      </div>
      <div>
        <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent-cyan); font-family: var(--font-mono); margin-bottom: 4px;">Evaluated Telemetry Metrics</h4>
        ${indHtml}
      </div>
      ${alertsHtml}
    `;
  } catch (err) {
    content.innerHTML = `<p style="color: var(--status-critical-text); padding: 20px;">Failed to load dossier: ${err.message}</p>`;
  }
}

function closeDrilldown() {
  document.getElementById('drilldown-modal').style.display = 'none';
}

window.openDrilldown = openDrilldown;
window.closeDrilldown = closeDrilldown;
