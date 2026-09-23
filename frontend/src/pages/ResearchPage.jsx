/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * NASA 5 Hazards & Open Science Research: client/src/pages/ResearchPage.jsx
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function ResearchPage() {
  const [data, setData] = useState({ hazards: [], studies: [], sources: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResearch() {
      try {
        const res = await api.get('/research');
        if (res?.success) {
          setData(res);
        }
      } catch (err) {
        console.warn('Research error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResearch();
  }, []);

  return (
    <div className="research-page">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-highlight)' }}>
          NASA Human Research Program &bull; The 5 Hazards of Spaceflight
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Space Biology Foundations, Biological Baselines &amp; Open-Science Evidence Base
        </p>
      </div>

      {/* 5 Hazards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
        {data.hazards && data.hazards.length > 0 ? (
          data.hazards.map((h) => (
            <div 
              key={h.number} 
              className="card hazard-card"
              style={{
                borderLeft: '4px solid var(--accent-cyan)',
                background: 'rgba(13, 22, 41, 0.85)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-highlight)', margin: 0 }}>
                  0{h.number}. {h.title}
                </h2>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
                  HRP HAZARD #{h.number}
                </span>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '14px' }}>
                {h.description}
              </p>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 16px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '10.5px' }}>
                    MONITORING INDICATOR:
                  </span>
                  <span className="mono" style={{ color: 'var(--text-highlight)', fontWeight: 700 }}>
                    {h.systemMapping}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.45, margin: 0 }}>
                  {h.mappingDetail}
                </p>
                <div className="mono" style={{ color: 'var(--text-dim)', fontSize: '10.5px', marginTop: '6px' }}>
                  NASA REF: {h.researchContext}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
            Loading NASA hazards telemetry...
          </div>
        )}
      </div>

      {/* Open-Science Studies & Datasets */}
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
        Foundational Open-Science Studies (NASA OSDR / GeneLab / ALSDA)
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '16px', marginBottom: '24px' }}>
        {data.studies && data.studies.map((s, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>{s.id}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{s.source} ({s.year})</span>
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: '8px' }}>
                {s.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '10px' }}>
                {s.description}
              </p>
            </div>

            <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.25)', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
              <strong style={{ color: 'var(--text-highlight)' }}>Operational Relevance: </strong>
              <span style={{ color: 'var(--text-muted)' }}>{s.relevance}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
