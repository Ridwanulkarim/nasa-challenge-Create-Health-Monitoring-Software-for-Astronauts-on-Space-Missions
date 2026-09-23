let activeFilter = '14d';
const chartInstances = {};

document.addEventListener('DOMContentLoaded', async () => {
  const user = window.api.getUser();
  if (!user || !user.astronautId) return;

  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      loadHistoryTable(user.astronautId, activeFilter);
    });
  });

  await loadHistoryTable(user.astronautId, activeFilter);
  await loadTrendCharts(user.astronautId);
});

async function loadHistoryTable(astronautId, filter) {
  const tbody = document.getElementById('history-table-body');
  const countBadge = document.getElementById('table-count-badge');

  try {
    const res = await window.api.get(`/health/${astronautId}/history?filter=${filter}`);
    if (!res.success || !res.history || res.history.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 24px;">No telemetry records found for this range.</td></tr>';
      countBadge.textContent = '0 RECORDS';
      return;
    }

    countBadge.textContent = `${res.history.length} RECORDS LOADED`;
    tbody.innerHTML = '';

    res.history.forEach(row => {
      const tr = document.createElement('tr');
      const dateStr = new Date(row.record_date).toISOString().slice(0, 10);
      const moodText = row.mood ? row.mood.replace(/_/g, ' ') : '--';
      const stressText = row.stress_level || '--';
      const dailyRad = row.radiation_daily !== null ? `${row.radiation_daily} mSv` : '--';

      tr.innerHTML = `
        <td style="font-weight: 700; color: var(--text-highlight);">${dateStr}</td>
        <td>Day ${row.mission_day}</td>
        <td class="mono">${row.heart_rate !== null ? row.heart_rate + ' BPM' : '--'}</td>
        <td class="mono" style="${row.spo2 < 90 ? 'color: var(--status-critical-text); font-weight: 700;' : ''}">${row.spo2 !== null ? row.spo2 + '%' : '--'}</td>
        <td class="mono" style="${row.sleep_duration < 6.0 ? 'color: var(--status-warning-text);' : ''}">${row.sleep_duration !== null ? row.sleep_duration + 'h' : '--'}</td>
        <td class="mono">${row.exercise_duration !== null ? row.exercise_duration + 'h' : '--'}</td>
        <td class="mono">${stressText}</td>
        <td>${moodText}</td>
        <td class="mono">${dailyRad}</td>
        <td><span class="status-badge ${row.overall_status}">${row.overall_status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--status-critical-text); padding: 20px;">Telemetry read error: ${err.message}</td></tr>`;
  }
}

async function loadTrendCharts(astronautId) {
  if (typeof Chart === 'undefined') return;

  Chart.defaults.color = '#64748b';
  Chart.defaults.borderColor = 'rgba(0, 229, 255, 0.08)';
  Chart.defaults.font.family = '"SF Mono", Menlo, Consolas, monospace';
  Chart.defaults.font.size = 10;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(13, 22, 41, 0.95)';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(0, 240, 255, 0.3)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
  Chart.defaults.plugins.tooltip.bodyColor = '#00f0ff';
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 6;

  try {
    const res = await window.api.get(`/health/${astronautId}/trends?days=14`);
    if (!res.success || !res.trends) return;

    const t = res.trends;

    createOrUpdateChart('chart-heart-rate', {
      type: 'line',
      data: {
        labels: t.labels,
        datasets: [
          {
            label: 'Heart Rate (BPM)',
            data: t.heartRate,
            borderColor: '#00f0ff',
            backgroundColor: 'rgba(0, 240, 255, 0.08)',
            fill: true,
            tension: 0.25,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2
          },
          {
            label: 'Personal Baseline',
            data: t.heartRateBaseline,
            borderColor: '#ffab00',
            borderDash: [4, 4],
            fill: false,
            pointRadius: 0,
            borderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 50, max: 120, grid: { color: 'rgba(255, 255, 255, 0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });

    createOrUpdateChart('chart-spo2', {
      type: 'line',
      data: {
        labels: t.labels,
        datasets: [{
          label: 'SpO₂ (%)',
          data: t.spo2,
          borderColor: '#00e676',
          backgroundColor: 'rgba(0, 230, 118, 0.08)',
          fill: true,
          tension: 0.2,
          pointRadius: 4,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 85, max: 100, grid: { color: 'rgba(255, 255, 255, 0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });

    createOrUpdateChart('chart-sleep', {
      type: 'bar',
      data: {
        labels: t.labels,
        datasets: [{
          label: 'Sleep (Hours)',
          data: t.sleep,
          backgroundColor: t.sleep.map(v => v < 6.0 ? '#ff5252' : '#818cf8'),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 10, grid: { color: 'rgba(255, 255, 255, 0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });

    createOrUpdateChart('chart-exercise', {
      type: 'bar',
      data: {
        labels: t.labels,
        datasets: [{
          label: 'Exercise (Hours)',
          data: t.exercise,
          backgroundColor: '#38bdf8',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 4, grid: { color: 'rgba(255, 255, 255, 0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });

    createOrUpdateChart('chart-stress', {
      type: 'line',
      data: {
        labels: t.labels,
        datasets: [{
          label: 'Stress Score',
          data: t.stress,
          borderColor: '#fbbf24',
          stepped: true,
          pointRadius: 4,
          backgroundColor: 'rgba(251, 191, 36, 0.08)',
          fill: true,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 1,
            max: 3,
            ticks: {
              stepSize: 1,
              callback: (val) => val === 1 ? 'Low' : (val === 2 ? 'Med' : 'High')
            },
            grid: { color: 'rgba(255, 255, 255, 0.04)' }
          },
          x: { grid: { display: false } }
        }
      }
    });

    createOrUpdateChart('chart-radiation', {
      type: 'line',
      data: {
        labels: t.labels,
        datasets: [{
          label: 'Cumulative Dose (mSv)',
          data: t.radiationCumulative,
          borderColor: '#ff5252',
          backgroundColor: 'rgba(255, 82, 82, 0.1)',
          fill: true,
          tension: 0.25,
          pointRadius: 3,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { grid: { color: 'rgba(255, 255, 255, 0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });

  } catch (err) {
    console.error('Trend charts error:', err);
  }
}

function createOrUpdateChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  chartInstances[canvasId] = new Chart(canvas, config);
}
