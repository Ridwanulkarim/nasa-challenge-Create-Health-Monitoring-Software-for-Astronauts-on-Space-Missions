/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Hands-Free Voice Telemetry Input: frontend/js/voice-input.js
 * 
 * Enables astronauts wearing EVA gloves or working in zero-G to verbally
 * log vitals, psychological states, and symptoms via the native Web Speech API.
 * Includes natural language regex parsing and demo simulation fallback.
 */

(function initVoiceCheckin() {
  document.addEventListener('DOMContentLoaded', () => {
    const btnVoiceToggle = document.getElementById('btn-voice-toggle');
    const btnVoiceSimulate = document.getElementById('btn-voice-simulate');
    const voiceStatusText = document.getElementById('voice-status-text');
    const voiceTranscriptBox = document.getElementById('voice-transcript-box');
    const voiceTranscriptText = document.getElementById('voice-transcript-text');

    if (!btnVoiceToggle) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isListening = false;

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isListening = true;
        btnVoiceToggle.classList.add('listening');
        if (voiceStatusText) {
          voiceStatusText.innerHTML = '<span class="voice-pulse-ring"></span> <strong>LISTENING...</strong> Speak clearly (e.g. "Heart rate 74, oxygen 98, mood good, slight headache")';
          voiceStatusText.style.color = 'var(--accent-cyan)';
        }
        if (voiceTranscriptBox) voiceTranscriptBox.style.display = 'block';
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (voiceTranscriptText && currentText) {
          voiceTranscriptText.textContent = `"${currentText}"`;
        }

        if (finalTranscript) {
          processVoiceTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Voice Recognition Event:', event.error);
        if (event.error === 'not-allowed') {
          if (voiceStatusText) {
            voiceStatusText.innerHTML = '<span style="color: var(--status-warning-text);"><svg class="hud-icon" style="color: var(--status-warning-text);" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Microphone access blocked. You can still click "SIMULATE VOICE COMMAND" below.</span>';
          }
          stopListening();
        }
      };

      recognition.onend = () => {
        stopListening();
      };
    } else {
      if (voiceStatusText) {
        voiceStatusText.innerHTML = 'Web Speech API not available in this browser. Use <strong>SIMULATE VOICE COMMAND</strong> to test.';
      }
    }

    btnVoiceToggle.addEventListener('click', () => {
      if (!SpeechRecognition) {
        alert('Web Speech API is not supported in this browser. Please use the "SIMULATE VOICE COMMAND" button below to test voice parsing.');
        return;
      }

      if (isListening) {
        recognition.stop();
        stopListening();
      } else {
        try {
          recognition.start();
        } catch (err) {
          console.warn('Speech recognition start error:', err);
          recognition.stop();
          setTimeout(() => recognition.start(), 200);
        }
      }
    });

    function stopListening() {
      isListening = false;
      btnVoiceToggle.classList.remove('listening');
      if (voiceStatusText) {
        voiceStatusText.innerHTML = 'Click microphone to begin hands-free verbal dictation.';
        voiceStatusText.style.color = 'var(--text-muted)';
      }
    }

    // Demo Simulation Button for testing and live judge demonstrations
    if (btnVoiceSimulate) {
      btnVoiceSimulate.addEventListener('click', () => {
        const samplePhrases = [
          'Heart rate 74, blood oxygen 98.5, temperature 36.8, slept 7.5 hours, exercise 2 hours, hydration 2.8 liters, mood is good, stress is low, slight headache reported.',
          'Heart rate 88, oxygen 96, temperature 37.2, slept 5.5 hours, exercise 1.5 hours, mood neutral, stress medium, reporting fatigue and dizziness.',
          'Heart rate 68, oxygen 99, core temperature 36.6, slept 8 hours, exercise 2.2 hours, mood very good, stress low, zero symptoms nominal check.'
        ];
        const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];

        if (voiceTranscriptBox) voiceTranscriptBox.style.display = 'block';
        if (voiceTranscriptText) voiceTranscriptText.textContent = `[SIMULATED AUDIO]: "${randomPhrase}"`;

        processVoiceTranscript(randomPhrase);
      });
    }
  });

  /**
   * Natural Language Biometric Parser
   * Extracts numerical vitals, behavioral indicators, and spaceflight symptoms.
   */
  function processVoiceTranscript(text) {
    if (!text) return;
    const lower = text.toLowerCase();
    const parsedFields = [];

    // 1. Heart Rate
    const hrMatch = lower.match(/(?:heart\s*rate|pulse|hr|beats?)\s*(?:is|to|at|of)?\s*(\d{2,3})/i);
    if (hrMatch) {
      const val = parseInt(hrMatch[1], 10);
      if (val >= 30 && val <= 220) {
        updateField('heart_rate', val, 'sync-tag-hr', `✓ VOICE: ${val} BPM`);
        parsedFields.push(`Heart Rate: ${val} BPM`);
      }
    }

    // 2. Blood Oxygen (SpO2)
    const spo2Match = lower.match(/(?:oxygen|spo2|o2|sat(?:uration)?)\s*(?:is|to|at|of)?\s*(\d{2,3}(?:\.\d+)?)/i);
    if (spo2Match) {
      const val = parseFloat(spo2Match[1]);
      if (val >= 50 && val <= 100) {
        updateField('spo2', val, 'sync-tag-spo2', `✓ VOICE: ${val}%`);
        parsedFields.push(`SpO₂: ${val}%`);
      }
    }

    // 3. Core Body Temperature
    const tempMatch = lower.match(/(?:temperature|body\s*temp|temp)\s*(?:is|to|at|of)?\s*(\d{2}(?:\.\d+)?)/i);
    if (tempMatch) {
      const val = parseFloat(tempMatch[1]);
      if (val >= 32.0 && val <= 43.0) {
        updateField('body_temp', val, 'sync-tag-temp', `✓ VOICE: ${val}°C`);
        parsedFields.push(`Temperature: ${val}°C`);
      }
    }

    // 4. Blood Pressure
    const bpMatch = lower.match(/(?:blood\s*pressure|pressure|bp)\s*(?:is|to|at|of)?\s*(\d{2,3})\s*(?:over|\/|by)\s*(\d{2,3})/i);
    if (bpMatch) {
      const sys = parseInt(bpMatch[1], 10);
      const dia = parseInt(bpMatch[2], 10);
      if (sys >= 60 && sys <= 260 && dia >= 40 && dia <= 160) {
        updateField('bp_systolic', sys);
        updateField('bp_diastolic', dia);
        parsedFields.push(`Blood Pressure: ${sys}/${dia} mmHg`);
      }
    }

    // 5. Sleep Duration
    const sleepMatch = lower.match(/(?:sleep|slept)\s*(?:duration|for|was|is)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)?/i);
    if (sleepMatch) {
      const val = parseFloat(sleepMatch[1]);
      if (val >= 0 && val <= 24) {
        updateField('sleep_duration', val, 'sync-tag-sleep', `✓ VOICE: ${val}h`);
        parsedFields.push(`Sleep: ${val} hrs`);
      }
    }

    // 6. Exercise Duration
    const exerciseMatch = lower.match(/(?:exercise|workout|training)\s*(?:duration|for|was|is)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)?/i);
    if (exerciseMatch) {
      const val = parseFloat(exerciseMatch[1]);
      if (val >= 0 && val <= 12) {
        updateField('exercise_duration', val, 'sync-tag-exercise', `✓ VOICE: ${val}h`);
        parsedFields.push(`Exercise: ${val} hrs`);
      }
    }

    // 7. Hydration Fluid Intake
    const hydrationMatch = lower.match(/(?:hydration|fluid|water)\s*(?:intake|is|was|drank)?\s*(\d+(?:\.\d+)?)\s*(?:liters?|litres?|l)?/i);
    if (hydrationMatch) {
      const val = parseFloat(hydrationMatch[1]);
      if (val >= 0 && val <= 10) {
        updateField('hydration', val);
        parsedFields.push(`Hydration: ${val} L`);
      }
    }

    // 8. Mood State
    if (lower.includes('very good')) {
      checkRadio('mood', 'VERY_GOOD');
      parsedFields.push('Mood: Very Good');
    } else if (lower.includes('very low') || lower.includes('depressed')) {
      checkRadio('mood', 'VERY_LOW');
      parsedFields.push('Mood: Very Low');
    } else if (lower.includes('mood good') || lower.includes('mood is good') || lower.includes('feeling good')) {
      checkRadio('mood', 'GOOD');
      parsedFields.push('Mood: Good');
    } else if (lower.includes('neutral') || lower.includes('okay')) {
      checkRadio('mood', 'NEUTRAL');
      parsedFields.push('Mood: Neutral');
    } else if (lower.includes('low') || lower.includes('mood low')) {
      checkRadio('mood', 'LOW');
      parsedFields.push('Mood: Low');
    }

    // 9. Stress Level
    if (lower.includes('stress high') || lower.includes('high stress')) {
      checkRadio('stress', 'HIGH');
      parsedFields.push('Stress: High');
    } else if (lower.includes('stress medium') || lower.includes('medium stress') || lower.includes('moderate stress')) {
      checkRadio('stress', 'MEDIUM');
      parsedFields.push('Stress: Medium');
    } else if (lower.includes('stress low') || lower.includes('low stress') || lower.includes('no stress')) {
      checkRadio('stress', 'LOW');
      parsedFields.push('Stress: Low');
    }

    // 10. Isolation / Confinement
    if (lower.includes('isolation high') || lower.includes('very lonely')) {
      checkRadio('loneliness', 'HIGH');
      parsedFields.push('Isolation: High');
    } else if (lower.includes('isolation moderate') || lower.includes('moderate isolation')) {
      checkRadio('loneliness', 'MODERATE');
      parsedFields.push('Isolation: Moderate');
    } else if (lower.includes('slightly isolated')) {
      checkRadio('loneliness', 'SLIGHTLY');
      parsedFields.push('Isolation: Slightly');
    } else if (lower.includes('not lonely') || lower.includes('isolation none') || lower.includes('not at all')) {
      checkRadio('loneliness', 'NOT_AT_ALL');
      parsedFields.push('Isolation: Nominal');
    }

    // 11. Symptoms Checklist
    const symptomChecks = [
      { kw: 'headache', val: 'HEADACHE', name: 'Headache' },
      { kw: 'dizziness', val: 'DIZZINESS', name: 'Dizziness' },
      { kw: 'vertigo', val: 'DIZZINESS', name: 'Vertigo' },
      { kw: 'fatigue', val: 'FATIGUE', name: 'Fatigue' },
      { kw: 'exhaustion', val: 'FATIGUE', name: 'Exhaustion' },
      { kw: 'nausea', val: 'NAUSEA', name: 'Nausea' },
      { kw: 'motion sickness', val: 'NAUSEA', name: 'Space Motion Sickness' },
      { kw: 'vision', val: 'VISION_BLUR', name: 'Vision Distortion (SANS)' },
      { kw: 'blur', val: 'VISION_BLUR', name: 'Blurred Vision' }
    ];

    symptomChecks.forEach(s => {
      if (lower.includes(s.kw)) {
        const checkbox = document.querySelector(`.symptom-checkbox[value="${s.val}"]`);
        if (checkbox) {
          checkbox.checked = true;
          parsedFields.push(`Symptom Logged: ${s.name}`);
        }
      }
    });

    if (lower.includes('concentration difficulty') || lower.includes('cognitive fatigue')) {
      const concBox = document.getElementById('concentration_difficulty');
      if (concBox) {
        concBox.checked = true;
        parsedFields.push('Cognitive fatigue flagged');
      }
    }

    // Show parsing feedback
    const toast = document.getElementById('voice-parse-toast');
    if (toast) {
      if (parsedFields.length > 0) {
        toast.innerHTML = `<strong>✓ PARSED &amp; POPULATED (${parsedFields.length} ITEMS):</strong> ${parsedFields.join(' &bull; ')}`;
        toast.style.display = 'block';
      } else {
        toast.innerHTML = '<em>Spoken phrase received, but no matching biometric keywords detected. Try saying "Heart rate 72, oxygen 98, mood good".</em>';
        toast.style.display = 'block';
      }
    }
  }

  function updateField(id, val, tagId = null, tagText = null) {
    const input = document.getElementById(id);
    if (input) {
      input.value = val;
      input.classList.remove('input-synced-highlight');
      void input.offsetWidth;
      input.classList.add('input-synced-highlight');
    }
    if (tagId && tagText) {
      const tag = document.getElementById(tagId);
      if (tag) {
        tag.textContent = tagText;
        tag.style.display = 'inline-block';
      }
    }
  }

  function checkRadio(name, val) {
    const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
    if (radio) radio.checked = true;
  }
})();
