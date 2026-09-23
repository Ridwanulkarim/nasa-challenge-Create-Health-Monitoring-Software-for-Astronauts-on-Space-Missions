/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Space Medicine Emergency QRH: client/src/pages/EmergencyPage.jsx
 */

import React, { useState, useRef } from 'react';

const EMERGENCY_PROTOCOLS = [
  {
    id: 'QRH-01',
    title: 'SANS & Cephalic Fluid Shifts',
    hazard: 'Microgravity Induced Fluid Shifts',
    urgency: 'HIGH',
    indicators: ['Blurred vision', 'Scotoma', 'Headache', 'Elevated optic nerve sheath diameter'],
    immediateActions: [
      'Cease all strenuous head-down or inverted physical activities immediately.',
      'Deploy Chibis Lower Body Negative Pressure (LBNP) unit at -25 mmHg for 60 minutes to draw fluid back to lower extremities.',
      'Perform near-point visual acuity testing and document log using onboard Amsler grid.',
      'Increase resistive lower-body ergometer exercise to stimulate venous return.'
    ],
    contraindications: 'Do not administer systemic vasopressors or diuretics without ground surgeon sign-off unless loss of consciousness occurs.'
  },
  {
    id: 'QRH-02',
    title: 'Space Motion Sickness (SMS) & Acute Emesis',
    hazard: 'Vestibular / Neurovestibular Disorientation',
    urgency: 'URGENT',
    indicators: ['Nausea', 'Cold sweating', 'Disorientation', 'Vomiting risk in helmet/cabin'],
    immediateActions: [
      'CRITICAL: If wearing spacesuit or EVA helmet, activate emesis absorption collar immediately to prevent airway occlusion.',
      'Stabilize head position against spacecraft bulkhead or sleeping berth restraint to reduce vestibular stimuli.',
      'Administer Promethazine 25mg IM or sublingual if oral route is compromised by nausea.',
      'Hydrate with electrolyte oral rehydration solution (ORS) in 150ml increments.'
    ],
    contraindications: 'Strictly prohibit suited EVA until 24 hours post-resolution of nausea.'
  },
  {
    id: 'QRH-03',
    title: 'Decompression Sickness (DCS) Post-EVA',
    hazard: 'Hypobaric Decompression / Nitrogen Emboli',
    urgency: 'CRITICAL',
    indicators: ['Joint pain ("the bends")', 'Cutaneous itching / marbling', 'Chest tightness / dyspnea', 'Neurological deficit'],
    immediateActions: [
      'Connect crew member to 100% High-Flow O₂ mask via the spacecraft medical resuscitation kit immediately.',
      'If available, configure airlock into hyperbaric repressurization mode to increase ambient atmospheric pressure.',
      'Position patient in supine neutral posture; minimize active joint flexion.',
      'Administer oral hydration fluids if patient is conscious and swallow reflex is intact.'
    ],
    contraindications: 'Do not allow physical exertion; do not depressurize airlock until full clinical assessment completed.'
  },
  {
    id: 'QRH-04',
    title: 'Solar Particle Event (SPE) Radiation Storm',
    hazard: 'Space Radiation Storm / Coronal Mass Ejection',
    urgency: 'CRITICAL',
    indicators: ['Dosimeter alarm > 10 mSv/hr', 'Solar flare visual detection', 'Mission Control automated storm relay'],
    immediateActions: [
      'Sound shipboard radiation alert. All crew members immediately ingress the Storm Shelter module (water tank / cargo corridor).',
      'Don personal polyethylene auxiliary radiation shielding garments.',
      'Distribute onboard prophylactic radioprotectants (Amifostine / Granulocyte CSF formulary) per flight surgeon mission package.',
      'Continuous dosimeter monitoring; document hourly cumulative exposure totals.'
    ],
    contraindications: 'Under no circumstances should any crew member exit the designated water-wall storm core until radiation telemetry drops below 0.1 mSv/hr.'
  },
  {
    id: 'QRH-05',
    title: 'Environmental Hypoxia & Cabin Hypercapnia',
    hazard: 'Atmospheric Revitalization Malfunction',
    urgency: 'CRITICAL',
    indicators: ['Cabin CO₂ > 4.5 mmHg', 'Cabin O₂ < 19.5%', 'Throbbing frontal headache', 'Tachypnea', 'Confusion'],
    immediateActions: [
      'Immediately don Emergency Breathing Apparatus (EBA) or Portable Breathing Apparatus (PBA) with dedicated O₂ supply.',
      'Inspect and switch ECLSS Lithium Hydroxide (LiOH) or amine-based CO₂ scrubber canisters to secondary redundant bank.',
      'Purge habitat atmosphere from reserve cryogenic O₂ storage if partial pressure remains depleted.',
      'Verify cabin ventilation fans are operating at 100% capacity to eliminate microgravity CO₂ stagnant air pockets.'
    ],
    contraindications: 'Do not sleep or remove breathing apparatus while cabin CO₂ indicator remains in warning status.'
  }
];

