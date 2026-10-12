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

// ─── Helpers ───

// Reads a design-system colour (e.g. "bronze" → the value of --bronze) from the page,
// so charts follow the current theme.
function colour(name) {
  return getComputedStyle(document.body).getPropertyValue(`--${name}`).trim();
}

// Turns "#c9813f" into "rgba(201, 129, 63, 0.15)" for see-through fills.
function withAlpha(hex, alpha) {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

// The shared look for axis labels, grid lines and tooltips.
function chartStyle() {
  return {
    axisText: colour('text-faint'),
    gridLine: colour('line'),
    font: 'Martian Mono',
    tooltip: {
      backgroundColor: colour('screen'),
      titleColor: colour('screen-text'),
      bodyColor: colour('screen-text'),
      borderColor: colour('screen-line'),
      borderWidth: 1,
      cornerRadius: 8,
    },
  };
}

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

  const style = chartStyle();
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const minutes = labels.map((_, index) => minutesOnDay(sessions, daysBefore(new Date(), 6 - index)));

  charts.weekly = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: minutes,
        backgroundColor: minutes.map((value) => (value > 0 ? colour('bronze') : colour('body-3'))),
        borderRadius: 5,
        barThickness: 28,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: style.tooltip,
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: style.gridLine },
          ticks: { color: style.axisText, font: { size: 12, family: style.font } },
        },
        x: {
          grid: { display: false },
          ticks: { color: style.axisText, font: { size: 12, family: style.font } },
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

  const style = chartStyle();
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
        backgroundColor: withAlpha(colour('bronze'), 0.15),
        borderColor: colour('bronze'),
        pointBackgroundColor: colour('bronze'),
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
          grid: { color: style.gridLine },
          angleLines: { color: style.gridLine },
          pointLabels: { color: colour('text-muted'), font: { size: 12, family: 'Archivo' } },
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

  const style = chartStyle();
  const days = Array.from({ length: 14 }).map((_, index) => {
    const day = daysBefore(new Date(), 13 - index);
    const upToDay = sessions.filter((session) => new Date(session.end) <= day);
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
        borderColor: colour('bronze'),
        backgroundColor: withAlpha(colour('bronze'), 0.12),
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        pointBackgroundColor: colour('bronze'),
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
          grid: { color: style.gridLine },
          ticks: { color: style.axisText, font: { size: 12, family: style.font } },
        },
        x: {
          grid: { display: false },
          ticks: { color: style.axisText, font: { size: 12, family: style.font }, maxRotation: 45 },
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
        backgroundColor: [colour('bronze'), colour('sonic'), colour('verdigris')],
        borderColor: colour('body-2'),
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
