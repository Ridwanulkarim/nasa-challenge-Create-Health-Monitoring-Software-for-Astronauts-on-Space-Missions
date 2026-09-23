import React, { useState, useEffect } from 'react';
import api from '../services/api';

const CREW_MEMBERS = [
  { id: 'AST-001', name: 'Sajid', role: 'Mission Commander', status: 'NORMAL', hr: 72, spo2: 98, temp: 36.8, adherence: '100%', bioMesh: 'WHOOP 4.0' },
  { id: 'AST-002', name: 'Alex Vance', role: 'Flight Engineer & Pilot', status: 'NORMAL', hr: 68, spo2: 99, temp: 36.6, adherence: '75%', bioMesh: 'Fitbit Sense' },
  { id: 'AST-003', name: 'Dr. Elena Rostova', role: 'Science Payload Specialist', status: 'WARNING', hr: 94, spo2: 95, temp: 37.4, adherence: '50%', bioMesh: 'WHOOP 4.0' },
  { id: 'AST-004', name: 'Marcus Sterling', role: 'Chief Medical Officer', status: 'NORMAL', hr: 64, spo2: 99, temp: 36.5, adherence: '100%', bioMesh: 'Bio-Harness 3' }
];

export default function MissionControl() {
  const [crew, setCrew] = useState(CREW_MEMBERS);
  const [latency, setLatency] = useState('12m 40s');

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
        <div>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            EARTH GROUND OPERATIONS // JOHNSON SPACE CENTER
          </span>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.01em', marginTop: '2px' }}>
            MISSION CONTROL FLEET MEDICAL CONSOLE
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '2px' }}>
            Flight Surgeon surveillance console monitoring deep-space Orion crew vitals and countermeasure compliance.
          </p>
        </div>

        <div className="card" style={{ padding: '8px 14px', background: 'rgba(0, 0, 0, 0.4)', borderColor: 'var(--border-subtle)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>ONE-WAY TELEMETRY LATENCY</div>
          <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
            🛰 {latency} (Earth - Mars Transit)
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <svg className="hud-icon" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="2" x2="12" y2="22"/></svg> Artemis Crew Physiological Fleet Overview
          </div>
          <span className="status-badge NORMAL">4 Crew Monitored</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-dim)' }}>
                <th style={{ padding: '10px 12px' }}>ASTRONAUT</th>
                <th style={{ padding: '10px 12px' }}>ROLE</th>
                <th style={{ padding: '10px 12px' }}>EVAL STATE</th>
                <th style={{ padding: '10px 12px' }}>HR</th>
                <th style={{ padding: '10px 12px' }}>SPO2</th>
                <th style={{ padding: '10px 12px' }}>CORE TEMP</th>
                <th style={{ padding: '10px 12px' }}>ADHERENCE</th>
                <th style={{ padding: '10px 12px' }}>SENSOR MESH</th>
              </tr>
            </thead>
            <tbody>
              {crew.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--text-highlight)', fontWeight: 700 }}>
                    {c.name} <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>({c.id})</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{c.role}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`status-badge ${c.status}`}>{c.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--accent-cyan)' }}>{c.hr} BPM</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-highlight)' }}>{c.spo2}%</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-highlight)' }}>{c.temp}°C</td>
                  <td style={{ padding: '10px 12px', color: 'var(--status-normal-text)' }}>{c.adherence}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-dim)' }}>{c.bioMesh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
