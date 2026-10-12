// Chart.js charts for the Today and Progress pages: minutes over the last 7 days (labelled
// with the real days) and total minutes over the last 14 days. Colours follow the theme.

import Chart from 'chart.js/auto';
import { minutesOnDay, totalMinutes, lastDayLabels } from '../practice/history.js';
import { daysBefore } from '../utils/time.js';

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

// ─── Dashboard charts ───

// Draws the bar chart of minutes practiced on each of the last 7 days.
export function renderWeeklyChart(sessions) {
  const canvas = document.getElementById('chW');
  if (!canvas) return;
  destroyChart('weekly');

  const style = chartStyle();
  const labels = lastDayLabels(7);
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
        cubicInterpolationMode: 'monotone',
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
