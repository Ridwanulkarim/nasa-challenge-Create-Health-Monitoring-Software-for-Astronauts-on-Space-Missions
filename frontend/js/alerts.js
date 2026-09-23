let activeStatusFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  const user = window.api.getUser();
  if (!user || !user.astronautId) return;

  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatusFilter = btn.getAttribute('data-status');
      loadAlerts(user.astronautId, activeStatusFilter);
    });
  });

  loadAlerts(user.astronautId, activeStatusFilter);
});

async function loadAlerts(astronautId, statusFilter) {
  const container = document.getElementById('alerts-list');

  try {
    const res = await window.api.get(`/alerts/${astronautId}?status=${statusFilter}`);
    if (!res.success || !res.alerts || res.alerts.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 42px 20px; color: var(--text-muted);">
          <div style="margin-bottom: 12px; display: flex; justify-content: center;">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--status-normal-text)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
          </div>
          <strong style="color: var(--text-highlight); font-size: 14px;">Zero Active Alerts</strong>
          <p style="font-size: 12px; margin-top: 4px; color: var(--text-dim);">All physiological and environmental indicators are operating within nominal baseline bounds.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    res.alerts.forEach(alt => {
      const card = document.createElement('div');
      card.className = `alert-card-item ${alt.severity} ${alt.is_read ? 'is-read' : ''}`;

      const formattedDate = new Date(alt.created_at).toLocaleString([], {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;">
            <span class="status-badge ${alt.severity}">${alt.severity}</span>
            <span class="mono" style="font-size: 11px; color: var(--text-dim);">${alt.alert_id}</span>
            <span class="mono" style="font-size: 11.5px; color: var(--accent-cyan); font-weight: 700;">
              ${alt.indicator_name || alt.indicator_id} = ${alt.current_value}
            </span>
            <span class="mono" style="font-size: 11px; color: var(--text-dim); margin-left: auto;">${formattedDate}</span>
          </div>

          <h3 style="font-size: 14.5px; font-weight: 700; color: var(--text-highlight); margin-bottom: 8px; letter-spacing: 0.01em;">
            ${alt.reason}
          </h3>

          <div style="background: rgba(10, 16, 31, 0.85); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-top: 8px;">
            <div style="font-size: 9.5px; text-transform: uppercase; color: var(--accent-cyan); font-weight: 800; font-family: var(--font-mono); letter-spacing: 0.08em; margin-bottom: 3px;">
              ACTIONABLE FLIGHT PROTOCOL:
            </div>
            <p style="font-size: 12.5px; color: var(--text-main); line-height: 1.45;">
              ${alt.recommended_action}
            </p>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; gap: 12px;">
          ${alt.is_read ? `
            <span class="mono" style="font-size: 11px; color: var(--status-normal-text); padding: 4px 8px; background: var(--status-normal-bg); border-radius: 4px; border: 1px solid var(--status-normal-border);">
              ✓ ACKNOWLEDGED
            </span>
          ` : `
            <button onclick="handleAcknowledge('${alt.alert_id}')" class="btn-primary" style="padding: 7px 14px; font-size: 11px; white-space: nowrap;">
              Acknowledge Alert
            </button>
          `}
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `
      <div class="card" style="color: var(--status-critical-text); text-align: center; padding: 20px;">
        Failed to load alerts: ${err.message}
      </div>
    `;
  }
}

async function handleAcknowledge(alertId) {
  try {
    await window.api.patch(`/alerts/${alertId}/read`);
    const user = window.api.getUser();
    loadAlerts(user.astronautId, activeStatusFilter);
  } catch (err) {
    alert(`Could not acknowledge alert: ${err.message}`);
  }
}

window.handleAcknowledge = handleAcknowledge;
