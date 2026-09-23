/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Active Alerts Page: client/src/pages/AlertsPage.jsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts');
      if (res?.success && res.alerts) {
        setAlerts(res.alerts);
      }
    } catch (err) {
      console.warn('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAcknowledge = async (id) => {
    try {
      await api.patch(`/alerts/${id}/read`);
      await fetchAlerts();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.patch(`/alerts/${id}/resolve`);
      await fetchAlerts();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (filter === 'WARNING') return a.severity === 'WARNING';
    if (filter === 'RESOLVED') return a.is_resolved;
    return true;
  });

  return (
    <div className="alerts-page">
      <div className="page-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-highlight)' }}>
            Active Medical &amp; Telemetry Alerts
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time Autonomous Onboard Anomaly Detection &amp; Space Medicine Protocols
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'CRITICAL', 'WARNING', 'RESOLVED'].map((f) => (
            <button
              key={f}
              type="button"
              className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '10.5px', padding: '6px 12px' }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alt) => (
            <div 
              key={alt.alert_id} 
              className="card"
              style={{
                borderLeft: `4px solid ${alt.severity === 'CRITICAL' ? 'var(--status-critical-border)' : alt.severity === 'WARNING' ? 'var(--status-warning-border)' : 'var(--accent-cyan)'}`,
                background: alt.severity === 'CRITICAL' ? 'rgba(255, 68, 68, 0.08)' : alt.severity === 'WARNING' ? 'rgba(255, 179, 0, 0.08)' : 'rgba(13, 22, 41, 0.7)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span className={`status-badge ${alt.severity}`}>{alt.severity}</span>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-highlight)' }}>
                      {alt.current_value}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(alt.created_at).toLocaleString()}
                    </span>
                    {alt.is_resolved && (
                      <span className="status-badge NORMAL" style={{ fontSize: '9px', padding: '1px 6px' }}>
                        RESOLVED
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-highlight)', margin: '4px 0' }}>
                    {alt.reason}
                  </h3>

                  <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.5px' }}>
                      PROTOCOL DIRECTIVE:
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {alt.recommended_action}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {!alt.is_read && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ fontSize: '11px', padding: '6px 12px' }}
                      onClick={() => handleAcknowledge(alt.alert_id)}
                    >
                      Acknowledge
                    </button>
                  )}
                  {!alt.is_resolved && (
                    <button 
                      className="btn btn-primary" 
                      style={{ fontSize: '11px', padding: '6px 12px' }}
                      onClick={() => handleResolve(alt.alert_id)}
                    >
                      Resolve Anomaly
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--status-normal-text)' }}>
            <span className="mono">✓ No alerts matching current filter. Spacecraft telemetry nominal.</span>
          </div>
        )}
      </div>
    </div>
  );
}
