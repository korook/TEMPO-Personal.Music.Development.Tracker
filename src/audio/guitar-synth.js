// A plucked-string guitar sound made with the Karplus-Strong method: a short burst of
// noise circles through a delay line one string-period long, and a gentle averaging
// filter makes it ring and fade like a real string. No sample files needed.
//
// karplusStrong() and planStrum() are plain functions so tests can check them;
// playChord() and playNote() send the sound to the speakers.

import { getAudioContext, getMasterOutput, unlockAudio } from './engine.js';
import { fretToMidi, midiToFrequency } from '../theory/notes.js';

const NOTE_SECONDS = 3;
const DEFAULT_STRUM_MS = 25;

// ─── Sound generation ───

// Returns the samples of one plucked note at `frequency` Hz.
// brightness (0–1): how much high end the pluck has. decay (0–1): how long it rings.
export function karplusStrong(frequency, {
  sampleRate = 44100,
  seconds = NOTE_SECONDS,
  brightness = 0.6,
  decay = 0.996,
  random = Math.random,
} = {}) {
  const tuning = tuneLoop(sampleRate / frequency);
  const loop = createPluckBurst(tuning.length, brightness, random);
  const output = new Float32Array(Math.round(sampleRate * seconds));

  let index = 0;
  let previousRead = 0;
  let allpassIn = 0;
  let allpassOut = 0;
  for (let sample = 0; sample < output.length; sample++) {
    const read = loop[index];
    output[sample] = read;
    // Averaging two neighbours softens the string a little more on every trip round the loop.
    const averaged = decay * 0.5 * (read + previousRead);
    previousRead = read;
    // The all-pass filter adds the fraction of a sample needed to land exactly in tune.
    allpassOut = tuning.coefficient * averaged + allpassIn - tuning.coefficient * allpassOut;
    allpassIn = averaged;
    loop[index] = allpassOut;
    index = (index + 1) % tuning.length;
  }

  fadeOutEnd(output, Math.round(sampleRate * 0.05));
  normalize(output, 0.9);
  return output;
}

// Splits one string-period (in samples) into a whole-sample loop plus a fractional
// all-pass delay. The averaging filter already adds half a sample.
function tuneLoop(periodSamples) {
  let length = Math.floor(periodSamples - 0.5);
  let fraction = periodSamples - 0.5 - length;
  if (fraction < 0.1) {
    // Very small fractions make the all-pass filter misbehave, so borrow one whole sample.
    length -= 1;
    fraction += 1;
  }
  return { length: Math.max(2, length), coefficient: (1 - fraction) / (1 + fraction) };
}

// Fills one string-period with noise, smoothed when the pluck should sound darker.
function createPluckBurst(length, brightness, random) {
  const burst = new Float32Array(length);
  let previous = 0;
  for (let index = 0; index < length; index++) {
    const noise = random() * 2 - 1;
    previous = brightness * noise + (1 - brightness) * previous;
    burst[index] = previous;
  }
  return burst;
}

// Fades the last `count` samples to silence so the note never ends with a click.
function fadeOutEnd(samples, count) {
  const start = Math.max(0, samples.length - count);
  for (let index = start; index < samples.length; index++) {
    samples[index] *= (samples.length - index) / count;
  }
}

// Scales the samples so the loudest one reaches `peak`.
function normalize(samples, peak) {
  let loudest = 0;
  for (const value of samples) loudest = Math.max(loudest, Math.abs(value));
  if (loudest === 0) return;
  const scale = peak / loudest;
  for (let index = 0; index < samples.length; index++) samples[index] *= scale;
}

// ─── Strumming ───

// Works out which strings sound and when, for a chord given as frets low E → high e
// ('x' or null = not played). A down strum goes low → high, an up strum high → low.
export function planStrum(frets, { direction = 'down', speedMs = DEFAULT_STRUM_MS } = {}) {
  const sounding = frets
    .map((fret, stringIndex) => ({ fret, stringIndex }))
    .filter(({ fret }) => Number.isInteger(fret) && fret >= 0);
  if (direction === 'up') sounding.reverse();

  return sounding.map(({ fret, stringIndex }, order) => ({
    stringIndex,
    midi: fretToMidi(stringIndex, fret),
    offsetSeconds: (order * speedMs) / 1000,
  }));
}

// ─── Playback ───

// Rendered notes, kept by MIDI number so each is only generated once.
const bufferCache = new Map();
// Notes still ringing, so a new strum can damp them like a hand on the strings.
let ringingNotes = [];

// Strums a chord. Example: playChord(['x', 3, 2, 0, 1, 0]) plays open C.
export async function playChord(frets, options = {}) {
  const context = await unlockAudio();
  dampRingingNotes(context.currentTime);
  const startTime = context.currentTime + 0.02;
  for (const note of planStrum(frets, options)) {
    playMidi(context, note.midi, startTime + note.offsetSeconds, 0.55);
  }
}

// Plays a single note by MIDI number (used by ear training and the fretboard).
export async function playNote(midi, { delaySeconds = 0, volume = 0.7 } = {}) {
  const context = await unlockAudio();
  playMidi(context, midi, context.currentTime + 0.02 + delaySeconds, volume);
}

// Starts one note at `time` and remembers it until it has finished ringing.
function playMidi(context, midi, time, volume) {
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = getNoteBuffer(context, midi);
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(getMasterOutput());
  source.start(time);

  const note = { source, gain };
  ringingNotes.push(note);
  source.onended = () => {
    ringingNotes = ringingNotes.filter((ringing) => ringing !== note);
  };
}

// Quickly fades out every note still ringing.
function dampRingingNotes(time) {
  for (const { source, gain } of ringingNotes) {
    gain.gain.cancelScheduledValues(time);
    gain.gain.setValueAtTime(gain.gain.value, time);
    gain.gain.linearRampToValueAtTime(0, time + 0.04);
    source.stop(time + 0.05);
  }
  ringingNotes = [];
}

// Returns the audio buffer for a MIDI note, generating it the first time.
function getNoteBuffer(context, midi) {
  if (!bufferCache.has(midi)) {
    // Lower strings ring a little longer and sound a little darker.
    const low = midi < 52;
    const samples = karplusStrong(midiToFrequency(midi), {
      sampleRate: context.sampleRate,
      brightness: low ? 0.5 : 0.65,
      decay: low ? 0.997 : 0.995,
    });
    const buffer = context.createBuffer(1, samples.length, context.sampleRate);
    buffer.copyToChannel(samples, 0);
    bufferCache.set(midi, buffer);
  }
  return bufferCache.get(midi);
}

// Exposed for the browser preview tools: how many notes are ringing right now.
export function countRingingNotes() {
  return ringingNotes.length;
}

// ─── Getting ready ───

// Generates the open-position notes in advance so the first strum has no delay.
export function warmUpGuitarSynth() {
  const context = getAudioContext();
  for (let midi = 40; midi <= 69; midi++) getNoteBuffer(context, midi);
}
