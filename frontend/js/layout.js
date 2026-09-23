(function initSharedLayout() {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('auth-page')) return;

    const user = window.api ? window.api.getUser() : null;
    if (!user) return;

    const commsStates = [
      { id: 'online', label: 'LINK ONLINE', latency: '< 1.2s' },
      { id: 'delayed', label: 'LINK DELAYED (12m)', latency: '12m 40s' },
      { id: 'offline', label: 'LINK OFFLINE (AUTONOMOUS)', latency: 'Blackout' }
    ];

    let currentCommsIndex = parseInt(localStorage.getItem('astro_comms_idx') || '0', 10);
    const activeComms = commsStates[currentCommsIndex];
    const currentPath = window.location.pathname;

    const sidebarHtml = `
      <div id="sidebar-backdrop" class="sidebar-backdrop"></div>
      <aside class="app-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-brand-icon">
            <img src="assets/images/nasa-logo.svg" alt="NASA Meatball Insignia">
          </div>
          <div class="sidebar-brand-text">
            <div class="brand-title">AstroHealth</div>
            <div class="brand-subtitle">NASA Bio-HUD</div>
          </div>
          <button id="btn-sidebar-close" class="mobile-sidebar-close-btn" aria-label="Close menu">✕</button>
        </div>

        <nav class="sidebar-nav">
          ${user.role === 'ASTRONAUT' ? `
            <div class="nav-section-title">Flight Telemetry</div>
            <a href="dashboard.html" class="nav-link ${currentPath.includes('dashboard.html') ? 'active' : ''}">
              <span class="nav-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg></span> Dashboard
            </a>
            <a href="health-check.html" class="nav-link ${currentPath.includes('health-check.html') ? 'active' : ''}">
              <span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M7 14h2.5l1.5-3 2 6 1.5-3H17"/></svg></span> Daily Check-in
            </a>
            <a href="history.html" class="nav-link ${currentPath.includes('history.html') ? 'active' : ''}">
              <span class="nav-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M3 12h3l1.5-2 2 4 1.5-2h2"/></svg></span> Health History
            </a>
            <a href="alerts.html" class="nav-link ${currentPath.includes('alerts.html') ? 'active' : ''}">
              <span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span> Active Alerts
            </a>
            <a href="dossier.html" class="nav-link ${currentPath.includes('dossier.html') ? 'active' : ''}">
              <span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></span> Clinical Dossier
            </a>
            <a href="profile.html" class="nav-link ${currentPath.includes('profile.html') ? 'active' : ''}">
              <span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span> Personal Profile
            </a>
          ` : `
            <div class="nav-section-title">Ground Operations</div>
            <a href="mission-control.html" class="nav-link ${currentPath.includes('mission-control.html') ? 'active' : ''}">
              <span class="nav-icon"><svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="2" x2="12" y2="22"/></svg></span> Fleet Overview
            </a>
          `}

          <div class="nav-section-title">Clinical Protocols</div>
          <a href="emergency.html" class="nav-link ${currentPath.includes('emergency.html') ? 'active' : ''}">
            <span class="nav-icon"><svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span> Emergency QRH
          </a>
          <a href="research.html" class="nav-link ${currentPath.includes('research.html') ? 'active' : ''}">
            <span class="nav-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/></svg></span> NASA 5 Hazards
          </a>
        </nav>

        <div class="sidebar-footer">
          <a href="profile.html" class="crew-profile-pill" style="text-decoration: none; cursor: pointer; display: flex;" title="View &amp; Edit Personal Profile">
            <div class="crew-avatar">${((user.firstName || user.username || 'A')[0] + (user.lastName ? user.lastName[0] : '')).toUpperCase()}</div>
            <div class="crew-info">
              <div class="crew-name">${[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Astronaut'}</div>
              <div class="crew-role">${user.roleTitle || user.role}</div>
            </div>
          </a>
          <button id="btn-logout-sidebar" class="btn-logout">
            <svg class="hud-icon" style="margin-right: 6px; width: 14px; height: 14px;" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Disconnect Session
          </button>
        </div>
      </aside>
    `;

    const topbarHtml = `
      <header class="app-topbar">
        <div class="topbar-left">
          <button id="btn-sidebar-toggle" class="mobile-menu-btn" aria-label="Toggle navigation menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="assets/images/nasa-logo.svg" alt="NASA" style="height: 24px; width: auto; vertical-align: middle; filter: drop-shadow(0 0 6px rgba(0, 240, 255, 0.4));">
            <div class="mission-indicator">
              <span>MISSION:</span>
              <span class="mission-tag">${user.missionName || 'ARTEMIS III'}</span>
            </div>
          </div>
          <div class="live-hud-ticker">
            <span id="live-met-clock">MET 021:14:32:08</span>
            <span style="color: var(--border-medium);">|</span>
            <span style="color: var(--accent-cyan);">ORBIT: 110x105 km</span>
          </div>
        </div>

        <div class="topbar-right">
          <div class="scenario-bar">
            <span class="scenario-label">Flight Scenario:</span>
            <button class="btn-scenario normal" data-scenario="NORMAL">[ NORMAL ]</button>
            <button class="btn-scenario warning" data-scenario="WARNING">[ WARNING ]</button>
            <button class="btn-scenario critical" data-scenario="CRITICAL">[ CRITICAL ]</button>
          </div>

          <div id="btn-comms-toggle" class="comms-badge ${activeComms.id}" title="Simulated Earth link: Click to cycle ONLINE / DELAYED / OFFLINE">
            <span class="comms-dot"></span>
            <span id="comms-text">${activeComms.label}</span>
          </div>
        </div>
      </header>
    `;

    const mainContainer = document.querySelector('.app-main') || document.querySelector('main');
    if (mainContainer) {
      document.body.insertAdjacentHTML('afterbegin', sidebarHtml);
      mainContainer.insertAdjacentHTML('afterbegin', topbarHtml);

      const footerDisclaimer = `
        <footer style="margin-top: 24px;">
          <div class="disclaimer-banner">
            <strong>SIMULATED DEMONSTRATION NOTICE:</strong> The health values displayed in this prototype are simulated data for demonstration purposes. Monitored health indicators and health considerations are informed by NASA's human spaceflight research.<br>
            <strong>DECISION-SUPPORT ONLY:</strong> All numerical thresholds are illustrative demonstration values, NOT official NASA medical limits. This is an onboard monitoring and decision-support prototype, NOT a medical diagnosis system.
          </div>
        </footer>
      `;
      mainContainer.insertAdjacentHTML('beforeend', footerDisclaimer);
    }

    const logoutBtn = document.getElementById('btn-logout-sidebar');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => window.api.logout());
    }

    const commsBadge = document.getElementById('btn-comms-toggle');
    if (commsBadge) {
      commsBadge.addEventListener('click', () => {
        currentCommsIndex = (currentCommsIndex + 1) % commsStates.length;
        localStorage.setItem('astro_comms_idx', currentCommsIndex);
        const nextState = commsStates[currentCommsIndex];
        commsBadge.className = `comms-badge ${nextState.id}`;
        document.getElementById('comms-text').textContent = nextState.label;
      });
    }

    const scenarioButtons = document.querySelectorAll('.btn-scenario');
    scenarioButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const scenario = btn.getAttribute('data-scenario');
        scenarioButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        try {
          await window.api.post('/demo/scenario', { scenario });
          window.location.reload();
        } catch (err) {
          alert(`Could not switch scenario: ${err.message}`);
        }
      });
    });

    // Mobile Drawer Toggle Handlers
    const toggleBtn = document.getElementById('btn-sidebar-toggle');
    const closeBtn = document.getElementById('btn-sidebar-close');
    const backdrop = document.getElementById('sidebar-backdrop');

    const closeSidebar = () => {
      document.body.classList.remove('sidebar-open');
    };

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.body.classList.toggle('sidebar-open');
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);

    document.querySelectorAll('.app-sidebar .nav-link').forEach(link => {
      link.addEventListener('click', closeSidebar);
    });

    setInterval(() => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      const clockElem = document.getElementById('live-met-clock');
      if (clockElem) clockElem.textContent = `MET 021:${h}:${m}:${s}`;
    }, 1000);
  });
})();
