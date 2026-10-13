// The metronome on the Practice page: the disc metronome (start/stop, ±1 BPM, beat lights)
// plus a panel with the tempo slider, time signature, clicks per beat, sound, accent,
// tap tempo, speed trainer and the chord-change display, and the keyboard shortcuts.

import { renderVinylMetronome, bindVinylMetronome, refreshVinylMetronome } from './vinyl-metronome.js';
import {
  getMetronome,
  toggleMetronome,
  onPulseHeard,
  createTapTempo,
  TIME_SIGNATURES,
  CLICK_SOUNDS,
  MIN_BPM,
  MAX_BPM,
} from '../audio/metronome.js';

const SUBDIVISION_LABELS = { 1: 'Beats only', 2: 'Eighths', 3: 'Triplets', 4: 'Sixteenths' };
const tapTempo = createTapTempo();

// Called after the metronome starts, stops or changes, so the page can redraw.
let redrawPage = () => {};

onPulseHeard(showPulse);

// ─── Rendering ───

// Returns the Practice page's metronome: the disc metronome as the hero, with the tempo
// slider and the metronome settings in a panel beside it.
export function renderMetronomePanel({ hero = false } = {}) {
  const settings = getMetronome().getSettings();
  const trainer = settings.speedTrainer;

  return `
    <section class="practice-metronome${hero ? ' practice-metronome--hero' : ''}" aria-label="Metronome">
      ${renderVinylMetronome()}
      <div class="panel metro-controls">
        <div class="section-head">
          <span class="section-head__kicker">${hero ? 'Practice · metronome' : 'Metronome'}</span>
          ${hero ? '<h1 class="section-head__title section-head__title--hero">Tempo</h1>' : '<h2 class="section-head__title">Tempo &amp; feel</h2>'}
        </div>
        <label class="metro-slider">
          <span class="label">Tempo · <span id="bN">${settings.bpm}</span> BPM</span>
          <input type="range" class="tempo-slider" id="bpmSlider" min="${MIN_BPM}" max="${MAX_BPM}" value="${settings.bpm}" step="1" aria-label="Tempo in BPM">
        </label>
        <div class="metro-options">
          <label>Time ${renderSelect('timeSignature', Object.keys(TIME_SIGNATURES), settings.timeSignature)}</label>
          <label>Clicks ${renderSelect('subdivision', Object.keys(SUBDIVISION_LABELS), String(settings.subdivision), SUBDIVISION_LABELS)}</label>
          <label>Sound ${renderSelect('sound', Object.keys(CLICK_SOUNDS), settings.sound, mapNames(CLICK_SOUNDS))}</label>
          <label class="metro-check"><input type="checkbox" data-option="accent" ${settings.accent ? 'checked' : ''}> Accent beat 1</label>
          <button class="button" id="tapTempo">Tap tempo</button>
        </div>
        <div class="metro-trainer">
          <label class="metro-check"><input type="checkbox" data-trainer="enabled" ${trainer.enabled ? 'checked' : ''}> Speed trainer</label>
          <label>+${renderNumber('stepBpm', trainer.stepBpm, 1, 20)} BPM</label>
          <label>every ${renderNumber('everyBars', trainer.everyBars, 1, 32)} bars</label>
          <label>up to ${renderNumber('targetBpm', trainer.targetBpm, MIN_BPM, MAX_BPM)}</label>
        </div>
        ${renderChordChangeDisplay(settings.chordChange)}
        <p class="label metro-keys">Keys: Space start/stop · ↑ ↓ ±1 BPM · ⇧↑ ⇧↓ ±5 · T tap</p>
      </div>
    </section>`;
}

// Returns the big "now → next" chord display, shown only in chord-change mode.
function renderChordChangeDisplay(chordChange) {
  if (!chordChange.enabled) return '';
  const [first, second] = chordChange.chords;
  return `
    <div class="metro-chords">
      <div><div class="metro-chord-now" id="chordNow">${first}</div><div class="label">now</div></div>
      <div><div class="metro-chord-next" id="chordNext">${second || first}</div><div class="label">next · change every ${chordChange.everyBeats} beats</div></div>
      <button class="button" id="chordChangeOff">End drill</button>
    </div>`;
}

// Returns a <select> for one metronome option.
function renderSelect(option, values, selected, labels = {}) {
  const options = values
    .map((value) => `<option value="${value}"${value === selected ? ' selected' : ''}>${labels[value] || value}</option>`)
    .join('');
  return `<select data-option="${option}">${options}</select>`;
}

// Returns a small number box for one speed trainer setting.
function renderNumber(field, value, min, max) {
  return `<input type="number" class="metro-number" data-trainer="${field}" value="${value}" min="${min}" max="${max}">`;
}

// Turns { id: { name } } into { id: name } for select labels.
function mapNames(entries) {
  return Object.fromEntries(Object.entries(entries).map(([id, entry]) => [id, entry.name]));
}

