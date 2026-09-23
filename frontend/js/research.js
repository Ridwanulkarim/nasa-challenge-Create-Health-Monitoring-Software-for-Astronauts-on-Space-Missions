document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await window.api.get('/research');
    if (!res.success) return;

    renderHazards(res.hazards);
    renderStudies(res.studies);
    renderSources(res.sources);
  } catch (err) {
    console.error('Research content error:', err);
  }
});

function renderHazards(hazards) {
  const container = document.getElementById('hazards-container');
  container.innerHTML = '';

  const hazardIcons = [
    '<svg class="hud-icon" style="color: #ef4444; width: 18px; height: 18px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.5"/><path d="M12 9.5V2m-2.16 14.5l-6.5 3.75m10.82-3.75l6.5 3.75"/><circle cx="12" cy="12" r="9" stroke-dasharray="1 3"/></svg>',
    '<svg class="hud-icon" style="color: #818cf8; width: 18px; height: 18px;" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 21v-2a5 5 0 0 1 10 0v2"/></svg>',
    '<svg class="hud-icon" style="color: #38bdf8; width: 18px; height: 18px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    '<svg class="hud-icon" style="color: #f59e0b; width: 18px; height: 18px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-25 12 12)"/></svg>',
    '<svg class="hud-icon" style="color: #06b6d4; width: 18px; height: 18px;" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>'
  ];

  hazards.forEach((h, idx) => {
    const card = document.createElement('div');
    card.className = 'hazard-card';

    card.innerHTML = `
      <div class="hazard-number">0${h.number}</div>
      <div class="hazard-title">
        <span>${hazardIcons[idx] || ''}</span>
        ${h.title}
      </div>
      <p style="font-size: 13px; color: var(--text-main); line-height: 1.6; max-width: 880px;">
        ${h.description}
      </p>

      <div class="mapping-box">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
          <span class="mono" style="color: var(--accent-cyan); font-weight: 800; font-size: 10.5px; letter-spacing: 0.06em;">
            MONITORING INDICATOR:
          </span>
          <span class="mono" style="color: var(--text-highlight); font-weight: 700;">${h.systemMapping}</span>
        </div>
        <p style="color: var(--text-muted); font-size: 12px; line-height: 1.45;">
          ${h.mappingDetail}
        </p>
        <p class="mono" style="color: var(--text-dim); font-size: 10.5px; margin-top: 6px;">
          NASA REF: ${h.researchContext}
        </p>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderStudies(studies) {
  const container = document.getElementById('studies-container');
  container.innerHTML = '';

  studies.forEach(s => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <h3 style="font-size: 14.5px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 8px;">${s.title}</h3>
      <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">
        ${s.description}
      </p>
      <div style="background: rgba(10, 16, 31, 0.8); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 11.5px;">
        <strong style="color: var(--text-highlight);">Operational Relevance:</strong> 
        <span style="color: var(--text-muted);">${s.relevance}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderSources(sources) {
  const container = document.getElementById('sources-container');
  container.innerHTML = '';

  sources.forEach(src => {
    const pill = document.createElement('a');
    pill.href = src.url;
    pill.target = '_blank';
    pill.rel = 'noopener noreferrer';
    pill.className = 'source-pill';

    pill.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <strong style="color: var(--text-highlight); font-size: 13px;">${src.organization}</strong>
        <span style="font-size: 11px; color: var(--accent-cyan);">↗</span>
      </div>
      <p style="font-size: 11.5px; color: var(--text-muted); line-height: 1.4;">${src.description}</p>
      <span class="mono" style="font-size: 10px; color: var(--accent-cyan);">${src.url}</span>
    `;
    container.appendChild(pill);
  });
}
