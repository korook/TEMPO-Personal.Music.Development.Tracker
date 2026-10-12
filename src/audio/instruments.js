// Sounds for ear training (TEMPO_PLAN.md section 8): the same notes in four timbres
// (clean guitar, distorted guitar, piano, synth) so the ear learns the music, not the
// sound; a short click for rhythms; and a mixing loop for the producer's-ear game.
// Everything is scheduled on the audio clock.

import { getAudioContext, getMasterOutput, unlockAudio } from './engine.js';
import { karplusStrong } from './guitar-synth.js';
import { midiToFrequency } from '../theory/notes.js';

// The timbres the ear games rotate through.
export const TIMBRES = {
  guitar: 'Clean guitar',
  distorted: 'Distorted guitar',
  piano: 'Piano',
  synth: 'Synth',
};

const pluckCache = new Map();
let currentSources = [];

// ─── Playing notes ───

// Plays a list of events: [{ midis: [..], at: seconds from now, duration }].
// Returns the number of seconds until the last note ends.
export async function playEvents(events, timbre = 'guitar') {
  const context = await unlockAudio();
  stopAll();
  const start = context.currentTime + 0.05;
  let end = 0;
  for (const event of events) {
    for (const midi of event.midis) {
      playTone(context, midi, start + event.at, event.duration || 1, timbre, event.volume || 0.5);
    }
    end = Math.max(end, event.at + (event.duration || 1));
  }
  return end;
}

// Stops everything the ear games are playing (used when moving to the next question).
export function stopAll() {
  const context = getAudioContext();
  for (const source of currentSources) {
    try {
      source.stop(context.currentTime + 0.02);
    } catch {
      // already stopped
    }
  }
  currentSources = [];
}

// Plays one note in a timbre at audio time `time`.
function playTone(context, midi, time, duration, timbre, volume) {
  if (timbre === 'piano') return playPiano(context, midi, time, duration, volume);
  if (timbre === 'synth') return playSynth(context, midi, time, duration, volume);
  return playPluck(context, midi, time, duration, volume, timbre === 'distorted');
}

// Guitar: a Karplus-Strong pluck; the distorted one goes through a soft-clipping curve.
function playPluck(context, midi, time, duration, volume, distorted) {
  const source = context.createBufferSource();
  source.buffer = pluckBuffer(context, midi);
  const gain = context.createGain();
  gain.gain.setValueAtTime(volume, time);
  gain.gain.setTargetAtTime(0, time + duration, 0.08);
  let output = source;
  if (distorted) {
    const shaper = context.createWaveShaper();
    shaper.curve = distortionCurve();
    const tone = context.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 3200;
    source.connect(shaper);
    shaper.connect(tone);
    output = tone;
    gain.gain.setValueAtTime(volume * 0.45, time);
  }
  output.connect(gain);
  gain.connect(getMasterOutput());
  source.start(time);
  source.stop(time + duration + 0.6);
  currentSources.push(source);
}

// Piano: a few sine partials with a quick attack and a long fade.
function playPiano(context, midi, time, duration, volume) {
  const frequency = midiToFrequency(midi);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume * 0.6, time + 0.008);
  gain.gain.exponentialRampToValueAtTime(volume * 0.18, time + 0.4);
  gain.gain.setTargetAtTime(0.0001, time + duration, 0.12);
  gain.connect(getMasterOutput());
  [[1, 1], [2, 0.35], [3, 0.12], [4, 0.06]].forEach(([multiple, level]) => {
    const oscillator = context.createOscillator();
    const partialGain = context.createGain();
    oscillator.frequency.value = frequency * multiple;
    partialGain.gain.value = level;
    oscillator.connect(partialGain);
    partialGain.connect(gain);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.8);
    currentSources.push(oscillator);
  });
}

