import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [cmData, setCmData] = useState({
    protocols: [],
    complianceScore: 0,
    completedProtocols: 0,
    totalProtocols: 4
  });
  const [loading, setLoading] = useState(true);

  // Load health records & fresh countermeasures on mount / reload
  useEffect(() => {
    async function loadData() {
      if (!user?.astronautId) return;
      try {
        const hRes = await api.get(`/health/${user.astronautId}/latest`);
        if (hRes?.success && hRes.record) {
          setRecord(hRes.record);
        }
      } catch (err) {
        console.warn('Could not load latest health record:', err);
      }

      try {
        // fresh=true on reload guarantees buttons show "LOG COMPLETED"
        const cmRes = await api.get('/countermeasures/active?fresh=true');
        if (cmRes?.success && cmRes.protocols) {
          setCmData(cmRes);
        }
      } catch (err) {
        console.warn('Could not load countermeasures:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Handle logging a protocol as completed
  const handleLogProtocol = async (p) => {
    try {
      await api.post('/countermeasures/log', {
        protocol_id: p.id,
        protocol_title: p.title,
        category: p.category,
        duration_minutes: p.durationMinutes
      });
      // Fetch active session without fresh=true to reflect completed state
      const updated = await api.get('/countermeasures/active');
      if (updated?.success) setCmData(updated);
    } catch (err) {
      alert('Failed to log protocol completion: ' + err.message);
    }
  };

  // Handle un-logging / resetting countermeasure protocols
  const handleResetProtocols = async () => {
    try {
      await api.post('/countermeasures/reset', {});
      const fresh = await api.get('/countermeasures/active?fresh=true');
      if (fresh?.success) setCmData(fresh);
    } catch (err) {
      console.warn('Reset error:', err);
    }
  };

  // Acknowledge alert in-place
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await api.patch(`/alerts/${alertId}/read`);
      if (record) {
        const remaining = (record.activeAlerts || []).filter(a => a.alert_id !== alertId);
        setRecord({ ...record, activeAlerts: remaining });
      }
    } catch (err) {
      alert(`Failed to acknowledge alert: ${err.message}`);
    }
  };

  const overallStatus = record?.overall_status || 'NORMAL';
  const indicators = record?.indicators || [];
  const activeAlerts = record?.activeAlerts || [];
  const symptoms = record?.symptoms || [];

  return (
    <div className="page-content">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.01em' }}>ASTRONAUT TELEMETRY DASHBOARD</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '2px' }}>
            Autonomous onboard physiological, behavioral, and radiation surveillance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link to="/health-check" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>+</span> LOG DAILY CHECK-IN
          </Link>
        </div>
      </div>

      {/* NASA Mission & Exploration Hero Banner */}
      <div className="card" style={{
        margin: '16px 0 18px',
        padding: '18px 22px',
        background: 'linear-gradient(135deg, rgba(11, 35, 75, 0.85) 0%, rgba(8, 20, 46, 0.9) 60%, rgba(5, 12, 28, 0.95) 100%)',
        borderColor: 'rgba(0, 240, 255, 0.35)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(11, 61, 145, 0.35)'
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <img src="/assets/images/nasa-logo.svg" alt="NASA Meatball Insignia" style={{ height: '52px', width: 'auto', filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.4))' }} />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 800, letterSpacing: '0.14em', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                NASA DEEP SPACE EXPLORATION &bull; ARTEMIS MISSION
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', marginTop: '2px' }}>
                ASTROHEALTH AUTONOMOUS ONBOARD BIO-HUD
              </h2>
              <p style={{ fontSize: '11.5px', color: '#93c5fd', fontStyle: 'italic', marginTop: '3px' }}>
                &ldquo;Science is a beautiful gift to humanity.&rdquo;
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/emergency" className="btn-secondary" style={{ fontSize: '11px', padding: '7px 14px', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444', textDecoration: 'none' }}>
              <svg className="hud-icon" style={{ color: '#ef4444', marginRight: '4px' }} viewBox="0 0 24 24"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              EMERGENCY QRH
            </Link>
          </div>
        </div>
      </div>

      {/* Flight Status Annunciator Panel */}
      <div id="annunciator-panel" className={`annunciator-panel ${overallStatus}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="status-icon-wrap">
            {overallStatus === 'CRITICAL' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            ) : overallStatus === 'WARNING' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                EVALUATED STATE:
              </span>
              <span className={`status-badge ${overallStatus}`}>{overallStatus}</span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
                Mission Day {record?.mission_day || '--'} ({record?.record_date || '--'})
              </span>
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '4px 0 2px' }}>
              {overallStatus === 'CRITICAL' 
                ? 'CRITICAL TELEMETRY ALERT — Immediate Onboard Action Required'
                : overallStatus === 'WARNING' 
                ? 'TELEMETRY WARNING — Recheck Indicator & Follow Health Protocol'
                : 'Telemetry Nominal — Continue Routine Monitoring'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {record?.evaluation_summary || 'Autonomous decision-support engine initialized. All vitals nominal within personal baseline limits.'}
            </p>
          </div>
        </div>
        <div className="annunciator-action-box action-directive-box">
          <span style={{ fontSize: '9.5px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            DIRECTIVE / ACTION:
          </span>
          <span className="mono" style={{
            fontSize: '12px',
            fontWeight: 600,
            color: overallStatus === 'CRITICAL' ? '#ff8080' : (overallStatus === 'WARNING' ? '#fde047' : '#e2e8f0')
          }}>
            {overallStatus === 'CRITICAL' 
              ? 'Follow applicable emergency medical protocol. Contact Mission Control when comms available.'
              : overallStatus === 'WARNING'
              ? 'Recheck indicator and follow applicable mission health protocol.'
              : 'Continue routine monitoring baseline nominal.'}
          </span>
        </div>
      </div>

      {/* Active Alerts Panel */}
      <div className="card" id="alerts-card">
        <div className="card-header">
          <div className="card-title">
            <svg className="hud-icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Active Telemetry Alerts &amp; Protocol Directives
          </div>
          <Link to="/alerts" style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>View All Alerts →</Link>
        </div>
        <div id="alerts-container">
          {activeAlerts.length === 0 ? (
            <div style={{ background: 'rgba(0, 230, 118, 0.06)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--status-normal-text)', fontFamily: 'var(--font-mono)', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✓</span> Zero active alerts. All evaluated telemetry nominal.
            </div>
          ) : (
            activeAlerts.map(alt => (
              <div key={alt.alert_id} className={`alert-card-item ${alt.severity}`} style={{ padding: '13px 18px', marginBottom: '10px' }}>
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
                  <h4 className="alert-card-title" style={{ fontSize: '13.5px', marginBottom: '6px' }}>{alt.reason}</h4>
                  <div className="alert-protocol-box" style={{ marginTop: '6px', padding: '8px 12px' }}>
                    <div className="alert-protocol-label">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      Protocol Directive:
                    </div>
                    <p className="alert-protocol-text" style={{ fontSize: '11.5px' }}>{alt.recommended_action}</p>
                  </div>
                </div>
                <div className="alert-card-actions">
                  <button onClick={() => handleAcknowledgeAlert(alt.alert_id)} className="btn-ack-alert" style={{ padding: '6px 12px', fontSize: '10.5px' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Acknowledge
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Interactive Countermeasure Engine */}
      <div className="card" id="countermeasure-card" style={{
        borderColor: 'rgba(0, 240, 255, 0.35)',
        background: 'linear-gradient(135deg, rgba(11, 20, 38, 0.95) 0%, rgba(9, 14, 28, 0.9) 100%)',
        marginBottom: '16px'
      }}>
        <div className="card-header">
          <div className="card-title">
            <svg className="hud-icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Interactive Countermeasure Prescriptions &amp; Protocol Compliance
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span id="cm-compliance-badge" className={`status-badge ${cmData.complianceScore >= 75 ? 'NORMAL' : (cmData.complianceScore >= 40 ? 'WARNING' : 'CRITICAL')}`} style={{ fontSize: '10px' }}>
              Adherence: {cmData.complianceScore}%
            </span>
            <button 
              id="btn-reset-cm" 
              type="button" 
              className="btn-filter" 
              style={{ padding: '3px 8px', fontSize: '10px', cursor: 'pointer', textTransform: 'uppercase' }} 
              title="Reset countermeasure checklist to LOG COMPLETED"
              onClick={handleResetProtocols}
            >
              ↻ Reset
            </button>
          </div>
        </div>

        {/* Countermeasure Compliance Progress Bar */}
        <div style={{ marginBottom: '14px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '6px' }}>
            <span>Daily Spaceflight Countermeasure Compliance</span>
            <strong id="cm-progress-text" style={{ color: 'var(--accent-cyan)' }}>
              {cmData.completedProtocols} of {cmData.totalProtocols || 4} Protocols Verified ({cmData.complianceScore}%)
            </strong>
          </div>
          <div className="progress-bar-container" style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)' }}>
            <div id="cm-progress-bar" className="progress-bar-fill" style={{ width: `${cmData.complianceScore}%`, background: 'linear-gradient(90deg, #00f0ff, #00e676)' }}></div>
          </div>
        </div>

        {/* Prescribed Protocols Checklist */}
        <div id="countermeasures-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cmData.protocols.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              Generating tailored HRP countermeasures...
            </div>
          ) : (
            cmData.protocols.map(p => (
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
                  gap: '12px',
                  transition: 'all 0.2s ease'
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
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    {p.description}
                  </p>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    Target: <span style={{ color: 'var(--accent-cyan)' }}>{p.targetSystem}</span> &bull; {p.rationale}
                  </div>
                </div>
                <div>
                  {p.completed ? (
                    <button 
                      type="button" 
                      className="btn-verified-cm" 
                      onClick={handleResetProtocols}
                      style={{
                        fontSize: '11px',
                        color: 'var(--status-normal-text)',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        background: 'rgba(0, 230, 118, 0.1)',
                        border: '1px solid rgba(0, 230, 118, 0.3)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Click to reset and log again"
                    >
                      ✓ VERIFIED ONBOARD
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="btn-primary btn-log-cm" 
                      onClick={() => handleLogProtocol(p)}
                      style={{ padding: '6px 14px', fontSize: '11px' }}
                    >
                      LOG COMPLETED
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Paired Biosensor Status Strip */}
      <div className="card" style={{
        padding: '10px 16px',
        marginBottom: '16px',
        background: 'linear-gradient(90deg, rgba(13, 22, 41, 0.9) 0%, rgba(9, 14, 28, 0.95) 100%)',
        borderColor: 'rgba(0, 240, 255, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="pulse-beacon-icon" style={{ width: '22px', height: '22px' }}>
              <span className="pulse-beacon-dot" style={{ width: '6px', height: '6px' }}></span>
            </div>
            <div style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase' }}>Active Sensor Mesh:</span>
              <strong style={{ color: 'var(--accent-cyan)', marginLeft: '6px' }}>WHOOP 4.0 &amp; Fitbit Sense</strong>
              <span style={{ color: 'var(--text-dim)', margin: '0 8px' }}>|</span>
              <span style={{ color: 'var(--status-normal-text)', fontWeight: 600 }}>Continuous BLE Mesh Connected</span>
            </div>
          </div>
          <Link to="/health-check" className="mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
            <span>Auto-Sync Ingestion Deck &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Core Physiological Telemetry Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
            Physiological Telemetry vs 14-Day Personal Baseline
          </div>
          <span style={{ fontSize: '10.5px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            14-Day Rolling Mathematical Average
          </span>
        </div>

        <div className="telemetry-grid">
          {indicators.length === 0 ? (
            <div className="metric-card"><div className="metric-name">Loading vitals...</div></div>
          ) : (
            indicators.map((ind, idx) => {
              let devText = 'Baseline: Nominal';
              let devClass = 'nominal';
              if (ind.deviation_pct !== null && ind.deviation_pct !== undefined) {
                const sign = ind.deviation_pct > 0 ? '+' : '';
                devText = `${sign}${ind.deviation_pct}% vs baseline`;
                if (Math.abs(ind.deviation_pct) >= 20) devClass = 'positive';
                else if (ind.deviation_pct < 0) devClass = 'negative';
              }

              return (
                <div key={idx} className="metric-card">
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
          )}
        </div>
      </div>

      {/* Behavioral & Environmental Surveillance Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px', marginTop: '16px' }}>
        
        {/* Behavioral Matrix */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><line x1="12" y1="9" x2="12" y2="5"/><line x1="10" y1="10.5" x2="6.5" y2="7.5"/><line x1="14" y1="10.5" x2="17.5" y2="7.5"/><line x1="10" y1="13.5" x2="6.5" y2="16.5"/><line x1="14" y1="13.5" x2="17.5" y2="16.5"/></svg> Behavioral &amp; Cognitive Surveillance
            </div>
            <span className="mono" style={{ fontSize: '10.5px', color: 'var(--accent-cyan)' }}>24h Check-in</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Mood State</div>
              <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-highlight)', marginTop: '2px' }}>
                {record?.mood ? record.mood.replace(/_/g, ' ') : 'NOMINAL'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Stress Level</div>
              <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-highlight)', marginTop: '2px' }}>
                {record?.stress_level || 'LOW'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Isolation Level</div>
              <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-highlight)', marginTop: '2px' }}>
                {record?.loneliness_level ? record.loneliness_level.replace(/_/g, ' ') : 'NONE'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Crew Connection</div>
              <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-highlight)', marginTop: '2px' }}>
                {record?.crew_connection || 'STRONG'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Cognitive Concentration:</span>
            <span className="mono" style={{
              fontSize: '11px',
              fontWeight: 700,
              color: record?.concentration_difficulty ? 'var(--status-warning-text)' : 'var(--status-normal-text)'
            }}>
              {record?.concentration_difficulty ? 'Difficulty Reported' : 'Nominal / Focused'}
            </span>
          </div>
        </div>

        {/* Radiation Dosimeter */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.5"/><path d="M12 9.5V2m-2.16 14.5l-6.5 3.75m10.82-3.75l6.5 3.75"/><circle cx="12" cy="12" r="9" strokeDasharray="1 3"/></svg> Simulated Radiation Dosimetry
            </div>
            <span className="status-badge" style={{ background: 'rgba(255, 171, 0, 0.12)', color: '#ffab00', borderColor: '#ffab00', fontSize: '9.5px' }}>
              SIMULATED DATA
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>24h Dose Reading</div>
              <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                {record?.simulated_daily_dose_msv || 0.42} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>mSv</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Cumulative Exposure</div>
              <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: '#ffab00', marginTop: '2px' }}>
                {record?.simulated_cumulative_dose_msv || 5.62} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>mSv</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              <span>Mission Exposure Limit Progress</span>
              <span>{Math.min(100, Math.round(((record?.simulated_cumulative_dose_msv || 5.62) / 50.0) * 1000) / 10)}% of 50 mSv max</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${Math.min(100, Math.round(((record?.simulated_cumulative_dose_msv || 5.62) / 50.0) * 1000) / 10)}%` }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* Symptoms Checklist */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <div className="card-title">
            <svg className="hud-icon" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Today's Reported Crew Symptoms
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {symptoms.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No symptoms reported for current check-in.</span>
          ) : (
            symptoms.map((s, idx) => (
              <span key={idx} className="status-badge WARNING">
                <svg className="hud-icon" style={{ color: 'var(--status-warning-text)', marginRight: '4px' }} viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {s.name} ({s.severity_level}){s.notes ? ` — ${s.notes}` : ''}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
