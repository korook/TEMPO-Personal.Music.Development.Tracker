// The disc metronome: an abstract record rather than a literal one.
//   - a fixed ring of beat segments around the rim, lit as each beat sounds (beat 1 brightest);
//   - line-art grooves with a cut-away window onto a dot grid, turning slowly so the disc
//     reads as "spinning";
//   - a playhead that sweeps once per bar, steered by the audio clock so it crosses each
//     beat segment exactly as the click sounds;
//   - a dark label with the BPM in dot-matrix figures.
// With reduced motion nothing turns; the beat segments still light up.

import {
  getMetronome,
  toggleMetronome,
  onPulseHeard,
  TIME_SIGNATURES,
} from '../audio/metronome.js';
import { getAudioContext } from '../audio/engine.js';

const CENTRE = 200;
const BEAT_RING_RADIUS = 186;
const BEAT_GAP_DEGREES = 7;
const CUT_FROM_DEGREES = -15;
const CUT_TO_DEGREES = 55;
const FLASH_MS = 110;

// Timing of the bar being played, from the latest beat 1: { startTime, seconds }.
const bar = { startTime: null, seconds: 0 };
let stopListening = null;
let frameId = null;
let animatedVinyl = null;

// ─── Rendering ───

// Returns the disc metronome: the disc, a status line and the − / start / + keys.
export function renderVinylMetronome() {
  const metronome = getMetronome();
  const settings = metronome.getSettings();
  const running = metronome.isRunning();

  return `
    <section class="vinyl" data-running="${running}" style="--spin-seconds:${grooveSeconds(settings)}s" aria-label="Metronome">
      <div class="vinyl__record">${renderDiscSvg(settings)}</div>
      <div class="vinyl__status label">
        <span class="vinyl__led" aria-hidden="true"></span>
        <span data-vinyl-status>${statusText(settings, running)}</span>
      </div>
      <div class="vinyl__controls">
        <button class="button button--icon button--round" data-vinyl-step="-1" aria-label="Slower by 1 BPM">−</button>
        <button class="button ${running ? 'button--live' : 'button--primary'}" data-vinyl-toggle>${running ? 'Stop' : 'Start'}</button>
        <button class="button button--icon button--round" data-vinyl-step="1" aria-label="Faster by 1 BPM">+</button>
      </div>
    </section>`;
}

// Draws the disc: beat ring, rim, turning grooves with the cut-away, playhead and label.
function renderDiscSvg(settings) {
  const beats = TIME_SIGNATURES[settings.timeSignature].beats;
  return `
    <svg class="vinyl__disc" viewBox="0 0 400 400" role="img" aria-label="Metronome disc, ${settings.bpm} beats per minute">
      ${renderBeatRing(beats)}
      <circle class="vinyl__rim" cx="${CENTRE}" cy="${CENTRE}" r="172"/>
      <g class="vinyl__grooves">${renderGrooves()}${renderCutaway()}</g>
      <g class="vinyl__playhead" data-vinyl-playhead>
        <line class="vinyl__needle" x1="${CENTRE}" y1="${CENTRE - 76}" x2="${CENTRE}" y2="${CENTRE - 170}"/>
        <circle class="vinyl__needle-tip" cx="${CENTRE}" cy="${CENTRE - 170}" r="5"/>
      </g>
      <circle class="vinyl__label" cx="${CENTRE}" cy="${CENTRE}" r="70"/>
      <circle class="vinyl__label-ring" cx="${CENTRE}" cy="${CENTRE}" r="62"/>
      <text class="vinyl__bpm-dots" data-vinyl-bpm x="${CENTRE}" y="${CENTRE + 10}" text-anchor="middle" font-size="46">${settings.bpm}</text>
      <text class="vinyl__bpm-unit-dots" x="${CENTRE}" y="${CENTRE + 34}" text-anchor="middle" font-size="12">BPM</text>
      <circle class="vinyl__spindle" cx="${CENTRE}" cy="${CENTRE - 36}" r="5"/>
    </svg>`;
}

// One arc per beat around the rim, beat 1 at the top.
function renderBeatRing(beats) {
  const step = 360 / beats;
  return Array.from({ length: beats }, (_, beat) => {
    const from = beat * step + BEAT_GAP_DEGREES / 2;
    const to = (beat + 1) * step - BEAT_GAP_DEGREES / 2;
    const className = beat === 0 ? 'vinyl__beat vinyl__beat--one' : 'vinyl__beat';
    return `<path class="${className}" data-vinyl-beat="${beat}" d="${arcPath(BEAT_RING_RADIUS, from, to)}"/>`;
  }).join('');
}

// Concentric grooves: mostly hairlines, a few heavier bands and dashed tracks, so the
// turning is visible without drawing a photo-real record.
function renderGrooves() {
  const grooves = [];
  for (let radius = 166, index = 0; radius >= 82; radius -= 6, index++) {
    const heavy = index % 5 === 0;
    const dashed = index % 4 === 2 ? ` stroke-dasharray="${2 + (index % 3) * 3} 6"` : '';
    grooves.push(`<circle class="vinyl__groove" cx="${CENTRE}" cy="${CENTRE}" r="${radius}" stroke-width="${heavy ? 2 : 0.7}" opacity="${heavy ? 0.9 : 0.5}"${dashed}/>`);
  }
  return grooves.join('');
}

