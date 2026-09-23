/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Topbar Component: client/src/components/layout/Topbar.jsx
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

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

  const [missionTime, setMissionTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setMissionTime(`MET: D+023 ${hrs}:${mins}:${secs} UTC`);
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
      </div>

      <div className="topbar-right">
        <div 
          className="comms-status-pill" 
          id="comms-link-badge"
          title="Simulate Spacecraft Communication Latency (Click to cycle)"
          onClick={handleCycleComms}
          style={{ cursor: 'pointer' }}
        >
          <span className={`pulse-dot ${activeComms.id}`}></span>
          <span className="comms-label">{activeComms.label}</span>
          <span className="comms-latency">[{activeComms.latency}]</span>
        </div>

        <div className="telemetry-timestamp mono" id="topbar-clock">
          {missionTime}
        </div>
      </div>
    </header>
  );
}
