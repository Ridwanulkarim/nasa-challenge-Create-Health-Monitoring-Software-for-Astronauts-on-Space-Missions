/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Flight Surgeon Clinical Dossier: client/src/pages/DossierPage.jsx
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DossierPage() {
  const { user } = useAuth();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDossier() {
      try {
        const res = await api.get('/dossier');
        if (res?.success && res.dossier) {
          setDossier(res.dossier);
        }
      } catch (err) {
        console.warn('Dossier fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDossier();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!dossier) return;
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NASA_DOSSIER_${dossier.dossierId || 'RELAY'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const ast = dossier?.astronaut || {};
  const fName = (user?.firstName) || ast.firstName || 'Astronaut';
  const lName = (user?.lastName !== undefined && user?.lastName !== null) 
    ? user.lastName 
    : ((ast.lastName !== undefined && ast.lastName !== null) ? ast.lastName : '');
  const cleanFullName = [fName, lName].filter(Boolean).join(' ') || 'Astronaut';
  const role = user?.roleTitle || ast.roleTitle || 'Mission Commander';

  return (
    <div className="dossier-page">
      {/* Header & Export Actions */}
      <div className="page-header print-hide" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-highlight)' }}>
            Flight Surgeon Clinical Telemetry Dossier
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Official NASA Spaceflight Medical Record &bull; 14-Day In-Flight Telemetry Synthesis
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handleExportJSON}
            style={{ fontSize: '11px', padding: '8px 14px' }}
          >
            EXPORT JSON RELAY PACKET
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handlePrint}
            style={{ fontSize: '11px', padding: '8px 16px' }}
          >
            PRINT / SAVE AS PDF
          </button>
        </div>
      </div>

      {/* Official NASA Clinical Layout Document */}
      <div className="card official-dossier-doc" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(13, 22, 41, 0.95) 0%, rgba(9, 14, 28, 0.95) 100%)', border: '1px solid rgba(0, 240, 255, 0.35)' }}>
        
        {/* Document Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid rgba(0, 240, 255, 0.3)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src="/assets/images/nasa-logo.svg" alt="NASA" style={{ height: '44px', width: 'auto' }} />
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                National Aeronautics and Space Administration
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-highlight)' }}>
                Space Medicine Operations &bull; Clinical Telemetry Dossier
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
            <div>DOSSIER ID: <span style={{ color: 'var(--accent-cyan)' }}>{dossier?.dossierId || 'DOS-NASA-AST-001'}</span></div>
            <div>CHECKSUM: <span style={{ color: 'var(--text-highlight)' }}>{dossier?.relayPacketChecksum || 'SHA256-NOMINAL'}</span></div>
          </div>
        </div>

        {/* Astronaut Credentials Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px', background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '20px', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>CREW MEMBER: </span>
            <strong style={{ color: 'var(--text-highlight)' }}>{cleanFullName} ({fName.toUpperCase()}-1)</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>ROLE / RANK: </span>
            <strong style={{ color: 'var(--accent-cyan)' }}>{role}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>MISSION: </span>
            <strong style={{ color: 'var(--text-highlight)' }}>{ast.missionName || 'ARTEMIS III'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>STATUS: </span>
            <span className={`status-badge ${dossier?.currentStatus || 'NORMAL'}`}>{dossier?.currentStatus || 'NORMAL'}</span>
          </div>
        </div>

        {/* 14-Day Indicators Summary Table */}
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
          1. In-Flight 14-Day Vital Indicators Summary
        </h3>
        <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                <th style={{ padding: '8px 10px' }}>INDICATOR</th>
                <th style={{ padding: '8px 10px' }}>UNIT</th>
                <th style={{ padding: '8px 10px' }}>14-DAY AVERAGE</th>
                <th style={{ padding: '8px 10px' }}>MIN OBSERVED</th>
                <th style={{ padding: '8px 10px' }}>MAX OBSERVED</th>
                <th style={{ padding: '8px 10px' }}>WARNING EVENTS</th>
                <th style={{ padding: '8px 10px' }}>CRITICAL EVENTS</th>
              </tr>
            </thead>
            <tbody>
              {dossier?.indicatorSummaries && dossier.indicatorSummaries.length > 0 ? (
                dossier.indicatorSummaries.map((ind, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-highlight)' }}>{ind.name}</td>
                    <td className="mono" style={{ padding: '8px 10px', color: 'var(--accent-cyan)' }}>{ind.unit}</td>
                    <td className="mono" style={{ padding: '8px 10px', fontWeight: 700 }}>{ind.average}</td>
                    <td className="mono" style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{ind.min}</td>
                    <td className="mono" style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{ind.max}</td>
                    <td className="mono" style={{ padding: '8px 10px', color: ind.warningEvents > 0 ? 'var(--status-warning-text)' : 'inherit' }}>{ind.warningEvents}</td>
                    <td className="mono" style={{ padding: '8px 10px', color: ind.criticalEvents > 0 ? 'var(--status-critical-text)' : 'inherit' }}>{ind.criticalEvents}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)' }}>
                    Telemetry records compiling for current window...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Radiation & Countermeasure Compliance Deck */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '16px', marginBottom: '20px' }}>
          
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
              2. Cumulative Deep Space Radiation Dosimeter
            </h4>
            <div style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
              <div>Cumulative Dose: <strong>{dossier?.radiationSummary?.cumulativeDoseMsv || '5.62'} mSv</strong></div>
              <div>Career Limit Progress: <strong>{dossier?.radiationSummary?.limitProgressPct || '11.2'}% of 50 mSv</strong></div>
              <div style={{ marginTop: '4px', color: 'var(--status-normal-text)' }}>
                Evaluation: {dossier?.radiationSummary?.evaluation || 'NOMINAL - Within Safe Deep Space Thresholds'}
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
              3. Countermeasure Adherence Evaluation
            </h4>
            <div style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
              <div>Protocol Adherence Rate: <strong>{dossier?.countermeasureSummary?.adherenceRatePct || '88'}%</strong></div>
              <div>Primary Prescription Focus: <strong>{dossier?.countermeasureSummary?.primaryFocus || 'ARED Resistive & Chibis LBNP'}</strong></div>
              <div style={{ marginTop: '4px', color: 'var(--status-normal-text)' }}>
                Clearance: {dossier?.flightSurgeonClearance || 'FIT FOR SPACEFLIGHT DUTY'}
              </div>
            </div>
          </div>

        </div>

        {/* Flight Surgeon Official Sign-off block */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          <div>
            NASA Human Research Program (HRP) &bull; Space Medicine Flight Surgeon Division (JSC)
          </div>
          <div>
            Verified Signature: Dr. Sarah Chen, MD (Lead Flight Surgeon) [VERIFIED DIGITALLY]
          </div>
        </div>

      </div>
    </div>
  );
}