// A wedge cut out of the grooves, showing a dot grid underneath (like a transparent case).
function renderCutaway() {
  const wedge = `M${point(80, CUT_FROM_DEGREES)} L${point(168, CUT_FROM_DEGREES)} A168 168 0 0 1 ${point(168, CUT_TO_DEGREES)} L${point(80, CUT_TO_DEGREES)} A80 80 0 0 0 ${point(80, CUT_FROM_DEGREES)} Z`;
  const dots = [];
  for (let radius = 92; radius <= 160; radius += 11) {
    for (let angle = CUT_FROM_DEGREES + 5; angle <= CUT_TO_DEGREES - 4; angle += 600 / radius) {
      const [x, y] = polar(radius, angle);
      dots.push(`<circle class="vinyl__cut-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8"/>`);
    }
  }
  return `<path class="vinyl__cut" d="${wedge}"/>${dots.join('')}`;
}

// ─── Geometry ───

// Returns [x, y] at `radius` and `degrees` (0 = top, clockwise).
function polar(radius, degrees) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return [CENTRE + radius * Math.cos(radians), CENTRE + radius * Math.sin(radians)];
}

// Returns "x y" for SVG paths.
function point(radius, degrees) {
  return polar(radius, degrees).map((value) => value.toFixed(2)).join(' ');
}

// Returns an SVG arc path along a circle from one angle to another.
function arcPath(radius, fromDegrees, toDegrees) {
  const largeArc = toDegrees - fromDegrees > 180 ? 1 : 0;
  return `M${point(radius, fromDegrees)} A${radius} ${radius} 0 ${largeArc} 1 ${point(radius, toDegrees)}`;
}

// ─── Text and timing ───

// The grooves turn once every 4 bars: slow enough to feel calm, fast enough to read as running.
function grooveSeconds(settings) {
  return ((60 / settings.bpm) * TIME_SIGNATURES[settings.timeSignature].beats * 4).toFixed(3);
}

// "Ready · 4/4" or "Running · 4/4".
function statusText(settings, running) {
  return `${running ? 'Running' : 'Ready'} · ${settings.timeSignature}`;
}

// ─── Events ───

// Connects the keys inside `container` and starts following the beats.
export function bindVinylMetronome(container) {
  const vinyl = container.querySelector('.vinyl');
  if (!vinyl) return;

  vinyl.querySelectorAll('[data-vinyl-step]').forEach((button) => {
    button.addEventListener('click', () => {
      getMetronome().adjustBpm(Number(button.dataset.vinylStep));
      refresh(vinyl);
    });
  });
  vinyl.querySelector('[data-vinyl-toggle]').addEventListener('click', async () => {
    await toggleMetronome();
    bar.startTime = null;
    refresh(vinyl);
  });

  if (stopListening) stopListening();
  stopListening = onPulseHeard((pulse) => showPulse(vinyl, pulse));
  if (getMetronome().isRunning()) startPlayhead(vinyl);
}

// Updates the disc inside `container` after the tempo or settings changed elsewhere.
export function refreshVinylMetronome(container = document) {
  const vinyl = container.querySelector('.vinyl');
  if (vinyl) refresh(vinyl);
}

// Updates the BPM, status, groove speed and keys after a change.
function refresh(vinyl) {
  const metronome = getMetronome();
  const settings = metronome.getSettings();
  const running = metronome.isRunning();
  vinyl.dataset.running = String(running);
  vinyl.style.setProperty('--spin-seconds', `${grooveSeconds(settings)}s`);
  vinyl.querySelector('[data-vinyl-bpm]').textContent = settings.bpm;
  vinyl.querySelector('[data-vinyl-status]').textContent = statusText(settings, running);
  const toggle = vinyl.querySelector('[data-vinyl-toggle]');
  toggle.textContent = running ? 'Stop' : 'Start';
  toggle.className = `button ${running ? 'button--live' : 'button--primary'}`;
  if (running) {
    startPlayhead(vinyl);
  } else {
    vinyl.querySelectorAll('[data-vinyl-beat]').forEach((segment) => { segment.dataset.on = 'false'; });
  }
}

// Lights the beat segment that is sounding and flashes the label on beat 1.
function showPulse(vinyl, pulse) {
  if (!pulse.isBeat || !vinyl.isConnected) return;
  const beats = TIME_SIGNATURES[getMetronome().getSettings().timeSignature].beats;
  if (pulse.beatInBar === 0) {
    bar.startTime = pulse.time;
    bar.seconds = (60 / pulse.bpm) * beats;
    vinyl.dataset.flash = 'downbeat';
    setTimeout(() => { delete vinyl.dataset.flash; }, FLASH_MS);
  }
  vinyl.querySelectorAll('[data-vinyl-beat]').forEach((segment) => {
    segment.dataset.on = String(Number(segment.dataset.vinylBeat) === pulse.beatInBar);
  });
  // The speed trainer can change the tempo mid-run, so keep the readout in step.
  if (Number(vinyl.querySelector('[data-vinyl-bpm]').textContent) !== pulse.bpm) refresh(vinyl);
}

// Turns the playhead every animation frame to match the audio clock. If the page was
// redrawn, the loop moves over to the new disc.
function startPlayhead(vinyl) {
  if (frameId !== null && animatedVinyl === vinyl) return;
  if (frameId !== null) cancelAnimationFrame(frameId);
  animatedVinyl = vinyl;
  const playhead = vinyl.querySelector('[data-vinyl-playhead]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const step = () => {
    if (!vinyl.isConnected || !getMetronome().isRunning()) {
      frameId = null;
      return;
    }
    if (bar.startTime !== null && !reduceMotion && !document.body.classList.contains('motion-off')) {
      const progress = (getAudioContext().currentTime - bar.startTime) / bar.seconds;
      const degrees = Math.max(0, Math.min(1, progress)) * 360;
      playhead.setAttribute('transform', `rotate(${degrees.toFixed(2)} ${CENTRE} ${CENTRE})`);
    }
    frameId = requestAnimationFrame(step);
  };
  frameId = requestAnimationFrame(step);
}
