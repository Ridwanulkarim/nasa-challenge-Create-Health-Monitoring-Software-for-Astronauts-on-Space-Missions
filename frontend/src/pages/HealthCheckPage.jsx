/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Daily Health Check-In Page: client/src/pages/HealthCheckPage.jsx
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function HealthCheckPage() {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().slice(0, 10);

  // Form State
  const [recordDate, setRecordDate] = useState(todayStr);
  const [heartRate, setHeartRate] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [bodyTemp, setBodyTemp] = useState(36.8);
  const [bpSystolic, setBpSystolic] = useState(118);
  const [bpDiastolic, setBpDiastolic] = useState(76);
  const [bodyWeight, setBodyWeight] = useState(75.0);
  const [sleepDuration, setSleepDuration] = useState(7.5);
  const [exerciseDuration, setExerciseDuration] = useState(2.0);
  const [hydration, setHydration] = useState(2.8);
  const [dailyRadiation, setDailyRadiation] = useState(0.42);
  const [notes, setNotes] = useState('');

  // Behavioral State
  const [mood, setMood] = useState('GOOD');
  const [stress, setStress] = useState('LOW');
  const [loneliness, setLoneliness] = useState('NOT_AT_ALL');
  const [crewConnection, setCrewConnection] = useState('STRONG');
  const [concentrationDifficulty, setConcentrationDifficulty] = useState(false);

  // Symptoms State
  const [symptoms, setSymptoms] = useState({
    headache: { checked: false, severity: 'MILD' },
    fatigue: { checked: false, severity: 'MILD' },
    nausea: { checked: false, severity: 'MILD' },
    muscle_soreness: { checked: false, severity: 'MILD' },
    vision_changes: { checked: false, severity: 'MILD' },
    sleep_disturbance: { checked: false, severity: 'MILD' }
  });

  // Wearables & Sync State
  const [activeDevice, setActiveDevice] = useState('whoop');
  const [syncToast, setSyncToast] = useState(null);
  const [syncTags, setSyncTags] = useState({});
  const [syncing, setSyncing] = useState(false);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Click microphone to begin hands-free verbal dictation.');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setVoiceStatus('LISTENING... Speak clearly (e.g. "Heart rate 74, oxygen 98, mood good, slight headache")');
      };

      rec.onresult = (event) => {
        let finalTrans = '';
        let interimTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }
        const text = finalTrans || interimTrans;
        setTranscript(text);
        if (finalTrans) {
          parseVoiceTranscript(finalTrans);
        }
      };

      rec.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
        setVoiceStatus('Microphone blocked or interrupted. Click SIMULATE VOICE COMMAND to test.');
      };

      rec.onend = () => {
        setIsListening(false);
        setVoiceStatus('Voice dictation ended. Click microphone to listen again.');
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Web Speech API is not supported in this browser. Please use "SIMULATE VOICE COMMAND" below.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const simulateVoice = () => {
    const samples = [
      'Heart rate 74, blood oxygen 98.5, temperature 36.8, slept 7.5 hours, exercise 2 hours, hydration 2.8 liters, mood is good, stress is low, slight headache reported.',
      'Heart rate 88, oxygen 96, temperature 37.2, slept 5.5 hours, exercise 1.5 hours, mood neutral, stress medium, reporting fatigue and vision changes.',
      'Heart rate 68, oxygen 99, core temperature 36.6, slept 8 hours, exercise 2.2 hours, mood very good, stress low, zero symptoms nominal check.'
    ];
    const chosen = samples[Math.floor(Math.random() * samples.length)];
    setTranscript(`[SIMULATED AUDIO]: "${chosen}"`);
    parseVoiceTranscript(chosen);
  };

  const parseVoiceTranscript = (text) => {
    if (!text) return;
    const lower = text.toLowerCase();
    const newTags = { ...syncTags };

    // 1. Heart Rate
    const hrMatch = lower.match(/(?:heart\s*rate|pulse|hr|beats?)\s*(?:is|to|at|of)?\s*(\d{2,3})/i);
    if (hrMatch) {
      const val = parseInt(hrMatch[1], 10);
      if (val >= 30 && val <= 220) {
        setHeartRate(val);
        newTags.hr = `✓ VOICE: ${val} BPM`;
      }
    }

    // 2. Blood Oxygen
    const spo2Match = lower.match(/(?:oxygen|spo2|o2|sat(?:uration)?)\s*(?:is|to|at|of)?\s*(\d{2,3}(?:\.\d+)?)/i);
    if (spo2Match) {
      const val = parseFloat(spo2Match[1]);
      if (val >= 50 && val <= 100) {
        setSpo2(val);
        newTags.spo2 = `✓ VOICE: ${val}%`;
      }
    }

    // 3. Body Temperature
    const tempMatch = lower.match(/(?:temperature|body\s*temp|temp)\s*(?:is|to|at|of)?\s*(\d{2}(?:\.\d+)?)/i);
    if (tempMatch) {
      const val = parseFloat(tempMatch[1]);
      if (val >= 32.0 && val <= 43.0) {
        setBodyTemp(val);
        newTags.temp = `✓ VOICE: ${val}°C`;
      }
    }

    // 4. Sleep
    const sleepMatch = lower.match(/(?:sleep|slept)\s*(?:duration|for|was|is)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)?/i);
    if (sleepMatch) {
      const val = parseFloat(sleepMatch[1]);
      if (val >= 0 && val <= 24) {
        setSleepDuration(val);
        newTags.sleep = `✓ VOICE: ${val}h`;
      }
    }

    // 5. Exercise
    const exMatch = lower.match(/(?:exercise|workout|training)\s*(?:duration|for|was|is)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)?/i);
    if (exMatch) {
      const val = parseFloat(exMatch[1]);
      if (val >= 0 && val <= 12) {
        setExerciseDuration(val);
        newTags.exercise = `✓ VOICE: ${val}h`;
      }
    }

    // 6. Mood & Stress
    if (lower.includes('good') || lower.includes('great')) setMood('GOOD');
    else if (lower.includes('neutral') || lower.includes('nominal')) setMood('NOMINAL');
    else if (lower.includes('fatigued') || lower.includes('tired')) setMood('FATIGUED');
    else if (lower.includes('stressed') || lower.includes('anxious')) setMood('ANXIOUS');

    if (lower.includes('stress low') || lower.includes('low stress')) setStress('LOW');
    else if (lower.includes('stress medium') || lower.includes('moderate stress')) setStress('MODERATE');
    else if (lower.includes('high stress')) setStress('HIGH');

    // 7. Symptoms
    setSymptoms(prev => {
      const next = { ...prev };
      if (lower.includes('headache')) next.headache = { checked: true, severity: 'MILD' };
      if (lower.includes('fatigue')) next.fatigue = { checked: true, severity: 'MILD' };
      if (lower.includes('nausea')) next.nausea = { checked: true, severity: 'MILD' };
      if (lower.includes('vision')) next.vision_changes = { checked: true, severity: 'MILD' };
      return next;
    });

    setSyncTags(newTags);
  };

  const handleWearableSync = async () => {
    setSyncing(true);
    setSyncToast(null);

    try {
      const res = await api.get(`/wearables/sync/${activeDevice}`);
      if (res?.success && res.metrics) {
        const m = res.metrics;
        const newTags = { ...syncTags };
        const badge = activeDevice === 'whoop' ? '✓ WHOOP 4.0' : '✓ FITBIT SENSE';

        if (m.heart_rate !== undefined) {
          setHeartRate(m.heart_rate);
          newTags.hr = badge;
        }
        if (m.spo2 !== undefined) {
          setSpo2(m.spo2);
          newTags.spo2 = badge;
        }
        if (m.body_temp !== undefined) {
          setBodyTemp(m.body_temp);
          newTags.temp = badge;
        }
        if (m.sleep_duration !== undefined) {
          setSleepDuration(m.sleep_duration);
          newTags.sleep = badge;
        }
        if (m.exercise_duration !== undefined) {
          setExerciseDuration(m.exercise_duration);
          newTags.exercise = badge;
        }
        if (m.stress_level) {
          setStress(m.stress_level);
        }

        setSyncTags(newTags);
        setSyncToast({
          type: 'success',
          msg: `LIVE TELEMETRY INGESTED: 5 physiological metrics auto-populated from ${res.device.name} [Packet: ${res.packetId}]`
        });
      }
    } catch (err) {
      setSyncToast({
        type: 'error',
        msg: `Wearable sync error: ${err.message || 'Bluetooth mesh unavailable'}`
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSymptomToggle = (key) => {
    setSymptoms(prev => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked }
    }));
  };

  const handleSymptomSeverity = (key, val) => {
    setSymptoms(prev => ({
      ...prev,
      [key]: { ...prev[key], severity: val }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (heartRate < 30 || heartRate > 220) return setErrorMsg('Heart rate must be between 30 and 220 BPM.');
    if (spo2 < 50 || spo2 > 100) return setErrorMsg('Blood oxygen (SpO₂) must be between 50% and 100%.');
    if (bodyTemp < 32.0 || bodyTemp > 43.0) return setErrorMsg('Body temperature must be between 32.0°C and 43.0°C.');

    const activeSymptoms = Object.entries(symptoms)
      .filter(([_, item]) => item.checked)
      .map(([key, item]) => ({
        symptom_id: key,
        severity_level: item.severity,
        notes: null
      }));

    const payload = {
      record_date: recordDate,
      indicators: {
        HEART_RATE: heartRate,
        SPO2: spo2,
        BP_SYSTOLIC: bpSystolic,
        BP_DIASTOLIC: bpDiastolic,
        BODY_TEMP: bodyTemp,
        BODY_WEIGHT: bodyWeight,
        SLEEP_DURATION: sleepDuration,
        EXERCISE_DURATION: exerciseDuration,
        HYDRATION: hydration
      },
      behavioral: {
        mood,
        stress_level: stress,
        loneliness_level: loneliness,
        crew_connection: crewConnection,
        concentration_difficulty: concentrationDifficulty,
        notes: null
      },
      radiation: {
        simulated_daily_dose_msv: dailyRadiation,
        notes: 'SIMULATED RADIATION DATA'
      },
      symptoms: activeSymptoms,
      notes
    };

    setSubmitting(true);
    try {
      const res = await api.post('/health', payload);
      setSuccessMsg('Telemetry logged successfully! Decision support evaluated.');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit daily telemetry check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="health-check-page">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-highlight)' }}>
          Daily Telemetry Check-in
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Autonomous Astronaut Health Assessment & Bio-Sensor Data Ingestion
        </p>
      </div>

      {errorMsg && (
        <div className="alert-banner CRITICAL" style={{ marginBottom: '16px', display: 'block' }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(0, 230, 118, 0.12)', border: '1px solid var(--status-normal-border)', color: 'var(--status-normal-text)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Connected Biosensors & Wearable Ingestion Dock */}
      <div className="card" style={{ marginBottom: '20px', border: '1px solid rgba(0, 240, 255, 0.35)' }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div className="card-title">
            <span>📡</span> Paired Biosensors &amp; Wearable IoT Ingestion Dock
          </div>
          <div className="wearable-toggle-group">
            <button 
              type="button" 
              className={`wearable-tab-btn ${activeDevice === 'whoop' ? 'active' : ''}`}
              onClick={() => setActiveDevice('whoop')}
            >
              WHOOP 4.0 Bio-Strap
            </button>
            <button 
              type="button" 
              className={`wearable-tab-btn ${activeDevice === 'fitbit' ? 'active' : ''}`}
              onClick={() => setActiveDevice('fitbit')}
            >
              Fitbit Sense Bio-Tracker
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>ACTIVE SENSOR: </span>
              <strong style={{ color: activeDevice === 'whoop' ? 'var(--accent-cyan)' : '#00e676' }}>
                {activeDevice === 'whoop' ? 'WHOOP 4.0 Bio-Strap' : 'Fitbit Sense Bio-Tracker'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>BATTERY: </span>
              <strong style={{ color: 'var(--status-normal-text)' }}>
                {activeDevice === 'whoop' ? '93% [Nominal]' : '87% [Nominal]'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>LINK PROTOCOL: </span>
              <strong style={{ color: 'var(--text-highlight)' }}>
                {activeDevice === 'whoop' ? 'BLE 5.3 Spacecraft Mesh' : 'BLE 5.0 Local Sync'}
              </strong>
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-primary"
            style={{ fontSize: '12px', padding: '10px 18px', minWidth: '180px' }}
            disabled={syncing}
            onClick={handleWearableSync}
          >
            {syncing ? 'STREAMING PACKET...' : `AUTO-SYNC ${activeDevice.toUpperCase()}`}
          </button>
        </div>

        {syncToast && (
          <div style={{
            marginTop: '14px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
            border: `1px solid ${syncToast.type === 'success' ? 'var(--status-normal-border)' : 'var(--status-critical-border)'}`,
            background: syncToast.type === 'success' ? 'rgba(0, 230, 118, 0.12)' : 'var(--status-critical-bg)',
            color: syncToast.type === 'success' ? 'var(--status-normal-text)' : 'var(--status-critical-text)'
          }}>
            {syncToast.msg}
          </div>
        )}
      </div>

      {/* Hands-Free Voice Telemetry Input */}
      <div className="card" style={{ marginBottom: '20px', border: '1px solid rgba(0, 240, 255, 0.25)' }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div className="card-title">
            <svg className="hud-icon" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            Hands-Free Voice Telemetry Check-In (EVA / Zero-G Ready)
          </div>
          <button 
            type="button" 
            className="btn btn-secondary"
            style={{ fontSize: '11px', padding: '5px 12px' }}
            onClick={simulateVoice}
          >
            SIMULATE VOICE COMMAND
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className={`btn-voice-mic ${isListening ? 'listening' : ''}`}
            onClick={toggleVoice}
            title={isListening ? 'Stop Listening' : 'Start Voice Input'}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: isListening ? 'rgba(255, 68, 68, 0.2)' : 'rgba(0, 240, 255, 0.1)',
              border: `2px solid ${isListening ? '#ff4444' : 'var(--accent-cyan)'}`,
              color: isListening ? '#ff4444' : 'var(--accent-cyan)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontSize: '12px', color: isListening ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
              {voiceStatus}
            </div>
            {transcript && (
              <div style={{ marginTop: '6px', fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-highlight)', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '4px' }}>
                {transcript}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Check-In Form */}
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Physiological Telemetry Metrics
            </div>
            <div>
              <input 
                type="date" 
                className="form-input" 
                style={{ padding: '4px 10px', fontSize: '11px', width: 'auto' }}
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                max={todayStr}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
            
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Heart Rate (BPM)</label>
                {syncTags.hr && <span className="sync-badge">{syncTags.hr}</span>}
              </div>
              <input 
                type="number" 
                className="form-input" 
                required 
                value={heartRate} 
                onChange={(e) => setHeartRate(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Blood Oxygen (SpO₂ %)</label>
                {syncTags.spo2 && <span className="sync-badge">{syncTags.spo2}</span>}
              </div>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                required 
                value={spo2} 
                onChange={(e) => setSpo2(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Core Body Temp (°C)</label>
                {syncTags.temp && <span className="sync-badge">{syncTags.temp}</span>}
              </div>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                required 
                value={bodyTemp} 
                onChange={(e) => setBodyTemp(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Blood Pressure Systolic (mmHg)</label>
              <input 
                type="number" 
                className="form-input" 
                required 
                value={bpSystolic} 
                onChange={(e) => setBpSystolic(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Blood Pressure Diastolic (mmHg)</label>
              <input 
                type="number" 
                className="form-input" 
                required 
                value={bpDiastolic} 
                onChange={(e) => setBpDiastolic(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Body Mass (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                required 
                value={bodyWeight} 
                onChange={(e) => setBodyWeight(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Sleep Rest (Hours)</label>
                {syncTags.sleep && <span className="sync-badge">{syncTags.sleep}</span>}
              </div>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                required 
                value={sleepDuration} 
                onChange={(e) => setSleepDuration(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Exercise Protocol (Hours)</label>
                {syncTags.exercise && <span className="sync-badge">{syncTags.exercise}</span>}
              </div>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                required 
                value={exerciseDuration} 
                onChange={(e) => setExerciseDuration(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hydration Recovery (L)</label>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                required 
                value={hydration} 
                onChange={(e) => setHydration(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Daily Radiation Dosimeter (mSv)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-input" 
                required 
                value={dailyRadiation} 
                onChange={(e) => setDailyRadiation(parseFloat(e.target.value) || 0)}
              />
            </div>

          </div>
        </div>

        {/* Behavioral & Psychological Self-Assessment */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              Behavioral &amp; Psychological Telemetry
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '20px' }}>
            <div>
              <label className="form-label">Overall Mood State</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['GOOD', 'NOMINAL', 'FATIGUED', 'ANXIOUS'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`btn ${mood === m ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={() => setMood(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Perceived Stress Level</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['LOW', 'MODERATE', 'HIGH'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`btn ${stress === s ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={() => setStress(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Crew Connection / Social</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['STRONG', 'MODERATE', 'ISOLATED'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`btn ${crewConnection === c ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={() => setCrewConnection(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Cognitive &amp; Concentration</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '12px', color: 'var(--text-highlight)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={concentrationDifficulty} 
                  onChange={(e) => setConcentrationDifficulty(e.target.checked)}
                />
                Report difficulty concentrating or brain fog
              </label>
            </div>
          </div>
        </div>

        {/* Spaceflight Symptoms Checklist */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div className="card-title">
              <svg className="hud-icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Spaceflight Symptoms Checklist
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
            {Object.entries(symptoms).map(([key, item]) => {
              const labelName = key.replace(/_/g, ' ').toUpperCase();
              return (
                <div 
                  key={key} 
                  style={{
                    background: item.checked ? 'rgba(255, 179, 0, 0.1)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${item.checked ? 'var(--status-warning-border)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-highlight)' }}>
                    <input 
                      type="checkbox" 
                      checked={item.checked} 
                      onChange={() => handleSymptomToggle(key)} 
                    />
                    {labelName}
                  </label>

                  {item.checked && (
                    <select 
                      className="form-input" 
                      style={{ padding: '2px 8px', fontSize: '10.5px', width: 'auto' }}
                      value={item.severity}
                      onChange={(e) => handleSymptomSeverity(key, e.target.value)}
                    >
                      <option value="MILD">Mild</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="SEVERE">Severe</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Subjective Notes & Submit */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Subjective Observations / EVA Mission Notes</label>
            <textarea 
              className="form-input" 
              rows={3} 
              placeholder="e.g. Post-EVA airlock repressurization completed nominally. Slight vestibular disorientation during roll maneuver."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '13px' }}
            disabled={submitting}
          >
            {submitting ? 'EVALUATING ONBOARD DECISION SUPPORT...' : 'SUBMIT DAILY TELEMETRY CHECK-IN'}
          </button>
        </div>
      </form>
    </div>
  );
}
