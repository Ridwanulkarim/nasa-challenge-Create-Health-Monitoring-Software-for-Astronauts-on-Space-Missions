/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Space Medicine Emergency QRH Client Script: frontend/js/emergency.js
 * 
 * Provides interactive emergency checklist step tracking, instant keyword
 * search filtering, and synthesized spacecraft emergency audio alert chimes.
 */

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('emergency-search-input');
  const searchCount = document.getElementById('search-count');
  const qrhCards = document.querySelectorAll('.qrh-card');
  const checkboxes = document.querySelectorAll('.qrh-step-checkbox');
  const resetBtn = document.getElementById('btn-reset-qrh');
  const soundAlarmBtn = document.getElementById('btn-sound-alarm');

  // Load saved checklist state
  const savedState = JSON.parse(localStorage.getItem('astro_qrh_checks') || '{}');
  checkboxes.forEach((cb, idx) => {
    if (savedState[idx]) {
      cb.checked = true;
      cb.closest('.qrh-step-item').classList.add('completed');
    }

    cb.addEventListener('change', () => {
      const parent = cb.closest('.qrh-step-item');
      if (cb.checked) {
        parent.classList.add('completed');
        savedState[idx] = true;
      } else {
        parent.classList.remove('completed');
        delete savedState[idx];
      }
      localStorage.setItem('astro_qrh_checks', JSON.stringify(savedState));
    });
  });

  // Reset checklists
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      checkboxes.forEach(cb => {
        cb.checked = false;
        cb.closest('.qrh-step-item').classList.remove('completed');
      });
      localStorage.removeItem('astro_qrh_checks');
    });
  }

  // Instant Search Filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      let matchCount = 0;

      qrhCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const keywords = (card.getAttribute('data-keywords') || '').toLowerCase();
        if (!q || text.includes(q) || keywords.includes(q)) {
          card.style.display = 'block';
          matchCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (searchCount) {
        searchCount.textContent = `${matchCount} of ${qrhCards.length} Protocols`;
      }
    });
  }

  // Synthesized Spacecraft Alarm Chime via Web Audio API
  let audioCtx = null;
  if (soundAlarmBtn) {
    soundAlarmBtn.addEventListener('click', () => {
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const now = audioCtx.currentTime;

        // Dual-tone Spacecraft Emergency Pulsing Chime
        const playTone = (freq, start, duration) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(start);
          osc.stop(start + duration);
        };

        // 3 Emergency Warning Beeps
        playTone(920, now, 0.15);
        playTone(660, now + 0.18, 0.2);

        playTone(920, now + 0.45, 0.15);
        playTone(660, now + 0.63, 0.2);

        playTone(920, now + 0.90, 0.15);
        playTone(660, now + 1.08, 0.3);

        soundAlarmBtn.style.background = 'rgba(239, 68, 68, 0.25)';
        soundAlarmBtn.innerHTML = '<svg class="hud-icon" style="color: #ef4444; margin-right: 4px;" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> ALARM SOUNDING...';
        setTimeout(() => {
          soundAlarmBtn.style.background = '';
          soundAlarmBtn.innerHTML = '<svg class="hud-icon" style="color: #ef4444; margin-right: 4px;" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> TEST AUDIO ALARM CHIME';
        }, 1500);

      } catch (err) {
        console.warn('Audio synthesis not supported or blocked:', err);
      }
    });
  }
});
