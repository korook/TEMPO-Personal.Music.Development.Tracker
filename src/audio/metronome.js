// The v1 metronome: a 4-beat click with a higher pitch on beat 1.
// It still times beats with setInterval, which drifts. Phase 1 replaces it with
// Web Audio lookahead scheduling (TEMPO_PLAN.md section 7).

import { getAudioContext } from './engine.js';

const MIN_BPM = 40;
const MAX_BPM = 200;
const BEATS_PER_BAR = 4;

const state = {
  bpm: 80,
  running: false,
  beat: 0,
  intervalId: null,
  onBeat: null,
};

// ─── Reading state ───

// Returns the current tempo in beats per minute.
export function getBpm() {
  return state.bpm;
}

// Returns true while the metronome is clicking.
export function isRunning() {
  return state.running;
}

// Returns the beat that will sound next (0 = beat 1).
export function getBeat() {
  return state.beat;
}

// Registers a function called on every click with the beat that just sounded.
export function setBeatListener(listener) {
  state.onBeat = listener;
}

// ─── Controls ───

// Starts the metronome if stopped, stops it if running.
export function toggleMetronome() {
  if (state.running) {
    clearInterval(state.intervalId);
    state.running = false;
    state.beat = 0;
  } else {
    state.running = true;
    state.beat = 0;
    startTicking();
  }
}

// Sets the tempo directly (from the slider) and restarts the clicks if running.
export function setBpm(bpm) {
  state.bpm = bpm;
  restartIfRunning();
}

// Moves the tempo up or down, kept between 40 and 200 BPM.
export function adjustBpm(delta) {
  state.bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, state.bpm + delta));
  restartIfRunning();
}

// ─── Timing ───

// Restarts the interval so a tempo change takes effect straight away.
function restartIfRunning() {
  if (!state.running) return;
  clearInterval(state.intervalId);
  startTicking();
}

// Starts an interval that plays one click per beat.
function startTicking() {
  const audioContext = getAudioContext();
  state.intervalId = setInterval(() => {
    playClick(audioContext, state.beat === 0);
    if (state.onBeat) state.onBeat(state.beat);
    state.beat = (state.beat + 1) % BEATS_PER_BAR;
  }, 60000 / state.bpm);
}

// ─── Sound ───

// Plays one short click: 880 Hz on beat 1, 660 Hz on the other beats.
function playClick(audioContext, isDownbeat) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.frequency.value = isDownbeat ? 880 : 660;
  gain.gain.setValueAtTime(0.25, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.08);
}
