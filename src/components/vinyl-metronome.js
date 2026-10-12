// The vinyl metronome (TEMPO_PLAN.md section 3): a record that turns once per bar, so
// its speed follows the BPM, and whose label flashes on every beat (brightest on beat 1).
// While it runs it gets the violet "live" glow. With reduced motion the record stays
// still and only the label flashes. Driven by the shared metronome from Phase 1.

import {
  getMetronome,
  toggleMetronome,
  onPulseHeard,
  TIME_SIGNATURES,
} from '../audio/metronome.js';

const FLASH_MS = 110;
let stopListening = null;

// ─── Rendering ───

// Returns the vinyl metronome: the record, the BPM readout with − / + buttons,
// beat lights and the start / stop button.
export function renderVinylMetronome() {
  const metronome = getMetronome();
  const settings = metronome.getSettings();
  const running = metronome.isRunning();
  const beats = TIME_SIGNATURES[settings.timeSignature].beats;

  return `
    <section class="vinyl" data-running="${running}" style="--spin-seconds:${spinSeconds(settings)}s" aria-label="Metronome">
      <div class="vinyl__record">${renderRecordSvg()}</div>
      <div class="vinyl__readout">
        <button class="button button--ghost button--icon" data-vinyl-step="-1" aria-label="Slower by 1 BPM">−</button>
        <div>
          <output class="vinyl__bpm" data-vinyl-bpm aria-live="polite">${settings.bpm}</output>
          <span class="vinyl__bpm-unit">BPM · ${settings.timeSignature}</span>
        </div>
        <button class="button button--ghost button--icon" data-vinyl-step="1" aria-label="Faster by 1 BPM">+</button>
      </div>
      <div class="vinyl__beats" aria-hidden="true">${'<span class="vinyl__beat"></span>'.repeat(beats)}</div>
      <button class="button ${running ? 'button--live' : 'button--primary'}" data-vinyl-toggle>${running ? 'Stop' : 'Start'}</button>
    </section>`;
}

// Draws the record: grooves, a coral label with "TEMPO", the spindle hole and a sheen,
// so the turning is visible.
function renderRecordSvg() {
  const grooves = Array.from({ length: 14 }, (_, index) => {
    const radius = 186 - index * 8.5;
    return `<circle cx="200" cy="200" r="${radius}" fill="none" stroke="#2a262e" stroke-width="${index % 3 === 0 ? 1.4 : 0.7}"/>`;
  }).join('');
  return `
    <svg class="vinyl__disc" viewBox="0 0 400 400" aria-hidden="true">
      <circle cx="200" cy="200" r="198" fill="#111013"/>
      ${grooves}
      <path d="M200 20 A180 180 0 0 1 356 110" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="18" stroke-linecap="round"/>
      <circle class="vinyl__label" cx="200" cy="200" r="66"/>
      <text x="200" y="190" text-anchor="middle" font-family="Limelight, serif" font-size="24" fill="#0d0c0e">TEMPO</text>
      <text x="200" y="222" text-anchor="middle" font-family="DM Mono, monospace" font-size="14" fill="#0d0c0e">SIDE A</text>
      <circle cx="200" cy="200" r="6" fill="#0d0c0e"/>
    </svg>`;
}

// One full turn per bar: 4/4 at 60 BPM turns once every 4 seconds.
function spinSeconds(settings) {
  return ((60 / settings.bpm) * TIME_SIGNATURES[settings.timeSignature].beats).toFixed(3);
}

// ─── Events ───

// Connects the buttons inside `container` and starts listening for beats.
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
    refresh(vinyl);
  });

  if (stopListening) stopListening();
  stopListening = onPulseHeard((pulse) => showPulse(vinyl, pulse));
}

// Updates the readout, spin speed, running state and button after a change.
function refresh(vinyl) {
  const metronome = getMetronome();
  const settings = metronome.getSettings();
  const running = metronome.isRunning();
  vinyl.dataset.running = String(running);
  vinyl.style.setProperty('--spin-seconds', `${spinSeconds(settings)}s`);
  vinyl.querySelector('[data-vinyl-bpm]').textContent = settings.bpm;
  const toggle = vinyl.querySelector('[data-vinyl-toggle]');
  toggle.textContent = running ? 'Stop' : 'Start';
  toggle.className = `button ${running ? 'button--live' : 'button--primary'}`;
  if (!running) vinyl.querySelectorAll('.vinyl__beat').forEach((dot) => { dot.dataset.on = 'false'; });
}

// Flashes the label and lights the beat dot when a click sounds.
function showPulse(vinyl, pulse) {
  if (!pulse.isBeat || !vinyl.isConnected) return;
  vinyl.dataset.flash = pulse.beatInBar === 0 ? 'downbeat' : 'beat';
  setTimeout(() => { delete vinyl.dataset.flash; }, FLASH_MS);
  vinyl.querySelectorAll('.vinyl__beat').forEach((dot, index) => {
    dot.dataset.on = String(index === pulse.beatInBar);
  });
  // The speed trainer can change the tempo mid-run, so keep the readout and spin in step.
  const bpmOutput = vinyl.querySelector('[data-vinyl-bpm]');
  if (Number(bpmOutput.textContent) !== pulse.bpm) refresh(vinyl);
}
