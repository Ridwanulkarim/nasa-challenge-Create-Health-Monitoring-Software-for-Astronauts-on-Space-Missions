import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [name, setName] = useState('Sajid');
  const [role, setRole] = useState('Mission Commander');
  const [password, setPassword] = useState('AstroPass2026!');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.login(name.toLowerCase().trim() || 'sajid', password, {
        name: name.trim(),
        roleTitle: role
      });
      if (res?.user) {
        updateUser(res.user);
        if (res.user.role === 'MISSION_CONTROL') {
          navigate('/mission-control');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.warn('Backend note, fallback to autonomous deep-space simulation session:', err.message);
      const parts = name.trim().split(' ');
      const firstName = parts[0] || 'Sajid';
      const lastName = parts.slice(1).join(' ');
      const isGround = role.includes('Control') || role.includes('Director');

      const simUser = {
        userId: 'usr-' + firstName.toLowerCase(),
        username: firstName.toLowerCase(),
        email: `${firstName.toLowerCase()}@nasa.space`,
        role: isGround ? 'MISSION_CONTROL' : 'ASTRONAUT',
        astronautId: 'AST-001',
        firstName: firstName,
        lastName: lastName,
        roleTitle: role,
        missionId: 'ARTEMIS-III',
        missionName: 'Artemis III Lunar Transit & Surface'
      };

      api.setToken('simulated-autonomous-deep-space-token');
      api.setUser(simUser);
      updateUser(simUser);

      if (isGround) {
        navigate('/mission-control');
      } else {
        navigate('/dashboard');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="auth-container" style={{ width: '100%', maxWidth: '440px' }}>
        
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="auth-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <img src="/assets/images/nasa-logo.svg" alt="NASA Meatball Insignia" style={{ height: '64px', width: 'auto', filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.4))' }} />
          </div>
          <h2 style={{ fontSize: '21px', fontWeight: 800, letterSpacing: '0.05em', color: '#ffffff', marginTop: '2px' }}>
            ASTROHEALTH TELEMETRY
          </h2>
          <div style={{ color: 'var(--accent-cyan)', fontSize: '10.5px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginTop: '4px' }}>
            NASA Space Apps Challenge 2026
          </div>
          <p style={{ color: '#93c5fd', fontSize: '11.5px', marginTop: '5px', fontStyle: 'italic', opacity: 0.95 }}>
            &ldquo;Science is a beautiful gift to humanity.&rdquo;
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '3px', letterSpacing: '0.02em' }}>
            Autonomous Onboard Health Monitoring &amp; Decision-Support System
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--status-critical-bg)', border: '1px solid var(--status-critical-border)', color: 'var(--status-critical-text)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="astronaut_name">Astronaut Name / Operator Call Sign</label>
            <input 
              type="text" 
              id="astronaut_name" 
              className="form-input" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name / call sign (e.g., Sajid)" 
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="astronaut_role">Mission Role / Rank</label>
            <select 
              id="astronaut_role" 
              className="form-select" 
              style={{ width: '100%' }}
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="Mission Commander">Mission Commander</option>
              <option value="Astronaut">Astronaut</option>
              <option value="Flight Engineer & Pilot">Flight Engineer &amp; Pilot</option>
              <option value="Science Payload Specialist">Science Payload Specialist</option>
              <option value="Chief Medical Officer">Chief Medical Officer</option>
              <option value="EVA Operations Specialist">EVA Operations Specialist</option>
              <option value="Flight Director">Flight Director (Ground Ops)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="password">Security Passcode</label>
            <input 
              type="password" 
              id="password" 
              className="form-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••" 
              required 
            />
          </div>

          <button 
            type="submit" 
            id="btn-login-submit" 
            className="btn-primary" 
            disabled={submitting}
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {submitting ? 'Verifying telemetry credentials...' : 'AUTHENTICATE TELEMETRY SESSION'}
          </button>
        </form>

        <div style={{
          background: 'rgba(10, 18, 38, 0.65)',
          border: '1px solid rgba(0, 240, 255, 0.16)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          marginTop: '18px',
          lineHeight: 1.5,
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)'
        }}>
          <div><strong>Default Passcode:</strong> <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>AstroPass2026!</span></div>
          <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-dim)' }}>
            Enter any astronaut name and select your mission role to initialize your session.
          </div>
        </div>

        <div style={{ marginTop: '16px', fontSize: '10px', color: 'var(--text-dim)', lineHeight: 1.4, borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
          <strong>Simulated Data Notice:</strong> Health telemetry values are simulated for demonstration. Indicators are informed by NASA human spaceflight research.
        </div>

      </div>
    </div>
  );
}
