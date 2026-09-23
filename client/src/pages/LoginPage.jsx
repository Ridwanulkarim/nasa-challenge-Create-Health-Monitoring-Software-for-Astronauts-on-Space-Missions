/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Login Page: client/src/pages/LoginPage.jsx
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Astronaut');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to dashboard or mission control
  React.useEffect(() => {
    if (user) {
      if (user.role === 'MISSION_CONTROL') {
        navigate('/mission-control');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your astronaut name or call sign.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(name.trim(), password, { name: name.trim(), roleTitle });
      if (res.user?.role === 'MISSION_CONTROL') {
        navigate('/mission-control');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo-badge" style={{ display: 'inline-block', marginBottom: '14px' }}>
            <img 
              src="/assets/images/nasa-logo.svg" 
              alt="NASA Meatball Insignia" 
              style={{ height: '72px', width: 'auto', filter: 'drop-shadow(0 0 16px rgba(0, 240, 255, 0.45))' }}
            />
          </div>
          <h1>AstroHealth Telemetry</h1>
          <p className="subtitle">NASA Deep-Space Bio-Telemetry & Decision Support</p>
          <div className="mission-tag">MISSION: ARTEMIS III / MARS TRANSIT</div>
        </div>

        {error && (
          <div className="alert-banner CRITICAL" style={{ marginBottom: '16px', display: 'block' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="astronaut_name">
              Astronaut Name / Call Sign
            </label>
            <input 
              type="text" 
              id="astronaut_name" 
              className="form-input" 
              placeholder="Enter your name / call sign (e.g. Sajid, Alex Vance)" 
              required 
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="astronaut_role">
              Mission Role / Rank
            </label>
            <select 
              id="astronaut_role" 
              className="form-input"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            >
              <option value="Astronaut">Astronaut (Standard Crew Baseline)</option>
              <option value="Mission Commander">Mission Commander (CDR)</option>
              <option value="Command Module Pilot">Command Module Pilot (CMP)</option>
              <option value="Mission Specialist">Mission Specialist (MS-1)</option>
              <option value="Flight Surgeon">Flight Surgeon (Aerospace MD)</option>
              <option value="Payload Specialist">Payload Specialist (PS)</option>
              <option value="Mission Control Specialist">Mission Control Ground Specialist</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Telemetry Security Passcode
            </label>
            <input 
              type="password" 
              id="password" 
              className="form-input" 
              placeholder="Enter terminal passcode" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
              Standard Mission Simulation Mode Active (Passcode preset to <code>password</code>)
            </small>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '8px', padding: '14px', fontSize: '13px' }}
            disabled={loading}
          >
            {loading ? 'AUTHENTICATING TELEMETRY SESSION...' : 'AUTHENTICATE TELEMETRY SESSION'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          NASA Space Apps Challenge 2026 &bull; Secure Deep Space Telemetry Hub
        </div>
      </div>
    </div>
  );
}
