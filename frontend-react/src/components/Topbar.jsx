import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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

  const [metTime, setMetTime] = useState('MET 021:14:32:08');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const s = String(now.getSeconds()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const h = String(now.getHours()).padStart(2, '0');
      setMetTime(`MET 021:${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleComms = () => {
    const next = (commsIndex + 1) % commsStates.length;
    setCommsIndex(next);
    localStorage.setItem('astro_comms_idx', String(next));
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
          <span id="live-met-clock">{metTime}</span>
          <span style={{ color: 'var(--border-medium)' }}>|</span>
          <span style={{ color: 'var(--accent-cyan)' }}>ORBIT: 110x105 km</span>
        </div>
      </div>

      <div className="topbar-right">
        <div 
          id="btn-comms-toggle" 
          className={`comms-badge ${activeComms.id}`}
          onClick={handleToggleComms}
          style={{ cursor: 'pointer' }}
          title="Simulated Earth link: Click to cycle ONLINE / DELAYED / OFFLINE"
        >
          <span className="comms-dot"></span>
          <span id="comms-text">{activeComms.label}</span>
        </div>
      </div>
    </header>
  );
}
