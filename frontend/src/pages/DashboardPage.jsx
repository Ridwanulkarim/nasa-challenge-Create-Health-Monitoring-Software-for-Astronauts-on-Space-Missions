/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Dashboard Page: client/src/pages/DashboardPage.jsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [cmData, setCmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingCmId, setLoggingCmId] = useState(null);

  const fetchHealthRecord = useCallback(async () => {
    if (!user?.astronautId) return;
    try {
      const res = await api.get(`/health/${user.astronautId}/latest`);
      if (res?.success && res.record) {
        setRecord(res.record);
      }
    } catch (err) {
      console.warn('No health record found:', err);
    }
  }, [user?.astronautId]);

  const fetchCountermeasures = useCallback(async () => {
    try {
      const res = await api.get('/countermeasures/active');
      if (res?.success && res.protocols) {
        setCmData(res);
      }
    } catch (err) {
      console.warn('Could not load countermeasures:', err);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchHealthRecord(), fetchCountermeasures()]);
      setLoading(false);
    }
    loadData();
  }, [fetchHealthRecord, fetchCountermeasures]);

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await api.patch(`/alerts/${alertId}/read`);
      await fetchHealthRecord();
    } catch (err) {
      alert(`Failed to acknowledge alert: ${err.message}`);
    }
  };

  const handleLogCountermeasure = async (p) => {
    setLoggingCmId(p.id);
    try {
      await api.post('/countermeasures/log', {
        protocol_id: p.id,
        protocol_title: p.title,
        category: p.category,
        duration_minutes: p.durationMinutes || 30
      });
      await fetchCountermeasures();
    } catch (err) {
      alert('Failed to log protocol completion: ' + err.message);
    } finally {
      setLoggingCmId(null);
    }
  };

  const overallStatus = record?.overall_status || 'NORMAL';
  const missionDayText = record ? `Mission Day ${record.mission_day} (${record.record_date})` : 'Mission Day 23 (2026-09-23)';
  const activeAlerts = record?.activeAlerts || [];
  const indicators = record?.indicators || [];
  const symptoms = record?.symptoms || [];

  const dailyDose = record?.simulated_daily_dose_msv || 0.42;
  const cumDose = record?.simulated_cumulative_dose_msv || 5.62;
  const radPct = Math.min(100, Math.round((cumDose / 50.0) * 1000) / 10);

  return (
    <div className="dashboard-page">
      {/* Artemis Exploration Hero Deck */}
      <div className="card hero-deck" style={{ marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img 
              src="/assets/images/nasa-logo.svg" 
              alt="NASA" 
              style={{ height: '48px', width: 'auto', filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.4))' }} 
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '1px', color: 'var(--text-highlight)' }}>
                  AstroHealth Autonomous Telemetry Deck
                </h1>
                <span className="mono" id="mission-day-badge" style={{ fontSize: '11px', background: 'rgba(0, 240, 255, 0.12)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px' }}>
                  {missionDayText}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Artemis Deep-Space Long-Duration Crew Telemetry &middot; Onboard Autonomous Bio-Engine Active
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/health-check" className="btn btn-primary" style={{ fontSize: '11.5px', padding: '8px 16px', textDecoration: 'none' }}>
              <svg className="hud-icon" style={{ marginRight: '6px' }} viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M7 14h2.5l1.5-3 2 6 1.5-3H17"/></svg>
              Daily Check-in
            </Link>
            <Link to="/dossier" className="btn btn-secondary" style={{ fontSize: '11.5px', padding: '8px 16px', textDecoration: 'none' }}>
              <svg className="hud-icon" style={{ marginRight: '6px' }} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              Clinical Dossier
            </Link>
          </div>
        </div>
      </div>

      {/* Annunciator HUD Status Banner */}
      <div className={`annunciator-panel ${overallStatus}`} id="annunciator-panel" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="status-icon-wrap" id="status-icon">
              {overallStatus === 'CRITICAL' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              ) : overallStatus === 'WARNING' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`status-badge ${overallStatus}`} id="overall-status-badge">
                  {overallStatus}
                </span>
                <strong style={{ fontSize: '15px', color: 'var(--text-highlight)' }} id="overall-status-title">
                  {overallStatus === 'CRITICAL' ? 'CRITICAL TELEMETRY ALERT — Immediate Onboard Action Required' : 
                   overallStatus === 'WARNING' ? 'TELEMETRY WARNING — Recheck Indicator & Follow Health Protocol' : 
                   'Telemetry Nominal — Continue Routine Monitoring'}
                </strong>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }} id="overall-status-summary">
                {record?.evaluation_summary || 'All vitals nominal within personal baseline limits.'}
              </p>
            </div>
          </div>

          <div className="action-directive-box">
            <span style={{ fontSize: '10.5px', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.5px' }}>
              DIRECTIVE / ACTION:
            </span>
            <div id="recommended-action-text" style={{ fontSize: '12px', marginTop: '2px', color: overallStatus === 'CRITICAL' ? '#ff8080' : overallStatus === 'WARNING' ? '#fde047' : '#e2e8f0' }}>
              {overallStatus === 'CRITICAL' ? 'Follow applicable emergency medical protocol. Contact Mission Control when comms available.' :
               overallStatus === 'WARNING' ? 'Recheck indicator and follow applicable mission health protocol.' :
               'Continue routine monitoring.'}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Physiological Telemetry Grid */}
      <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
        Current Physiological Telemetry (14-Day Baseline Comparison)
      </h2>
      
      <div className="metric-grid" id="telemetry-grid" style={{ marginBottom: '24px' }}>
        {indicators.length > 0 ? (
          indicators.map((ind, i) => {
            const devPct = ind.deviation_pct;
            let devText = 'Baseline: Nominal';
            let devClass = 'nominal';
            if (devPct !== null && devPct !== undefined) {
              const sign = devPct > 0 ? '+' : '';
              devText = `${sign}${devPct}% vs baseline`;
              if (Math.abs(devPct) >= 20) devClass = 'positive';
              else if (devPct < 0) devClass = 'negative';
            }

            return (
              <div key={i} className="metric-card">
                <div className="metric-header">
                  <span className="metric-name">{ind.name}</span>
                  <span className={`status-badge ${ind.status}`}>{ind.status}</span>
                </div>
                <div className="metric-value-row">
                  <span className="metric-value">{ind.value_numeric}</span>
                  <span className="metric-unit">{ind.unit}</span>
                </div>
                <div className="metric-baseline-row">
                  <span>14d Avg: {ind.baseline_value !== null ? `${ind.baseline_value} ${ind.unit}` : 'Ref'}</span>
                  <span className={`metric-deviation ${devClass}`}>{devText}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="metric-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px' }}>
            <span className="mono" style={{ color: 'var(--text-muted)' }}>
              No telemetry record found. Please complete your first daily check-in.
            </span>
          </div>
        )}
      </div>

      {/* 2-Column Decisions & Act Deck */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Interactive Countermeasure Engine — "ACT on Health" */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              NASA Countermeasure Engine — "ACT on Health"
            </div>
            {cmData && (
              <span className={`status-badge ${cmData.complianceScore >= 75 ? 'NORMAL' : (cmData.complianceScore >= 40 ? 'WARNING' : 'CRITICAL')}`} id="cm-compliance-badge">
                Adherence: {cmData.complianceScore}%
              </span>
            )}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
              <span id="cm-progress-text">
                {cmData ? `${cmData.completedProtocols} of ${cmData.totalProtocols} Protocols Verified (${cmData.complianceScore}%)` : 'Loading protocols...'}
              </span>
              <span>Daily Target: 100%</span>
            </div>
            <div className="progress-bar-bg" style={{ height: '6px' }}>
              <div 
                className="progress-bar-fill" 
                id="cm-progress-bar"
                style={{ width: `${cmData?.complianceScore || 0}%`, background: 'linear-gradient(90deg, var(--accent-cyan), #00e676)' }}
              ></div>
            </div>
          </div>

          <div id="countermeasures-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cmData?.protocols && cmData.protocols.length > 0 ? (
              cmData.protocols.map((p) => (
                <div 
                  key={p.id} 
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: `1px solid ${p.completed ? 'rgba(0, 230, 118, 0.35)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: '1 1 280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '13px', color: p.completed ? 'var(--status-normal-text)' : 'var(--text-highlight)' }}>
                        {p.title}
                      </strong>
                      <span className={`status-badge ${p.urgency === 'CRITICAL' ? 'CRITICAL' : (p.urgency === 'URGENT' ? 'WARNING' : 'NORMAL')}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {p.urgency}
                      </span>
                      <span className="mono" style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>
                        {p.durationMinutes} MIN
                      </span>
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                      {p.description}
                    </p>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      Target: <span style={{ color: 'var(--accent-cyan)' }}>{p.targetSystem}</span> &bull; {p.rationale}
                    </div>
                  </div>
                  <div>
                    {p.completed ? (
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--status-normal-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.3)', borderRadius: '4px' }}>
                        ✓ VERIFIED ONBOARD
                      </span>
                    ) : (
                      <button 
                        type="button" 
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '11px' }}
                        disabled={loggingCmId === p.id}
                        onClick={() => handleLogCountermeasure(p)}
                      >
                        {loggingCmId === p.id ? 'Verifying...' : 'LOG COMPLETED'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Loading countermeasures...</div>
            )}
          </div>
        </div>

        {/* Active Medical Alerts & Symptoms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <svg className="hud-icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Active Medical Alerts
              </div>
            </div>

            <div id="alerts-container">
              {activeAlerts.length === 0 ? (
                <div style={{ background: 'rgba(0, 230, 118, 0.06)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--status-normal-text)', fontFamily: 'var(--font-mono)', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✓</span> Zero active alerts. All evaluated telemetry nominal.
                </div>
              ) : (
                activeAlerts.map(alt => (
                  <div 
                    key={alt.alert_id} 
                    style={{
                      background: alt.severity === 'CRITICAL' ? 'var(--status-critical-bg)' : 'var(--status-warning-bg)',
                      border: `1px solid ${alt.severity === 'CRITICAL' ? 'var(--status-critical-border)' : 'var(--status-warning-border)'}`,
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span className={`status-badge ${alt.severity}`}>{alt.severity}</span>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--text-highlight)' }}>{alt.current_value}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-highlight)', fontWeight: 600 }}>{alt.reason}</p>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <strong>Protocol Directive:</strong> {alt.recommended_action}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleAcknowledgeAlert(alt.alert_id)} 
                      className="btn-primary" 
                      style={{ padding: '5px 12px', fontSize: '10.5px', whiteSpace: 'nowrap' }}
                    >
                      Acknowledge
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Behavioral & Radiation Dosimeter Snapshot */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <svg className="hud-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Radiation & Behavioral State
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Reported Mood</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                  {record?.mood ? record.mood.replace(/_/g, ' ') : 'NOMINAL'}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Stress Index</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-highlight)', marginTop: '2px' }}>
                  {record?.stress_level || 'LOW'}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Cumulative Radiation</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--status-normal-text)', marginTop: '2px' }}>
                  {cumDose} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>mSv</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                <span>Radiation Limit: {radPct}% of 50 mSv limit</span>
                <span>NASA Career Threshold</span>
              </div>
              <div className="progress-bar-bg" style={{ height: '6px' }}>
                <div className="progress-bar-fill" style={{ width: `${radPct}%`, background: 'var(--accent-cyan)' }}></div>
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px' }}>Reported Symptoms:</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {symptoms.length > 0 ? (
                  symptoms.map((s, i) => (
                    <span key={i} className="status-badge WARNING">
                      {s.name} ({s.severity_level}){s.notes ? ` — ${s.notes}` : ''}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    No symptoms reported for current check-in.
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
