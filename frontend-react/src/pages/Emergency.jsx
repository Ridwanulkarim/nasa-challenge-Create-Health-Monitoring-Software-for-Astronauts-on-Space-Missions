import React, { useState } from 'react';

const PROTOCOLS = [
  {
    id: 'hypoxia',
    urgency: 'CRITICAL',
    title: 'Severe Hypoxia / Cabin Pressure Anomaly',
    trigger: 'SpO2 < 85% or Cabin O2 < 18.0 kPa or Cabin Pressure Drop',
    steps: [
      'Don emergency Quick-Don Oxygen Mask immediately; set flow regulator to 100% O2 @ 15 L/min.',
      'Notify crew commander; confirm ECLSS cabin depressurization valve closure.',
      'Check SpO2 continuously on wearable mesh; confirm pulse oximeter waveform.',
      'If unconscious or cyanotic, initiate bag-valve-mask ventilations with 100% O2.',
      'Transmit automated telemetry incident burst to Flight Surgeon console.'
    ]
  },
  {
    id: 'tachycardia',
    urgency: 'CRITICAL',
    title: 'Sustained Ventricular Tachyarrhythmia / Cardiac Collapse',
    trigger: 'Heart Rate > 160 BPM at rest with dizziness or syncope',
    steps: [
      'Cease all physical activity; assist astronaut to recumbent position on Crew Rest Station.',
      'Retrieve Automated External Defibrillator (AED) and attach adult therapy pads.',
      'Administer 100% supplemental O2 via non-rebreather mask.',
      'Perform modified Valsalva maneuver if crew member remains conscious and hemodynamically stable.',
      'If AED advises shock, clear astronaut and deliver discharge as indicated.'
    ]
  },
  {
    id: 'sms',
    urgency: 'URGENT',
    title: 'Acute Space Motion Sickness (SMS) Emesis with Aspiration Risk',
    trigger: 'Repeated projectile vomiting, dizziness, extreme pallor',
    steps: [
      'Position astronaut head upright or forward to prevent microgravity vomitus aspiration.',
      'Retrieve Contingency Emesis Bag with internal absorbent liner.',
      'Administer Promethazine 25-50 mg IM (intramuscular) via onboard medical kit autoinjector.',
      'Initiate oral rehydration solution (electrolyte replacement) once emesis subsides.',
      'Monitor hydration metrics and urine specific gravity for next 12 hours.'
    ]
  }
];

export default function Emergency() {
  const [checkedSteps, setCheckedSteps] = useState({});

  const toggleStep = (key) => {
    setCheckedSteps(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const playTestChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  };

  return (
    <div className="page-content">
      {/* Hero */}
      <div className="card" style={{
        marginBottom: '20px',
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(60, 16, 24, 0.9) 0%, rgba(32, 10, 18, 0.95) 100%)',
        borderColor: 'rgba(239, 68, 68, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 800, letterSpacing: '0.15em', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                NASA HRP AUTONOMOUS SPACEFLIGHT PROTOCOL &bull; QUICK REFERENCE HANDBOOK
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', marginTop: '2px' }}>
                ONBOARD EMERGENCY SPACE MEDICINE GUIDE (QRH)
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Standardized step-by-step clinical decision procedures for crew autonomy during Earth communication delays.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={playTestChime}
              style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444', fontSize: '11px', padding: '7px 14px' }}
            >
              TEST AUDIO ALARM CHIME
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setCheckedSteps({})}
              style={{ fontSize: '11px', padding: '7px 14px' }}
            >
              RESET ALL
            </button>
          </div>
        </div>
      </div>

      {/* Protocol List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {PROTOCOLS.map(proto => (
          <div key={proto.id} className="card" style={{ borderColor: proto.urgency === 'CRITICAL' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 171, 0, 0.3)' }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`status-badge ${proto.urgency}`}>{proto.urgency}</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-highlight)' }}>{proto.title}</span>
              </div>
              <span className="mono" style={{ fontSize: '10.5px', color: 'var(--accent-cyan)' }}>AUTONOMOUS CONTINGENCY</span>
            </div>

            <div style={{ marginBottom: '12px', fontSize: '11.5px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              TRIGGER CRITERIA: <span style={{ color: 'var(--text-main)' }}>{proto.trigger}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {proto.steps.map((st, i) => {
                const stepKey = `${proto.id}-${i}`;
                const isChecked = !!checkedSteps[stepKey];
                return (
                  <label 
                    key={i} 
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px 14px',
                      background: isChecked ? 'rgba(0, 230, 118, 0.08)' : 'rgba(0, 0, 0, 0.25)',
                      border: `1px solid ${isChecked ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => toggleStep(stepKey)} 
                      style={{ marginTop: '2px', accentColor: 'var(--accent-cyan)' }}
                    />
                    <span style={{ fontSize: '12.5px', color: isChecked ? 'var(--status-normal-text)' : 'var(--text-main)' }}>
                      <strong>STEP {i + 1}:</strong> {st}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