// Synth: a sawtooth through a closing low-pass filter.
function playSynth(context, midi, time, duration, volume) {
  const oscillator = context.createOscillator();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = midiToFrequency(midi);
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, time);
  filter.frequency.exponentialRampToValueAtTime(700, time + 0.6);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume * 0.3, time + 0.02);
  gain.gain.setTargetAtTime(0.0001, time + duration, 0.06);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(getMasterOutput());
  oscillator.start(time);
  oscillator.stop(time + duration + 0.5);
  currentSources.push(oscillator);
}

// Returns (and caches) a plucked-string buffer for a MIDI note.
function pluckBuffer(context, midi) {
  if (!pluckCache.has(midi)) {
    const samples = karplusStrong(midiToFrequency(midi), { sampleRate: context.sampleRate, seconds: 2.5 });
    const buffer = context.createBuffer(1, samples.length, context.sampleRate);
    buffer.copyToChannel(samples, 0);
    pluckCache.set(midi, buffer);
  }
  return pluckCache.get(midi);
}

// A soft-clipping curve for the distorted guitar.
let curve = null;
function distortionCurve() {
  if (!curve) {
    curve = new Float32Array(1024);
    for (let index = 0; index < curve.length; index++) {
      const x = (index / (curve.length - 1)) * 2 - 1;
      curve[index] = Math.tanh(x * 6);
    }
  }
  return curve;
}

// ─── Rhythm clicks ───

// Plays clicks at the given times (seconds from now); accented ones are higher.
// Returns the audio time the first click is scheduled for, so taps can be compared to it.
export async function playClicks(times, accented = []) {
  const context = await unlockAudio();
  const start = context.currentTime + 0.1;
  times.forEach((at, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = accented.includes(index) ? 1500 : 1000;
    gain.gain.setValueAtTime(0.0001, start + at);
    gain.gain.exponentialRampToValueAtTime(0.5, start + at + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + at + 0.05);
    oscillator.connect(gain);
    gain.connect(getMasterOutput());
    oscillator.start(start + at);
    oscillator.stop(start + at + 0.06);
    currentSources.push(oscillator);
  });
  return start;
}

// ─── Producer's-ear loop ───

// Plays a short loop (a chord pad over noise and a kick) with one frequency band boosted
// by 9 dB, or flat when `boostHz` is null. Returns the loop length in seconds.
export async function playMixLoop(boostHz, seconds = 3.2) {
  const context = await unlockAudio();
  stopAll();
  const start = context.currentTime + 0.05;
  const eq = context.createBiquadFilter();
  eq.type = 'peaking';
  eq.frequency.value = boostHz || 1000;
  eq.Q.value = 1.4;
  eq.gain.value = boostHz ? 9 : 0;
  const bus = context.createGain();
  bus.gain.value = 0.5;
  eq.connect(bus);
  bus.connect(getMasterOutput());

  // Noise for the highs.
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer(context, seconds);
  const noiseGain = context.createGain();
  noiseGain.gain.value = 0.06;
  noise.connect(noiseGain);
  noiseGain.connect(eq);
  noise.start(start);
  noise.stop(start + seconds);
  currentSources.push(noise);

  // A chord pad for the mids (C major across octaves).
  for (const midi of [36, 48, 55, 60, 64, 67, 72, 76]) {
    const oscillator = context.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = midiToFrequency(midi);
    const gain = context.createGain();
    gain.gain.value = 0.025;
    oscillator.connect(gain);
    gain.connect(eq);
    oscillator.start(start);
    oscillator.stop(start + seconds);
    currentSources.push(oscillator);
  }

  // A kick on every beat for the lows.
  for (let beat = 0; beat < seconds / 0.5; beat++) {
    const time = start + beat * 0.5;
    const kick = context.createOscillator();
    const gain = context.createGain();
    kick.frequency.setValueAtTime(110, time);
    kick.frequency.exponentialRampToValueAtTime(45, time + 0.15);
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
    kick.connect(gain);
    gain.connect(eq);
    kick.start(time);
    kick.stop(time + 0.3);
    currentSources.push(kick);
  }
  return seconds;
}

// Returns a buffer of white noise.
function noiseBuffer(context, seconds) {
  const buffer = context.createBuffer(1, Math.round(context.sampleRate * seconds), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
  return buffer;
}
