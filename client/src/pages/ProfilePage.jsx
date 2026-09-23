/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Personal Profile & Flight Credentials: client/src/pages/ProfilePage.jsx
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Astronaut');
  const [exerciseTarget, setExerciseTarget] = useState('2.0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/astronauts/me');
        if (res?.success && res.astronaut) {
          setProfile(res.astronaut);
          const fName = res.astronaut.first_name || user?.firstName || 'Astronaut';
          const lName = res.astronaut.last_name !== undefined ? res.astronaut.last_name : (user?.lastName || '');
          const clean = [fName, lName].filter(Boolean).join(' ') || 'Astronaut';
          setFullName(clean);
          setRoleTitle(res.astronaut.role_title || user?.roleTitle || 'Astronaut');
        }
      } catch (err) {
        console.warn('Could not fetch astronaut profile:', err);
        const fName = user?.firstName || 'Astronaut';
        const lName = user?.lastName || '';
        const clean = [fName, lName].filter(Boolean).join(' ') || 'Astronaut';
        setFullName(clean);
        setRoleTitle(user?.roleTitle || 'Astronaut');
      }

      setExerciseTarget(localStorage.getItem('astro_pref_exercise') || '2.0');
      setNotes(localStorage.getItem('astro_pref_notes') || '');
    }
    loadProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setToastMsg('');

    const rawName = fullName.trim();
    const parts = rawName.split(/\s+/);
    const firstName = parts[0] || 'Astronaut';
    const lastName = parts.slice(1).join(' ') || '';

    try {
      const patchRes = await api.patch('/astronauts/me', {
        first_name: firstName,
        last_name: lastName,
        role_title: roleTitle
      });

      localStorage.setItem('astro_pref_exercise', exerciseTarget);
      localStorage.setItem('astro_pref_notes', notes);

      // Update auth context state
      const updatedUser = {
        ...user,
        firstName,
        lastName,
        roleTitle
      };
      setUser(updatedUser);

      if (patchRes?.astronaut) {
        setProfile(patchRes.astronaut);
      }

      setToastMsg('Profile preferences saved successfully. Telemetry HUD updated.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(`Failed to save preferences: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const fName = (profile?.first_name !== undefined && profile?.first_name !== null && profile?.first_name !== '')
    ? profile.first_name
    : (user?.firstName || 'Astronaut');
  const lName = (profile?.last_name !== undefined && profile?.last_name !== null)
    ? profile.last_name
    : (user?.lastName || '');
  const cleanDisplay = [fName, lName].filter(Boolean).join(' ') || 'Astronaut';
  const avatarInitials = ((fName[0] || 'A') + (lName ? lName[0] : '')).toUpperCase();

  return (
    <div className="profile-page">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-highlight)' }}>
          Astronaut Personal Profile &amp; Flight Credentials
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Biometric Baseline Telemetry, Assigned Mission Hardware &amp; Custom Parameters
        </p>
      </div>

      {toastMsg && (
        <div style={{ background: 'rgba(0, 230, 118, 0.12)', border: '1px solid var(--status-normal-border)', color: 'var(--status-normal-text)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          ✓ {toastMsg}
        </div>
      )}

      {/* Crew Hero Identity Card */}
      <div className="card" style={{ marginBottom: '20px', borderColor: 'rgba(0, 240, 255, 0.35)', background: 'linear-gradient(135deg, rgba(13, 22, 41, 0.95) 0%, rgba(9, 14, 28, 0.95) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(13, 22, 41, 0.9))', border: '2px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', boxShadow: '0 0 16px rgba(0, 240, 255, 0.25)' }}>
              <span>{avatarInitials}</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-highlight)' }}>
                  {cleanDisplay}
                </h2>
                <span className="mono" style={{ fontSize: '10.5px', background: 'rgba(0, 240, 255, 0.12)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px' }}>
                  CALLSIGN: {(fName || 'CREW').toUpperCase()}-1
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {roleTitle}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                ID: <span style={{ color: 'var(--accent-cyan)' }}>{profile?.astronaut_id || user?.astronautId || 'AST-001'}</span> &bull; 
                Mission: <span style={{ color: 'var(--text-highlight)' }}>{profile?.mission_name || 'ARTEMIS III'}</span> &bull; 
                Spacecraft: <span style={{ color: 'var(--text-highlight)' }}>{profile?.spacecraft || 'Orion CSM'}</span>
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
              <svg className="hud-icon" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Personal 14-Day Baselines
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Resting Heart Rate:</span>
              <strong style={{ color: 'var(--text-highlight)' }}>72 BPM</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Blood Oxygen (SpO₂):</span>
              <strong style={{ color: 'var(--text-highlight)' }}>98.2%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Blood Pressure:</span>
              <strong style={{ color: 'var(--text-highlight)' }}>118 / 76 mmHg</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Core Temperature:</span>
              <strong style={{ color: 'var(--text-highlight)' }}>36.8°C</strong>
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
          </div>
        </div>

        {/* Spacecraft Mission Hardware */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
              Spacecraft Exercise Hardware
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Resistive Unit:</span>
              <strong style={{ color: 'var(--text-highlight)' }}>ARED (2.5 kN)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Aerobic Ergometer:</span>
              <strong style={{ color: 'var(--text-highlight)' }}>T2 Space Treadmill</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cephalic Relief:</span>
              <strong style={{ color: 'var(--accent-cyan)' }}>Chibis LBNP Suit</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Editable Preferences Form */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <svg className="hud-icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Personal Profile &amp; Mission Preferences
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit_full_name">
                Astronaut Name / Call Sign
              </label>
              <input 
                type="text" 
                id="edit_full_name" 
                className="form-input" 
                required 
                placeholder="e.g. Sajid, Alex Vance, or your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit_role_title">
                Mission Role / Specialization
              </label>
              <select 
                id="edit_role_title" 
                className="form-input"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              >
                <option value="Astronaut">Astronaut (Crew)</option>
                <option value="Mission Commander">Mission Commander (CDR)</option>
                <option value="Command Module Pilot">Command Module Pilot (CMP)</option>
                <option value="Mission Specialist">Mission Specialist (MS-1)</option>
                <option value="Flight Surgeon">Flight Surgeon (MD)</option>
                <option value="Payload Specialist">Payload Specialist (PS)</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="edit_exercise_target">
              Prescribed Countermeasure Daily Target (Hours)
            </label>
            <input 
              type="number" 
              step="0.1" 
              id="edit_exercise_target" 
              className="form-input" 
              value={exerciseTarget}
              onChange={(e) => setExerciseTarget(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" htmlFor="edit_notes">
              Astronaut Operational Notes &amp; Dietary Constraints
            </label>
            <textarea 
              id="edit_notes" 
              className="form-input" 
              rows={3} 
              placeholder="e.g. Higher sodium preference for hypovolemia prevention; left knee sensitivity on ARED squat protocol."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '13px' }}
            disabled={saving}
          >
            {saving ? 'SAVING PREFERENCES...' : 'SAVE PROFILE PREFERENCES'}
          </button>
        </form>
      </div>
    </div>
  );
}
