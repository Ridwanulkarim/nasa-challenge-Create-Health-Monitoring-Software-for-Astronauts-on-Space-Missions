import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const res = await api.get('/alerts/active');
      if (res?.success && res.alerts) {
        setAlerts(res.alerts);
      }
    } catch (err) {
      console.warn('Could not load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      await api.patch(`/alerts/${alertId}/read`);
      setAlerts(prev => prev.filter(a => a.alert_id !== alertId));
    } catch (err) {
      alert(`Failed to acknowledge alert: ${err.message}`);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ALL') return true;
    return a.severity === filter;
  });

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.01em' }}>ACTIVE CLINICAL TELEMETRY ALERTS</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '2px' }}>
            Real-time automated incident queue, threshold violations, and protocol directives.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'CRITICAL', 'WARNING'].map(f => (
            <button
              key={f}
              type="button"
              className={`btn-filter ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '20px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Scanning telemetry alert feed...</div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ background: 'rgba(0, 230, 118, 0.06)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', color: 'var(--status-normal-text)', fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>✓</span> Zero {filter === 'ALL' ? 'active' : filter} alerts. All evaluated telemetry nominal.
          </div>
        ) : (
          filteredAlerts.map(alt => (
            <div key={alt.alert_id} className={`alert-card-item ${alt.severity}`} style={{ padding: '14px 18px', marginBottom: '12px' }}>
              <div className="alert-card-main">
                <div className="alert-card-header">
                  <span className={`status-badge ${alt.severity}`}>
                    <span className="comms-dot" style={{ background: 'currentColor', width: '6px', height: '6px' }}></span>
                    {alt.severity}
                  </span>
                  <span className="mono alert-id-badge">{alt.alert_id}</span>
                  <span className="alert-telemetry-tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    {alt.indicator_name || alt.indicator_id}: <strong>{alt.current_value}</strong>
                  </span>
                  <span className="mono alert-timestamp">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="alert-card-title" style={{ fontSize: '14px', margin: '6px 0' }}>{alt.reason}</h4>
                <div className="alert-protocol-box" style={{ marginTop: '8px', padding: '10px 14px' }}>
                  <div className="alert-protocol-label">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Protocol Directive:
                  </div>
                  <p className="alert-protocol-text" style={{ fontSize: '12px', marginTop: '2px' }}>{alt.recommended_action}</p>
                </div>
              </div>
              <div className="alert-card-actions">
                <button onClick={() => handleAcknowledge(alt.alert_id)} className="btn-ack-alert" style={{ padding: '8px 16px', fontSize: '11px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Acknowledge &amp; Clear
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