export default function EmergencyPage() {
  const [search, setSearch] = useState('');
  const [alarmActive, setAlarmActive] = useState(false);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);

  const toggleAlarm = () => {
    if (alarmActive) {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch {}
      }
      setAlarmActive(false);
    } else {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);

        // Siren frequency modulation
        let high = true;
        const sirenInterval = setInterval(() => {
          if (!oscRef.current) {
            clearInterval(sirenInterval);
            return;
          }
          high = !high;
          osc.frequency.setValueAtTime(high ? 880 : 440, ctx.currentTime);
        }, 300);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscRef.current = osc;
        setAlarmActive(true);
      } catch (err) {
        console.warn('Audio alarm error:', err);
      }
    }
  };

  const filtered = EMERGENCY_PROTOCOLS.filter(p => {
    const q = search.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.hazard.toLowerCase().includes(q) ||
      p.indicators.some(ind => ind.toLowerCase().includes(q))
    );
  });

  return (
    <div className="emergency-page">
      <div className="page-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="status-badge CRITICAL" style={{ fontSize: '10px' }}>OFFLINE AUTONOMOUS</span>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--status-critical-text)' }}>
              Space Medicine Emergency QRH
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Quick Reference Handbook &bull; Deep-Space Communications Blackout Medical Action Protocols
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className={`btn ${alarmActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '11px', padding: '8px 14px', background: alarmActive ? '#ff4444' : undefined, borderColor: '#ff4444' }}
            onClick={toggleAlarm}
          >
            {alarmActive ? 'SILENCE ALARM SOUND' : 'TEST EMERGENCY AUDIO TONE'}
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Search emergency protocols by symptom, hazard, or ID (e.g. vision, radiation, nausea, hypoxia, QRH-03)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Protocols Accordion / Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.map((p) => (
          <div 
            key={p.id} 
            className="card"
            style={{
              borderLeft: '4px solid var(--status-critical-border)',
              background: 'rgba(13, 22, 41, 0.85)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-cyan)' }}>{p.id}</span>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-highlight)', margin: 0 }}>{p.title}</h2>
              </div>
              <span className={`status-badge ${p.urgency === 'CRITICAL' ? 'CRITICAL' : 'WARNING'}`}>
                {p.urgency} PROTOCOL
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              <strong>NASA Hazard Category:</strong> {p.hazard}
            </div>

            <div style={{ marginBottom: '14px', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>DIAGNOSTIC CLINICAL INDICATORS:</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {p.indicators.map((ind, idx) => (
                  <span key={idx} className="status-badge WARNING" style={{ fontSize: '10px' }}>
                    {ind}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                IMMEDIATE MANDATORY DIRECTIVES:
              </div>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-highlight)', lineHeight: 1.6 }}>
                {p.immediateActions.map((act, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{act}</li>
                ))}
              </ol>
            </div>

            <div style={{ padding: '8px 12px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.3)', borderRadius: '4px', fontSize: '11.5px', color: '#ffb3b3' }}>
              <strong>CONTRAINDICATION / WARNING:</strong> {p.contraindications}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
