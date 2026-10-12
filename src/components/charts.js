// Chart.js charts for the Dashboard and Progress pages, moved from v1 unchanged.
// Known v1 problems kept for Phase 0 (see TEMPO_PLAN.md section 2):
//   - The weekly chart is always labelled Mon→Sun, but shows the last 7 days ending today.
//   - The skill radar's Strumming / Rhythm / Ear values are made up from the open-chord score.

import Chart from 'chart.js/auto';
import { minutesOnDay, totalMinutes } from '../practice/history.js';
import { daysBefore } from '../utils/time.js';
import {
  OPEN_CHORD_KEYS,
  SEVENTH_CHORD_KEYS,
  MAJOR_CHORD_KEYS,
  MINOR_CHORD_KEYS,
} from '../data/chords-v1.js';

// Live chart instances, so a chart can be destroyed before it is drawn again.
const charts = {};

const AXIS_TEXT = '#6a6862';
const GRID_LINE = 'rgba(255,255,255,.04)';

// ─── Helpers ───

// Destroys the previous chart stored under `name`, if there is one.
function destroyChart(name) {
  if (charts[name]) charts[name].destroy();
}

// Returns the average self-rated % for a list of chords, rounded.
function averageProgress(progress, chordKeys) {
  const sum = chordKeys.reduce((total, key) => total + (progress[key] || 0), 0);
  return Math.round(sum / chordKeys.length);
}

// ─── Dashboard charts ───

// Draws the bar chart of minutes practiced on each of the last 7 days.
export function renderWeeklyChart(sessions) {
  const canvas = document.getElementById('chW');
  if (!canvas) return;
  destroyChart('weekly');

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const minutes = labels.map((_, index) => minutesOnDay(sessions, daysBefore(new Date(), 6 - index)));

  charts.weekly = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: minutes,
        backgroundColor: minutes.map((value) => (value > 0 ? '#e85c3a' : '#2a2a2e')),
        borderRadius: 5,
        barThickness: 28,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#222',
          titleColor: '#f0ede6',
          bodyColor: '#f0ede6',
          borderColor: '#3a3a3e',
          borderWidth: 1,
          cornerRadius: 8,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: GRID_LINE },
          ticks: { color: AXIS_TEXT, font: { size: 11, family: 'DM Mono' } },
        },
        x: {
          grid: { display: false },
          ticks: { color: AXIS_TEXT, font: { size: 11, family: 'DM Mono' } },
        },
      },
    },
  });
}

// Draws the skill radar from the self-rated chord progress.
export function renderSkillRadar(progress) {
  const canvas = document.getElementById('chR');
  if (!canvas) return;
  destroyChart('radar');

  const openAverage = averageProgress(progress, OPEN_CHORD_KEYS);
  const barreAverage = progress['F'] || 0;
  const seventhAverage = averageProgress(progress, SEVENTH_CHORD_KEYS);
  const values = [
    openAverage,
    barreAverage,
    seventhAverage,
    Math.min(100, openAverage * 0.8),
    Math.min(100, openAverage * 0.6),
    Math.min(100, openAverage * 0.4),
  ];

  charts.radar = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: ['Open chords', 'Barre', '7th chords', 'Strumming', 'Rhythm', 'Ear'],
      datasets: [{
        data: values,
        backgroundColor: 'rgba(232,92,58,.1)',
        borderColor: '#e85c3a',
        pointBackgroundColor: '#e85c3a',
        pointRadius: 3,
        borderWidth: 1.5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { display: false, stepSize: 25 },
          grid: { color: 'rgba(255,255,255,.06)' },
          pointLabels: { color: '#9c9a92', font: { size: 10, family: 'Plus Jakarta Sans' } },
        },
      },
    },
  });
}

// ─── Progress charts ───

// Draws the line chart of total minutes practiced, day by day, over the last 14 days.
export function renderCumulativeChart(sessions) {
  const canvas = document.getElementById('chCu');
  if (!canvas) return;
  destroyChart('cumulative');

  const days = Array.from({ length: 14 }).map((_, index) => {
    const day = daysBefore(new Date(), 13 - index);
    const upToDay = sessions.filter((session) => new Date(session.date) <= day);
    return {
      label: day.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      minutes: totalMinutes(upToDay),
    };
  });

  charts.cumulative = new Chart(canvas, {
    type: 'line',
    data: {
      labels: days.map((day) => day.label),
      datasets: [{
        data: days.map((day) => day.minutes),
        borderColor: '#e85c3a',
        backgroundColor: 'rgba(232,92,58,.06)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        pointBackgroundColor: '#e85c3a',
        borderWidth: 1.5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: GRID_LINE },
          ticks: { color: AXIS_TEXT, font: { size: 10, family: 'DM Mono' } },
        },
        x: {
          grid: { display: false },
          ticks: { color: AXIS_TEXT, font: { size: 9, family: 'DM Mono' }, maxRotation: 45 },
        },
      },
    },
  });
}

// Draws the doughnut of average self-rated % for major, minor and 7th chords.
export function renderChordTypeDonut(progress) {
  const canvas = document.getElementById('chDo');
  if (!canvas) return;
  destroyChart('donut');

  const values = [
    Math.max(1, averageProgress(progress, MAJOR_CHORD_KEYS)),
    Math.max(1, averageProgress(progress, MINOR_CHORD_KEYS)),
    Math.max(1, averageProgress(progress, SEVENTH_CHORD_KEYS)),
  ];

  charts.donut = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Major', 'Minor', '7th'],
      datasets: [{
        data: values,
        backgroundColor: ['#e85c3a', '#4a8fe8', '#e8a832'],
        borderColor: '#131315',
        borderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: { legend: { display: false } },
    },
  });
}