// ─── Live updates ───

// Lights the dot for the beat that is sounding, and updates the chord display.
function showPulse(pulse) {
  if (pulse.isBeat) {
    document.querySelectorAll('.bd').forEach((dot, index) => {
      dot.classList.remove('on', 'down');
      if (index === pulse.beatInBar) dot.classList.add(pulse.kind === 'accent' ? 'down' : 'on');
    });
  }
  if (pulse.chord) {
    setText('chordNow', pulse.chord.current);
    setText('chordNext', pulse.chord.next);
  }
  setText('bN', pulse.bpm);
  const slider = document.getElementById('bpmSlider');
  if (slider && Number(slider.value) !== pulse.bpm) slider.value = pulse.bpm;
}

// Writes the current BPM into the readout, the slider and the disc.
function showBpm() {
  const bpm = getMetronome().getSettings().bpm;
  setText('bN', bpm);
  const slider = document.getElementById('bpmSlider');
  if (slider) slider.value = bpm;
  refreshVinylMetronome();
}

// Sets the text of an element if it is on screen.
function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

// ─── Events ───

// Connects every control in the card. `redraw` redraws the whole page after big changes.
export function bindMetronomePanel(page, redraw) {
  redrawPage = redraw;
  const metronome = getMetronome();

  bindVinylMetronome(page);
  page.querySelector('#bpmSlider').addEventListener('input', (event) => {
    metronome.setBpm(Number(event.target.value));
    showBpm();
  });
  page.querySelector('#tapTempo').addEventListener('click', tap);
  page.querySelectorAll('[data-option]').forEach((control) => {
    control.addEventListener('change', () => applyOption(control));
  });
  page.querySelectorAll('[data-trainer]').forEach((control) => {
    control.addEventListener('change', () => applyTrainerSetting(control));
  });
  const endDrill = page.querySelector('#chordChangeOff');
  if (endDrill) endDrill.addEventListener('click', () => stopChordDrill());
}

// Starts or stops the metronome and redraws the button.
async function startOrStop() {
  await toggleMetronome();
  redrawPage();
}

// Moves the tempo by `delta` BPM.
function changeBpm(delta) {
  getMetronome().adjustBpm(delta);
  showBpm();
}

// Records a tap and sets the tempo once there are enough taps.
function tap() {
  const bpm = tapTempo.tap(performance.now());
  if (bpm === null) return;
  getMetronome().setBpm(bpm);
  showBpm();
}

// Applies a change from a select or the accent checkbox.
function applyOption(control) {
  const metronome = getMetronome();
  const option = control.dataset.option;
  if (option === 'timeSignature') metronome.setTimeSignature(control.value);
  if (option === 'subdivision') metronome.setSubdivision(Number(control.value));
  if (option === 'sound') metronome.configure({ sound: control.value });
  if (option === 'accent') metronome.configure({ accent: control.checked });
  redrawPage();
}

// Applies a change to the speed trainer settings.
function applyTrainerSetting(control) {
  const field = control.dataset.trainer;
  const value = field === 'enabled' ? control.checked : Number(control.value);
  getMetronome().configure({ speedTrainer: { [field]: value } });
}

// ─── Chord drills ───

// Starts a chord-change drill: the display shows each chord for `everyBeats` beats.
export async function startChordDrill(chords, everyBeats = 4) {
  const metronome = getMetronome();
  metronome.configure({ chordChange: { enabled: true, chords, everyBeats } });
  if (metronome.isRunning()) metronome.stop();
  await toggleMetronome();
  redrawPage();
}

// Ends the chord-change drill and stops the metronome.
function stopChordDrill() {
  const metronome = getMetronome();
  metronome.configure({ chordChange: { enabled: false } });
  metronome.stop();
  redrawPage();
}

// ─── Keyboard ───

// Handles metronome keys while the Practice page is open (plan section 7).
// Typing in a box or using a focused control keeps its normal key behaviour.
export function handleMetronomeKey(event) {
  const target = event.target;
  const isFormControl = target.closest && target.closest('input, select, textarea, button');
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (event.key === ' ' && !isFormControl) {
    event.preventDefault();
    startOrStop();
  } else if (event.key === 'ArrowUp' && !isTextBox(target)) {
    event.preventDefault();
    changeBpm(event.shiftKey ? 5 : 1);
  } else if (event.key === 'ArrowDown' && !isTextBox(target)) {
    event.preventDefault();
    changeBpm(event.shiftKey ? -5 : -1);
  } else if ((event.key === 't' || event.key === 'T') && !isTextBox(target)) {
    tap();
  }
}

// Returns true for controls where arrow keys and letters already mean something.
function isTextBox(element) {
  return Boolean(element.closest && element.closest('input, select, textarea'));
}
