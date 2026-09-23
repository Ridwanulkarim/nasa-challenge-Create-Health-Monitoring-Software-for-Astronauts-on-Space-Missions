/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Health History & Trends Page: client/src/pages/HistoryPage.jsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function HistoryPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('14d');
  const [historyRows, setHistoryRows] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.astronautId) return;
    setLoading(true);
    try {
      const [histRes, trendRes] = await Promise.all([
        api.get(`/health/${user.astronautId}/history?filter=${filter}`),
        api.get(`/health/${user.astronautId}/trends?days=14`)
      ]);

      if (histRes?.success && histRes.history) {
        setHistoryRows(histRes.history);
      }
      if (trendRes?.success && trendRes.trends) {
        setTrends(trendRes.trends);
      }
    } catch (err) {
      console.warn('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.astronautId, filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Chart Global Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    color: '#64748b',
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
          font: { family: '"Share Tech Mono", monospace', size: 11 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(13, 22, 41, 0.95)',
        borderColor: 'rgba(0, 240, 255, 0.3)',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#00f0ff',
        padding: 10,
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: '"Share Tech Mono", monospace', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: '"Share Tech Mono", monospace', size: 10 } }
      }
    }
  };

  const hrChartData = trends ? {
    labels: trends.labels,
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: trends.heartRate,
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0, 240, 255, 0.08)',
        fill: true,
        tension: 0.25,
        pointRadius: 4
      },
      {
        label: 'Personal Baseline',
        data: trends.heartRateBaseline,
        borderColor: '#ffab00',
        borderDash: [4, 4],
        fill: false,
        pointRadius: 0
      }
    ]
  } : null;

  const spo2ChartData = trends ? {
    labels: trends.labels,
    datasets: [
      {
        label: 'SpO₂ (%)',
        data: trends.spo2,
        borderColor: '#00e676',
        backgroundColor: 'rgba(0, 230, 118, 0.08)',
        fill: true,
        tension: 0.2,
        pointRadius: 4
      }
    ]
  } : null;

  const sleepChartData = trends ? {
    labels: trends.labels,
    datasets: [
      {
        label: 'Sleep Rest (Hours)',
        data: trends.sleep,
        backgroundColor: (trends.sleep || []).map(v => v < 6.0 ? '#ff5252' : '#818cf8'),
        borderRadius: 4
      }
    ]
  } : null;

  const radChartData = trends ? {
    labels: trends.labels,
    datasets: [
      {
        label: 'Cumulative Radiation (mSv)',
        data: trends.radiationCumulative,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.2,
        pointRadius: 4
      }
    ]
  } : null;

  return (
    <div className="history-page">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-highlight)' }}>
          14-Day Health History &amp; Trends
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Statistical Baseline Evolutions, Microgravity Adaptations &amp; Cumulative Radiation Exposure
        </p>
      </div>

      {/* 4 Multi-Trend Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Heart Rate */}
        <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Heart Rate vs. 14-Day Baseline
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            {hrChartData ? <Line data={hrChartData} options={chartOptions} /> : <div style={{ color: 'var(--text-dim)', textAlign: 'center', paddingTop: '60px' }}>Loading chart...</div>}
          </div>
        </div>

        {/* Blood Oxygen */}
        <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
              Blood Oxygen Saturation (SpO₂)
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            {spo2ChartData ? <Line data={spo2ChartData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { min: 85, max: 100 } } }} /> : <div style={{ color: 'var(--text-dim)', textAlign: 'center', paddingTop: '60px' }}>Loading chart...</div>}
          </div>
        </div>

        {/* Sleep Rest */}
        <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              Daily Sleep Rest Duration (Red = &lt;6h Deficit)
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            {sleepChartData ? <Bar data={sleepChartData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { min: 0, max: 10 } } }} /> : <div style={{ color: 'var(--text-dim)', textAlign: 'center', paddingTop: '60px' }}>Loading chart...</div>}
          </div>
        </div>

        {/* Cumulative Radiation */}
        <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Cumulative Deep-Space Radiation (mSv)
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            {radChartData ? <Line data={radChartData} options={chartOptions} /> : <div style={{ color: 'var(--text-dim)', textAlign: 'center', paddingTop: '60px' }}>Loading chart...</div>}
          </div>
        </div>

      </div>

      {/* Historical Telemetry Records Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div className="card-title">
            <svg className="hud-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            Historical Flight Telemetry Logs
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['7d', '14d', '30d'].map((f) => (
              <button
                key={f}
                type="button"
                className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '10.5px', padding: '4px 10px' }}
                onClick={() => setFilter(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                <th style={{ padding: '8px 10px' }}>DATE</th>
                <th style={{ padding: '8px 10px' }}>MISSION DAY</th>
                <th style={{ padding: '8px 10px' }}>HEART RATE</th>
                <th style={{ padding: '8px 10px' }}>SPO₂</th>
                <th style={{ padding: '8px 10px' }}>SLEEP</th>
                <th style={{ padding: '8px 10px' }}>EXERCISE</th>
                <th style={{ padding: '8px 10px' }}>STRESS</th>
                <th style={{ padding: '8px 10px' }}>MOOD</th>
                <th style={{ padding: '8px 10px' }}>DAILY RAD</th>
                <th style={{ padding: '8px 10px' }}>EVALUATION</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.length > 0 ? (
                historyRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-highlight)' }}>
                      {new Date(row.record_date).toISOString().slice(0, 10)}
                    </td>
                    <td style={{ padding: '8px 10px' }}>Day {row.mission_day}</td>
                    <td className="mono" style={{ padding: '8px 10px' }}>{row.heart_rate ? `${row.heart_rate} BPM` : '--'}</td>
                    <td className="mono" style={{ padding: '8px 10px', color: row.spo2 < 90 ? 'var(--status-critical-text)' : 'inherit' }}>
                      {row.spo2 ? `${row.spo2}%` : '--'}
                    </td>
                    <td className="mono" style={{ padding: '8px 10px', color: row.sleep_duration < 6 ? 'var(--status-warning-text)' : 'inherit' }}>
                      {row.sleep_duration ? `${row.sleep_duration}h` : '--'}
                    </td>
                    <td className="mono" style={{ padding: '8px 10px' }}>{row.exercise_duration ? `${row.exercise_duration}h` : '--'}</td>
                    <td className="mono" style={{ padding: '8px 10px' }}>{row.stress_level || '--'}</td>
                    <td style={{ padding: '8px 10px' }}>{row.mood ? row.mood.replace(/_/g, ' ') : '--'}</td>
                    <td className="mono" style={{ padding: '8px 10px' }}>{row.radiation_daily ? `${row.radiation_daily} mSv` : '--'}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className={`status-badge ${row.overall_status}`}>{row.overall_status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                    No telemetry records found for range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
