import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const id = user?.astronautId || 'AST-001';
        const res = await api.get(`/health/${id}/history?limit=14`);
        if (res?.success && res.history) {
          setHistory(res.history);
        }
      } catch (err) {
        console.warn('Could not load history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  return (
    <div className="page-content">
      <div style={{ marginBottom: '16px' }}>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          TELEMETRY REPOSITORY // CHRONO-LOG
        </span>
        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.01em', marginTop: '2px' }}>
          Telemetry History &amp; Trend Analytics
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '2px' }}>
          Empirical physiological and behavioral logs evaluated against rolling personal baselines.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <svg className="hud-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Mission Chronological Health Records
          </div>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>14-Day Rolling Window</span>
        </div>

        {loading ? (
          <div style={{ padding: '20px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Loading flight logs...</div>
        ) : history.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>No prior telemetry logs recorded for this crew member.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '10px 12px' }}>DATE / MET</th>
                  <th style={{ padding: '10px 12px' }}>STATUS</th>
                  <th style={{ padding: '10px 12px' }}>HR (BPM)</th>
                  <th style={{ padding: '10px 12px' }}>SPO2 (%)</th>
                  <th style={{ padding: '10px 12px' }}>CORE TEMP</th>
                  <th style={{ padding: '10px 12px' }}>BP (MMHG)</th>
                  <th style={{ padding: '10px 12px' }}>SLEEP (H)</th>
                  <th style={{ padding: '10px 12px' }}>DOSE (MSV)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((rec, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--accent-cyan)' }}>Day {rec.mission_day} ({rec.record_date})</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`status-badge ${rec.overall_status}`}>{rec.overall_status}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-highlight)' }}>{rec.heart_rate || '--'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-highlight)' }}>{rec.spo2 || '--'}%</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-highlight)' }}>{rec.body_temp || '--'}°C</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-highlight)' }}>{rec.bp_systolic && rec.bp_diastolic ? `${rec.bp_systolic}/${rec.bp_diastolic}` : '--'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-highlight)' }}>{rec.sleep_duration || '--'}</td>
                    <td style={{ padding: '10px 12px', color: '#ffab00' }}>{rec.daily_radiation || rec.simulated_daily_dose_msv || '0.42'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
