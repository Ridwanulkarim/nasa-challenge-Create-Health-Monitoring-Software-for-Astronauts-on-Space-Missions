/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Topbar Component: frontend/src/components/layout/Topbar.jsx
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Topbar({ onToggleMobile }) {
  const { user } = useAuth();

  const commsStates = [
    { id: 'online', label: 'LINK ONLINE', latency: '< 1.2s' },
    { id: 'delayed', label: 'LINK DELAYED (12m)', latency: '12m 40s' },
    { id: 'offline', label: 'LINK OFFLINE (AUTONOMOUS)', latency: 'Blackout' }
  ];

  const [commsIndex, setCommsIndex] = useState(() => {
    return parseInt(localStorage.getItem('astro_comms_idx') || '0', 10);
  });

  const [missionTime, setMissionTime] = useState('MET 023:14:32:08');
  const [activeScenario, setActiveScenario] = useState('NORMAL');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setMissionTime(`MET 023:${hrs}:${mins}:${secs}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCycleComms = () => {
    const nextIdx = (commsIndex + 1) % commsStates.length;
    setCommsIndex(nextIdx);
    localStorage.setItem('astro_comms_idx', nextIdx.toString());
  };

  const handleScenarioChange = async (scenario) => {
    setActiveScenario(scenario);
    try {
      await api.post('/demo/scenario', { scenario });
      window.location.reload();
    } catch (err) {
      console.warn('Scenario switch notice:', err.message);
      window.location.reload();
    }
  };

  const activeComms = commsStates[commsIndex];

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button 
          id="btn-sidebar-toggle" 
          className="mobile-menu-btn" 
          aria-label="Toggle navigation menu"
          onClick={onToggleMobile}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img 
            src="/assets/images/nasa-logo.svg" 
            alt="NASA" 
            style={{ height: '24px', width: 'auto', verticalAlign: 'middle', filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.4))' }} 
          />
          <div className="mission-indicator">
            <span>MISSION:</span>
            <span className="mission-tag">{user?.missionName || 'ARTEMIS III'}</span>
          </div>
        </div>

        <div className="live-hud-ticker">
          <span id="live-met-clock">{missionTime}</span>
          <span style={{ color: 'var(--border-medium)' }}>|</span>
          <span style={{ color: 'var(--accent-cyan)' }}>ORBIT: 110x105 km</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Scenario Switcher Bar */}
        <div className="scenario-bar">
          <span className="scenario-label">Flight Scenario:</span>
          <button 
            type="button"
            className={`btn-scenario normal ${activeScenario === 'NORMAL' ? 'active' : ''}`}
            onClick={() => handleScenarioChange('NORMAL')}
            title="Inject Nominal Spaceflight Baseline"
          >
            [ NORMAL ]
          </button>
          <button 
            type="button"
            className={`btn-scenario warning ${activeScenario === 'WARNING' ? 'active' : ''}`}
            onClick={() => handleScenarioChange('WARNING')}
            title="Inject Elevated Cardiac & Radiation Telemetry"
          >
            [ WARNING ]
          </button>
          <button 
            type="button"
            className={`btn-scenario critical ${activeScenario === 'CRITICAL' ? 'active' : ''}`}
            onClick={() => handleScenarioChange('CRITICAL')}
            title="Inject Acute Microgravity Distress Scenario"
          >
            [ CRITICAL ]
          </button>
        </div>

        {/* Comms Link Pill */}
        <div 
          id="btn-comms-toggle"
          className={`comms-badge ${activeComms.id}`}
          title="Simulated Earth link: Click to cycle ONLINE / DELAYED / OFFLINE"
          onClick={handleCycleComms}
          style={{ cursor: 'pointer' }}
        >
          <span className="comms-dot"></span>
          <span id="comms-text">{activeComms.label}</span>
        </div>
      </div>
    </header>
  );
}
