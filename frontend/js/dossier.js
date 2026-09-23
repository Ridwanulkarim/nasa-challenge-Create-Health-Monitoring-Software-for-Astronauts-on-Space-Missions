/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Clinical Telemetry Dossier Client Script: frontend/js/dossier.js
 * 
 * Fetches 14-day aggregated flight surgeon dossier data, populates
 * the print-ready medical layout, and handles 1-click JSON export.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = window.api ? window.api.getUser() : null;
  const astronautId = user ? user.astronautId : 'AST-001';

  let currentDossier = null;

  try {
    const res = await window.api.get(`/dossier/${astronautId}`);
    if (res && res.success && res.dossier) {
      currentDossier = res.dossier;
      renderDossier(res.dossier);
    }
  } catch (err) {
    console.error('Failed to load dossier:', err);
    alert('Could not aggregate clinical dossier: ' + err.message);
  }

  // Print / Save as PDF Button
  const printBtn = document.getElementById('btn-print-dossier');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Export JSON Telemetry Packet Button
  const exportJsonBtn = document.getElementById('btn-export-json');
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
      if (!currentDossier) return alert('Dossier data not yet loaded.');
      const jsonStr = JSON.stringify(currentDossier, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AstroHealth_Clinical_Dossier_${astronautId}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
});

function renderDossier(d) {
  // 1. Meta & Profile
  const dossierId = document.getElementById('dossier-id');
  const timestamp = document.getElementById('dossier-timestamp');
  const checksum = document.getElementById('dos-checksum');
  if (dossierId) dossierId.textContent = d.dossierId;
  if (timestamp) timestamp.textContent = `Generated: ${new Date(d.generatedAt).toUTCString()}`;
  if (checksum) checksum.textContent = `CHECKSUM: ${d.relayPacketChecksum}`;

  const ast = d.astronaut || {};
  const user = window.api ? window.api.getUser() : null;
  const fName = (user && user.firstName) || ast.firstName || 'Astronaut';
  const lName = (user && user.lastName !== undefined && user.lastName !== null)
    ? user.lastName
    : ((ast.lastName !== undefined && ast.lastName !== null) ? ast.lastName : '');
  const role = (user && user.roleTitle) || ast.roleTitle || 'Mission Commander';

  const crewName = document.getElementById('dos-crew-name');
  const crewRole = document.getElementById('dos-crew-role');
  const missionName = document.getElementById('dos-mission-name');
  const statusBadge = document.getElementById('dos-status-badge');
  const clearance = document.getElementById('dos-clearance');

  const cleanFullName = [fName, lName].filter(Boolean).join(' ') || 'Astronaut';
  if (crewName) crewName.textContent = `${cleanFullName} (${(fName || 'CREW').toUpperCase()}-1)`;
  if (crewRole) crewRole.textContent = role;
  if (missionName) missionName.textContent = ast.missionName;
  if (statusBadge) {
    statusBadge.textContent = d.currentStatus;
    statusBadge.className = `status-badge ${d.currentStatus}`;
  }
  if (clearance) {
    clearance.textContent = d.flightSurgeonClearance;
    clearance.style.color = d.currentStatus === 'CRITICAL' ? 'var(--status-critical-text)' : (d.currentStatus === 'WARNING' ? 'var(--status-warning-text)' : 'var(--status-normal-text)');
  }

  // 2. 14-Day Indicators Table
  const indTbody = document.getElementById('dos-indicators-tbody');
  if (indTbody && d.indicatorSummaries) {
    indTbody.innerHTML = '';
    d.indicatorSummaries.forEach(ind => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--text-highlight);">${ind.name}</strong></td>
        <td class="mono" style="color: var(--accent-cyan);">${ind.unit}</td>
        <td class="mono" style="font-weight: 700;">${ind.average}</td>
        <td class="mono" style="color: var(--text-muted);">${ind.min}</td>
        <td class="mono" style="color: var(--text-muted);">${ind.max}</td>
        <td class="mono" style="color: ${ind.warningEvents > 0 ? 'var(--status-warning-text)' : 'var(--text-dim)'};">${ind.warningEvents}</td>
        <td class="mono" style="color: ${ind.criticalEvents > 0 ? 'var(--status-critical-text)' : 'var(--text-dim)'};">${ind.criticalEvents}</td>
      `;
      indTbody.appendChild(tr);
    });
  }

  // 3. Radiation & Countermeasures
  const rad = d.radiationSummary || {};
  const radCum = document.getElementById('dos-rad-cum');
  const radLimit = document.getElementById('dos-rad-limit');
  if (radCum) radCum.textContent = `${rad.cumulativeDoseMsv} mSv`;
  if (radLimit) radLimit.textContent = `${rad.limitProgressPct}% of ${rad.careerLimitMsv} mSv max`;

  const cm = d.countermeasureSummary || {};
  const cmScore = document.getElementById('dos-cm-score');
  const cmCounts = document.getElementById('dos-cm-counts');
  if (cmScore) cmScore.textContent = `${cm.adherenceRatePct}%`;
  if (cmCounts) cmCounts.textContent = `${cm.totalCompleted} of ${cm.totalPrescribed} sessions verified`;

  // 4. Consecutive Records Log
  const recTbody = document.getElementById('dos-records-tbody');
  if (recTbody && d.records) {
    recTbody.innerHTML = '';
    d.records.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="mono">${r.record_date}</td>
        <td class="mono" style="color: var(--accent-cyan);">MD ${r.mission_day}</td>
        <td><span class="status-badge ${r.overall_status}" style="font-size: 9.5px; padding: 1px 6px;">${r.overall_status}</span></td>
        <td style="font-size: 11.5px; line-height: 1.4;">
          <strong>${r.evaluation_summary || 'Nominal vital signs.'}</strong><br>
          <span style="color: var(--text-dim); font-family: var(--font-mono);">${r.recommended_action || 'Continue routine protocol.'}</span>
        </td>
      `;
      recTbody.appendChild(tr);
    });
  }
}
