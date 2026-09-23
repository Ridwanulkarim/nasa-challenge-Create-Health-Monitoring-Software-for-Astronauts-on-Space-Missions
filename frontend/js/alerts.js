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
              ${formattedDate}
            </span>
          </div>

          <h3 class="alert-card-title">${alt.reason}</h3>

          <div class="alert-protocol-box">
            <div class="alert-protocol-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Actionable Flight Protocol Directive:
            </div>
            <p class="alert-protocol-text">${alt.recommended_action}</p>
          </div>
        </div>

        <div class="alert-card-actions">
          ${alt.is_read ? `
            <span class="alert-ack-badge">
              ✓ ACKNOWLEDGED
            </span>
          ` : `
            <button onclick="handleAcknowledge('${alt.alert_id}')" class="btn-ack-alert">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
