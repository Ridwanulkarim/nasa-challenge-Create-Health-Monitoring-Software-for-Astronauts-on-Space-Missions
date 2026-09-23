/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Ground Operations Fleet Overview: client/src/pages/MissionControlPage.jsx
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function MissionControlPage() {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFleet() {
      try {
        const res = await api.get('/mission-control/astronauts');
        if (res?.success && res.fleet) {
          setFleet(res.fleet);
        }
      } catch (err) {
        console.warn('Fleet fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFleet();
  }, []);

  const totalCrew = fleet.length;
  const normalCrew = fleet.filter(a => a.overall_status === 'NORMAL').length;
  const warningCrew = fleet.filter(a => a.overall_status === 'WARNING').length;
  const criticalCrew = fleet.filter(a => a.overall_status === 'CRITICAL').length;

  return (
    <div className="mission-control-page">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-highlight)' }}>
          Mission Control &bull; Fleet Bio-Telemetry Overview
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Real-Time Multi-Crew Telemetry Tracking &amp; In-Flight Health Diagnostics
        </p>
      </div>

      {/* Top Fleet Stat Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>TOTAL ACTIVE CREW</div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-highlight)', marginTop: '4px' }}>
            {totalCrew}
          </div>
        </div>

        <div className="card" style={{ padding: '14px', borderLeft: '4px solid var(--status-normal-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>NOMINAL STATUS</div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-normal-text)', marginTop: '4px' }}>
            {normalCrew}
          </div>
        </div>

        <div className="card" style={{ padding: '14px', borderLeft: '4px solid var(--status-warning-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>MONITORING / WARNING</div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-warning-text)', marginTop: '4px' }}>
            {warningCrew}
          </div>
        </div>

        <div className="card" style={{ padding: '14px', borderLeft: '4px solid var(--status-critical-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>CRITICAL INTERVENTION</div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-critical-text)', marginTop: '4px' }}>
            {criticalCrew}
          </div>
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
        {fleet.map((a) => (
          <div 
            key={a.astronaut_id} 
            className="card"
            style={{
              borderLeft: `4px solid ${a.overall_status === 'CRITICAL' ? 'var(--status-critical-border)' : a.overall_status === 'WARNING' ? 'var(--status-warning-border)' : 'var(--status-normal-border)'}`,
              background: 'rgba(13, 22, 41, 0.85)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-cyan)' }}>{a.astronaut_id}</span>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Day {a.mission_day || '--'}</span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-highlight)', marginTop: '2px' }}>
                  {[a.first_name, a.last_name].filter(Boolean).join(' ')}
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{a.role_title}</span>
              </div>
              <span className={`status-badge ${a.overall_status}`}>{a.overall_status}</span>
            </div>

            <div style={{ background: 'rgba(10, 16, 31, 0.85)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '14px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '5px' }}>
                <span>Mission:</span>
                <span style={{ color: 'var(--text-highlight)', fontWeight: 600 }}>{a.mission_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '5px' }}>
                <span>Spacecraft:</span>
                <span className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{a.spacecraft}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Telemetry Sync:</span>
                <span className="mono" style={{ color: 'var(--text-highlight)' }}>
                  {a.last_checkin_date ? new Date(a.last_checkin_date).toISOString().slice(0, 10) : 'Pending'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '16px', minHeight: '34px' }}>
              {a.evaluation_summary || 'Baseline physiological telemetry nominal.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
