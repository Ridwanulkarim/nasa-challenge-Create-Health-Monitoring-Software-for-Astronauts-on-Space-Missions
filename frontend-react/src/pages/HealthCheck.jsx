import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function HealthCheck() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [device, setDevice] = useState('whoop');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  // Form states
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [missionDay, setMissionDay] = useState(21);
  const [heartRate, setHeartRate] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [bodyTemp, setBodyTemp] = useState(36.8);
  const [bpSys, setBpSys] = useState(118);
  const [bpDia, setBpDia] = useState(76);
  const [bodyWeight, setBodyWeight] = useState(75.0);
  const [sleepDuration, setSleepDuration] = useState(7.5);
  const [exerciseDuration, setExerciseDuration] = useState(2.0);
  const [hydration, setHydration] = useState(2.8);
  const [radiation, setRadiation] = useState(0.42);

  // Symptoms
  const [sms, setSms] = useState(false);
  const [sans, setSans] = useState(false);
  const [headache, setHeadache] = useState(false);
  const [backPain, setBackPain] = useState(false);

  // Behavioral
  const [mood, setMood] = useState('NOMINAL');
  const [stress, setStress] = useState('LOW');
  const [isolation, setIsolation] = useState('NONE');
  const [connection, setConnection] = useState('STRONG');
  const [notes, setNotes] = useState('');

  const triggerWearableSync = () => {
    setSyncing(true);
    setSyncMsg(`Syncing via ${device === 'whoop' ? 'WHOOP 4.0 Bio-Strap' : 'Fitbit Sense Bio-Tracker'}...`);

    setTimeout(() => {
      if (device === 'whoop') {
        setHeartRate(68);
        setSpo2(99);
        setBodyTemp(36.7);
        setSleepDuration(8.1);
      } else {
        setHeartRate(74);
        setSpo2(98);
        setBodyTemp(36.9);
        setSleepDuration(7.2);
      }
      setSyncing(false);
      setSyncMsg(`Telemetry successfully ingested from ${device.toUpperCase()}!`);
      setTimeout(() => setSyncMsg(''), 4000);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      astronaut_id: user?.astronautId || 'AST-001',
      record_date: date,
      mission_day: parseInt(missionDay, 10),
      heart_rate: parseFloat(heartRate),
      spo2: parseFloat(spo2),
      body_temp: parseFloat(bodyTemp),
      bp_systolic: parseFloat(bpSys),
      bp_diastolic: parseFloat(bpDia),
      body_weight: parseFloat(bodyWeight),
      sleep_duration: parseFloat(sleepDuration),
      exercise_duration: parseFloat(exerciseDuration),
      hydration: parseFloat(hydration),
      daily_radiation: parseFloat(radiation),
      mood,
      stress_level: stress,
      loneliness_level: isolation,
      crew_connection: connection,
      notes,
      symptoms: [
        sms ? { symptom_code: 'SMS', name: 'Space Motion Sickness', severity: 'MILD' } : null,
        sans ? { symptom_code: 'SANS', name: 'Neuro-Ocular Visual Changes', severity: 'MILD' } : null,
        headache ? { symptom_code: 'HEADACHE', name: 'Headache', severity: 'MILD' } : null,
        backPain ? { symptom_code: 'BACK_PAIN', name: 'Spinal Elongation Back Pain', severity: 'MILD' } : null,
      ].filter(Boolean)
    };

    try {
      const res = await api.post('/health/checkin', payload);
      setSubmittedResult(res);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1800);
    } catch (err) {
      alert('Check-in submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.01em' }}>DAILY HEALTH TELEMETRY CHECK-IN</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '2px' }}>
          Log daily physiological metrics, countermeasure exercise compliance, and behavioral surveillance.
        </p>
      </div>

      {submittedResult && (
        <div style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid rgba(0, 230, 118, 0.4)', color: 'var(--status-normal-text)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>
          ✓ Daily check-in logged successfully! Status: <strong>{submittedResult.overall_status || 'NORMAL'}</strong>. Redirecting to HUD...
        </div>
      )}

      {/* Wearable Sync Deck */}
      <div className="card" style={{ marginBottom: '16px', borderColor: 'rgba(0, 240, 255, 0.35)', background: 'linear-gradient(135deg, rgba(11, 25, 52, 0.8) 0%, rgba(8, 16, 36, 0.9) 100%)' }}>
        <div className="card-header">
          <div className="card-title">
            <svg className="hud-icon" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Automated Biosensor Mesh Ingestion Deck
          </div>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>Continuous BLE Stream</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              className={`btn-filter ${device === 'whoop' ? 'active' : ''}`}
              onClick={() => setDevice('whoop')}
            >
              WHOOP 4.0 Bio-Strap
            </button>
            <button 
              type="button" 
              className={`btn-filter ${device === 'fitbit' ? 'active' : ''}`}
              onClick={() => setDevice('fitbit')}
            >
              Fitbit Sense Bio-Tracker
            </button>
          </div>

          <button 
            type="button" 
            className="btn-primary" 
            onClick={triggerWearableSync}
            disabled={syncing}
            style={{ padding: '8px 16px', fontSize: '11px' }}
          >
            {syncing ? 'INGESTING TELEMETRY...' : '⚡ AUTO-FILL FROM WEARABLE'}
          </button>
        </div>

        {syncMsg && (
          <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            {syncMsg}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Physiological Metrics */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Physiological Biomarkers
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Heart Rate (BPM)</label>
              <input type="number" className="form-input" value={heartRate} onChange={e => setHeartRate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Oxygen SpO2 (%)</label>
              <input type="number" className="form-input" value={spo2} onChange={e => setSpo2(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Core Temp (°C)</label>
              <input type="number" step="0.1" className="form-input" value={bodyTemp} onChange={e => setBodyTemp(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Pressure Systolic (mmHg)</label>
              <input type="number" className="form-input" value={bpSys} onChange={e => setBpSys(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Pressure Diastolic (mmHg)</label>
              <input type="number" className="form-input" value={bpDia} onChange={e => setBpDia(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Body Mass (kg)</label>
              <input type="number" step="0.1" className="form-input" value={bodyWeight} onChange={e => setBodyWeight(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Sleep Duration (Hours)</label>
              <input type="number" step="0.1" className="form-input" value={sleepDuration} onChange={e => setSleepDuration(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Countermeasure Exercise (Hours)</label>
              <input type="number" step="0.1" className="form-input" value={exerciseDuration} onChange={e => setExerciseDuration(e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Symptoms Checklist */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Aerospace Clinical Symptoms Checklist
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <input type="checkbox" checked={sms} onChange={e => setSms(e.target.checked)} style={{ accentColor: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: '12px' }}>Space Motion Sickness (SMS)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <input type="checkbox" checked={sans} onChange={e => setSans(e.target.checked)} style={{ accentColor: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: '12px' }}>Visual Changes / SANS</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <input type="checkbox" checked={headache} onChange={e => setHeadache(e.target.checked)} style={{ accentColor: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: '12px' }}>Cephalic Fluid Shift Headache</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <input type="checkbox" checked={backPain} onChange={e => setBackPain(e.target.checked)} style={{ accentColor: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: '12px' }}>Spinal Elongation Back Pain</span>
            </label>
          </div>
        </div>

        {/* Behavioral & Mental Health */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="6" r="2"/><line x1="12" y1="9" x2="12" y2="5"/></svg> Behavioral &amp; Cognitive Self-Report
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Mood State</label>
              <select className="form-select" value={mood} onChange={e => setMood(e.target.value)}>
                <option value="NOMINAL">Nominal / Good</option>
                <option value="ELEVATED">Elevated / High Energy</option>
                <option value="FATIGUED">Fatigued</option>
                <option value="LOW">Low Mood</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Stress Level</label>
              <select className="form-select" value={stress} onChange={e => setStress(e.target.value)}>
                <option value="LOW">Low (Nominal)</option>
                <option value="MODERATE">Moderate</option>
                <option value="HIGH">High (Workload Surge)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Isolation Level</label>
              <select className="form-select" value={isolation} onChange={e => setIsolation(e.target.value)}>
                <option value="NONE">None</option>
                <option value="MILD">Mild</option>
                <option value="NOTICED">Noticed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Crew Connection</label>
              <select className="form-select" value={connection} onChange={e => setConnection(e.target.value)}>
                <option value="STRONG">Strong / Cohesive</option>
                <option value="ADEQUATE">Adequate</option>
                <option value="RESERVED">Reserved</option>
              </select>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={submitting}
          style={{ width: '100%', padding: '14px', fontSize: '13px', fontWeight: 800 }}
        >
          {submitting ? 'EVALUATING CLINICAL RULES...' : 'SUBMIT DAILY TELEMETRY CHECK-IN'}
        </button>
      </form>
    </div>
  );
}
