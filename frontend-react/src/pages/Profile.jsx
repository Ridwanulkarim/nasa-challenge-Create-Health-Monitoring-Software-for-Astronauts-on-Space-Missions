import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState([user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Sajid');
  const [callsign, setCallsign] = useState(user?.callsign || 'Orion-Lead');
  const [role, setRole] = useState(user?.roleTitle || 'Mission Commander');

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Sajid';
  const avatarLetter = (displayName[0] || 'S').toUpperCase();

  const handleSave = (e) => {
    e.preventDefault();
    const parts = name.trim().split(' ');
    const firstName = parts[0] || 'Sajid';
    const lastName = parts.slice(1).join(' ');
    updateUser({
      firstName,
      lastName,
      callsign,
      roleTitle: role
    });
    setEditing(false);
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.01em' }}>ASTRONAUT MEDICAL DOSSIER &amp; PROFILE</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '2px' }}>
            Flight readiness certificate, physiological baselines, and active telemetry parameters.
          </p>
        </div>
        <button 
          type="button" 
          className="btn-primary" 
          onClick={() => setEditing(!editing)}
          style={{ padding: '8px 16px', fontSize: '11.5px' }}
        >
          {editing ? '✕ CANCEL EDIT' : '✎ EDIT PROFILE'}
        </button>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: '16px', borderColor: 'var(--accent-cyan)' }}>
          <div className="card-header">
            <div className="card-title">Edit Astronaut Credentials</div>
          </div>
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Callsign</label>
              <input type="text" className="form-input" value={callsign} onChange={e => setCallsign(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mission Role</label>
              <input type="text" className="form-input" value={role} onChange={e => setRole(e.target.value)} required />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <button type="submit" className="btn-primary" style={{ padding: '8px 18px', fontSize: '11.5px' }}>SAVE PROFILE</button>
            </div>
          </form>
        </div>
      )}

      {/* Main Astronaut Card */}
      <div className="card" style={{
        marginBottom: '20px',
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(11, 28, 62, 0.9) 0%, rgba(9, 18, 42, 0.92) 100%)',
        borderColor: 'rgba(0, 240, 255, 0.35)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00f0ff 0%, #2563eb 100%)',
              color: '#030712',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 900,
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)'
            }}>
              {avatarLetter}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                  {displayName}
                </h2>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)', background: 'rgba(0, 240, 255, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.25)' }}>
                  CALLSIGN: {user?.callsign || 'Orion-Lead'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {user?.roleTitle || user?.role || 'Mission Commander'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                ID: <span style={{ color: 'var(--accent-cyan)' }}>{user?.astronautId || 'AST-001'}</span> &bull; 
                Mission: <span style={{ color: 'var(--text-highlight)' }}>{user?.missionName || 'ARTEMIS III'}</span> &bull; 
                Spacecraft: <span style={{ color: 'var(--text-highlight)' }}>Orion CSM</span>
              </div>
            </div>
          </div>

          <div>
            <span className="status-badge NORMAL" style={{ fontSize: '10.5px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>✓</span> CLASS 1 SPACE MEDICAL CLEARANCE
            </span>
            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '6px', textAlign: 'right' }}>
              Assigned Surgeon: Dr. Sarah Chen, MD (JSC)
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Bio & Mission Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px', marginBottom: '20px' }}>
        
        {/* Personal Baseline Biometrics */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Personal 14-Day Baselines
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Resting Heart Rate:</span>
              <strong style={{ color: 'var(--text-highlight)' }}>72 BPM</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Blood Oxygen (SpO₂):</span>
              <strong style={{ color: 'var(--accent-cyan)' }}>98.0%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Blood Pressure:</span>
              <strong style={{ color: 'var(--text-highlight)' }}>118 / 76 mmHg</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Core Temperature:</span>
              <strong style={{ color: 'var(--text-highlight)' }}>36.8°C</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Body Mass:</span>
              <strong style={{ color: 'var(--text-highlight)' }}>75.0 kg</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Daily Fluid Recovery:</span>
              <strong style={{ color: 'var(--status-normal-text)' }}>2.8 L / day</strong>
            </div>
          </div>
        </div>

        {/* Connected Biosensors */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>📡</span> Paired Biosensors &amp; IoT
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-highlight)' }}>WHOOP 4.0 Bio-Strap</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>BLE 5.3 Mesh &bull; 100 Hz PPG</div>
              </div>
              <span className="mono" style={{ fontSize: '10.5px', color: 'var(--status-normal-text)', fontWeight: 700 }}>93% Battery</span>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-highlight)' }}>Fitbit Sense Bio-Tracker</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>cEDA Stress &bull; Skin Temp</div>
              </div>
              <span className="mono" style={{ fontSize: '10.5px', color: 'var(--status-normal-text)', fontWeight: 700 }}>87% Battery</span>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-highlight)' }}>EPD-702 Active Dosimeter</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Real-Time Silicon Diode</div>
              </div>
              <span className="mono" style={{ fontSize: '10.5px', color: '#ffab00', fontWeight: 700 }}>Calibrated</span>
            </div>
          </div>
        </div>

        {/* Emergency Medical Factors */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Emergency Clinical Data
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Blood Group:</span>
              <strong style={{ color: '#ef4444' }}>O-Positive (O+)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Drug Allergies:</span>
              <strong style={{ color: 'var(--status-normal-text)' }}>NKDA (None)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cumulative Dose:</span>
              <strong style={{ color: '#ffab00' }}>5.62 mSv</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Career Limit Margin:</span>
              <strong style={{ color: 'var(--status-normal-text)' }}>44.38 mSv remaining</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Countermeasures:</span>
              <strong style={{ color: 'var(--status-normal-text)' }}>92% Adherence</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
