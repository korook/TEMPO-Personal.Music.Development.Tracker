// The metronome (TEMPO_PLAN.md section 7), built on Web Audio lookahead scheduling:
// a steady ticker wakes up every 25 ms and books every click due in the next 100 ms
// on the audio clock. Click times are worked out from a fixed starting point
// (start + n × pulse length), so small timer delays never add up to drift.
//
// Features: 30–240 BPM, 2/4 3/4 4/4 6/8, subdivisions, accent on/off, three sounds,
// tap tempo, speed trainer and chord-change mode.
//
// createMetronome() is the timing core with no browser parts, so tests can run it
// on a fake clock. The app uses the shared instance from getMetronome().

import { getAudioContext, getMasterOutput, unlockAudio } from './engine.js';

export const MIN_BPM = 30;
export const MAX_BPM = 240;
const TICK_MS = 25;
const LOOKAHEAD_SECONDS = 0.1;
const START_DELAY_SECONDS = 0.05;
const RESYNC_AFTER_SECONDS = 0.2;

// Beats per bar for each time signature, and which beats get a lighter accent.
// In 6/8 the metronome counts eighth notes: 6 per bar, accents on 1 and a lighter one on 4.
export const TIME_SIGNATURES = {
  '2/4': { beats: 2, secondaryAccents: [] },
  '3/4': { beats: 3, secondaryAccents: [] },
  '4/4': { beats: 4, secondaryAccents: [] },
  '6/8': { beats: 6, secondaryAccents: [3] },
};

// Clicks per beat: 1 = beats only, 2 = eighths, 3 = triplets, 4 = sixteenths.
export const SUBDIVISIONS = [1, 2, 3, 4];

// ─── Timing core ───

// Builds a metronome that books clicks with `playClick(time, kind)` on the clock `now()`.
// `timer` calls back regularly (start/stop); `onPulse(pulse)` hears about each booked click.
export function createMetronome({ now, playClick, timer, onPulse = () => {} }) {
  const settings = {
    bpm: 80,
    timeSignature: '4/4',
    subdivision: 1,
    accent: true,
    sound: 'click',
    speedTrainer: { enabled: false, stepBpm: 5, everyBars: 4, targetBpm: 120 },
    chordChange: { enabled: false, chords: [], everyBeats: 4 },
  };
  const position = {
    running: false,
    anchorTime: 0,
    pulsesSinceAnchor: 0,
    pulseInBar: 0,
    bar: 0,
    beatCount: 0,
  };
  const stats = { pulses: 0, latePulses: 0, resyncs: 0 };

  // Returns the length of one click (beat or subdivision) in seconds.
  function pulseSeconds() {
    return 60 / settings.bpm / settings.subdivision;
  }

  // Returns the audio time of the next click to book.
  function nextPulseTime() {
    return position.anchorTime + position.pulsesSinceAnchor * pulseSeconds();
  }

  // Starts counting again from `time`, so a tempo change takes effect without a jump.
  function reanchor(time) {
    position.anchorTime = time;
    position.pulsesSinceAnchor = 0;
  }

  // Books every click that falls inside the lookahead window. Called by the timer.
  function scheduleAhead() {
    if (!position.running) return;
    const current = now();
    if (nextPulseTime() < current - RESYNC_AFTER_SECONDS) {
      // The page was frozen (e.g. the laptop slept). Skip the missed clicks and carry on.
      stats.resyncs++;
      reanchor(current + START_DELAY_SECONDS);
    }
    while (nextPulseTime() < current + LOOKAHEAD_SECONDS) {
      bookPulse(nextPulseTime(), current);
    }
  }

  // Books one click at `time` and moves the position on by one click.
  function bookPulse(time, current) {
    const meter = TIME_SIGNATURES[settings.timeSignature];
    const isBeat = position.pulseInBar % settings.subdivision === 0;
    const beatInBar = Math.floor(position.pulseInBar / settings.subdivision);

    if (isBeat && beatInBar === 0 && position.bar > 0) applySpeedTrainer(time);

    const pulse = {
      time,
      bar: position.bar,
      beatInBar,
      pulseInBar: position.pulseInBar,
      isBeat,
      kind: clickKind(isBeat, beatInBar, meter),
      bpm: settings.bpm,
      chord: isBeat ? chordForBeat(position.beatCount) : null,
    };

    if (time < current) stats.latePulses++;
    stats.pulses++;
    playClick(time, pulse.kind, settings.sound);
    onPulse(pulse);
    advance(meter, isBeat);
  }

  // Moves to the next click, rolling over into the next bar when the bar is full.
  function advance(meter, isBeat) {
    if (isBeat) position.beatCount++;
    position.pulsesSinceAnchor++;
    position.pulseInBar++;
    if (position.pulseInBar >= meter.beats * settings.subdivision) {
      position.pulseInBar = 0;
      position.bar++;
    }
  }

  // Decides how a click sounds: "accent" on beat 1, "secondary" on 6/8 beat 4, "beat", or a quiet "sub".
  function clickKind(isBeat, beatInBar, meter) {
    if (!isBeat) return 'sub';
    if (!settings.accent) return 'beat';
    if (beatInBar === 0) return 'accent';
    if (meter.secondaryAccents.includes(beatInBar)) return 'secondary';
    return 'beat';
  }

  // At the start of a bar, raises the tempo if the speed trainer says it's time.
  function applySpeedTrainer(barStartTime) {
    const trainer = settings.speedTrainer;
    if (!trainer.enabled || settings.bpm >= trainer.targetBpm) return;
    if (position.bar % trainer.everyBars !== 0) return;
    settings.bpm = Math.min(trainer.targetBpm, settings.bpm + trainer.stepBpm);
    reanchor(barStartTime);
  }

  // In chord-change mode, returns { current, next, changesNow } for a beat; otherwise null.
  function chordForBeat(beatCount) {
    const mode = settings.chordChange;
    if (!mode.enabled || mode.chords.length === 0) return null;
    const step = Math.floor(beatCount / mode.everyBeats);
    return {
      current: mode.chords[step % mode.chords.length],
      next: mode.chords[(step + 1) % mode.chords.length],
      changesNow: beatCount % mode.everyBeats === 0,
      beatsLeft: mode.everyBeats - (beatCount % mode.everyBeats),
    };
  }

  // ─── Controls ───

  // Starts clicking a moment from now, from beat 1 of bar 1.
  function start() {
    if (position.running) return;
    Object.assign(position, { running: true, pulseInBar: 0, bar: 0, beatCount: 0 });
    reanchor(now() + START_DELAY_SECONDS);
    timer.start(scheduleAhead);
    scheduleAhead();
  }

  // Stops clicking. Clicks already booked in the next 100 ms may still sound.
  function stop() {
    position.running = false;
    timer.stop();
  }

  // Sets the tempo, kept between 30 and 240 BPM. Takes effect from the next unbooked click.
  function setBpm(bpm) {
    const clamped = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(bpm)));
    if (clamped === settings.bpm) return;
    if (position.running) reanchor(nextPulseTime());
    settings.bpm = clamped;
  }

  // Changes the time signature and starts a new bar on the next click.
  function setTimeSignature(timeSignature) {
    if (!TIME_SIGNATURES[timeSignature]) throw new Error(`Unknown time signature "${timeSignature}".`);
    settings.timeSignature = timeSignature;
    restartBar();
  }

  // Changes clicks per beat and starts a new bar on the next click.
  function setSubdivision(subdivision) {
    if (!SUBDIVISIONS.includes(subdivision)) throw new Error(`Unknown subdivision "${subdivision}".`);
    if (position.running) reanchor(nextPulseTime());
    settings.subdivision = subdivision;
    restartBar();
  }

  // Puts the count back to beat 1 (used when the bar shape changes).
  function restartBar() {
    if (position.pulseInBar !== 0) position.bar++;
    position.pulseInBar = 0;
  }

  // Changes one or more plain settings: accent, sound, speedTrainer, chordChange.
  function configure(changes) {
    if ('accent' in changes) settings.accent = Boolean(changes.accent);
    if ('sound' in changes) settings.sound = changes.sound;
    if (changes.speedTrainer) settings.speedTrainer = { ...settings.speedTrainer, ...changes.speedTrainer };
    if (changes.chordChange) settings.chordChange = { ...settings.chordChange, ...changes.chordChange };
  }

  return {
    start,
    stop,
    toggle: () => (position.running ? stop() : start()),
    setBpm,
    adjustBpm: (delta) => setBpm(settings.bpm + delta),
    setTimeSignature,
    setSubdivision,
    configure,
    isRunning: () => position.running,
    getSettings: () => ({ ...settings }),
    getStats: () => ({ ...stats }),
    scheduleAhead,
  };
}

// ─── Tap tempo ───

// Builds a tap-tempo counter: call tap(ms) on each tap; it returns a BPM once there are 2+ taps.
export function createTapTempo({ maxTaps = 5, resetAfterMs = 2000 } = {}) {
  let taps = [];

  // Records a tap at `timeMs` and returns the BPM from the recent taps (or null).
  function tap(timeMs) {
    if (taps.length > 0 && timeMs - taps[taps.length - 1] > resetAfterMs) taps = [];
    taps.push(timeMs);
    if (taps.length > maxTaps) taps.shift();
    if (taps.length < 2) return null;
    const averageGap = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
    return Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(60000 / averageGap)));
  }

  return { tap, reset: () => { taps = []; } };
}

// ─── Browser timer ───

// The ticker that runs inside a Web Worker. Timers in a worker keep steady time when the
// tab is in the background, unlike page timers, which browsers slow to once a second.
// It is built from this text (not a separate file) so it also works when a preview is
// opened straight from the Finder.
const TICKER_WORKER_CODE = `
  let intervalId = null;
  self.onmessage = (event) => {
    clearInterval(intervalId);
    if (event.data.start) intervalId = setInterval(() => self.postMessage('tick'), event.data.start);
  };
`;

// Returns a timer that calls back every 25 ms, from a Web Worker when the browser allows
// it and from a normal page timer otherwise (or if the worker fails later).
function createWorkerTimer() {
  let worker = null;
  let fallbackId = null;
  let callback = null;
  let running = false;

  // Switches to a page timer, keeping the ticks going if the worker can't run.
  const useFallback = () => {
    if (worker) worker.terminate();
    worker = null;
    if (running && fallbackId === null) fallbackId = setInterval(() => callback && callback(), TICK_MS);
  };

  try {
    const url = URL.createObjectURL(new Blob([TICKER_WORKER_CODE], { type: 'text/javascript' }));
    worker = new Worker(url);
    worker.onmessage = () => callback && callback();
    worker.onerror = useFallback;
  } catch {
    worker = null;
  }

  return {
    start(onTick) {
      callback = onTick;
      running = true;
      if (worker) worker.postMessage({ start: TICK_MS });
      else useFallback();
    },
    stop() {
      running = false;
      if (worker) worker.postMessage({ stop: true });
      clearInterval(fallbackId);
      fallbackId = null;
    },
  };
}

// ─── Click sounds ───

// Pitch and loudness of each click kind.
const CLICK_LEVELS = {
  accent: { pitch: 1.5, volume: 0.9 },
  secondary: { pitch: 1.2, volume: 0.7 },
  beat: { pitch: 1, volume: 0.6 },
  sub: { pitch: 1, volume: 0.25 },
};

// The three click sounds: oscillator shape, base frequency and length.
export const CLICK_SOUNDS = {
  click: { name: 'Click', wave: 'sine', frequency: 1000, seconds: 0.05 },
  wood: { name: 'Woodblock', wave: 'triangle', frequency: 800, seconds: 0.035 },
  beep: { name: 'Beep', wave: 'square', frequency: 440, seconds: 0.07 },
};

// Plays one click at the exact audio time `time`.
function playClickSound(time, kind, soundId) {
  const context = getAudioContext();
  const sound = CLICK_SOUNDS[soundId] || CLICK_SOUNDS.click;
  const level = CLICK_LEVELS[kind];
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = sound.wave;
  oscillator.frequency.value = sound.frequency * level.pitch;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(level.volume * (sound.wave === 'square' ? 0.35 : 1), time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + sound.seconds);
  oscillator.connect(gain);
  gain.connect(getMasterOutput());
  oscillator.start(time);
  oscillator.stop(time + sound.seconds + 0.01);
}

// ─── Shared app metronome ───

let sharedMetronome = null;
const pulseListeners = new Set();
const pendingPulses = [];
let frameRequested = false;

// Returns the app's metronome, creating it on first use.
export function getMetronome() {
  if (!sharedMetronome) {
    sharedMetronome = createMetronome({
      now: () => getAudioContext().currentTime,
      playClick: playClickSound,
      timer: createWorkerTimer(),
      onPulse: queuePulseForDisplay,
    });
  }
  return sharedMetronome;
}

// Starts or stops the shared metronome, waking the audio first if needed.
export async function toggleMetronome() {
  await unlockAudio();
  getMetronome().toggle();
}

// Registers `listener(pulse)`, called when each click actually sounds (for flashing lights).
// Returns a function that removes the listener.
export function onPulseHeard(listener) {
  pulseListeners.add(listener);
  return () => pulseListeners.delete(listener);
}

// Holds a booked click until its audio time arrives, then tells the listeners.
function queuePulseForDisplay(pulse) {
  pendingPulses.push(pulse);
  if (!frameRequested) {
    frameRequested = true;
    requestAnimationFrame(deliverDuePulses);
  }
}

// Each animation frame, hands over every click whose time has come.
function deliverDuePulses() {
  const current = getAudioContext().currentTime;
  while (pendingPulses.length > 0 && pendingPulses[0].time <= current) {
    const pulse = pendingPulses.shift();
    pulseListeners.forEach((listener) => listener(pulse));
  }
  frameRequested = pendingPulses.length > 0;
  if (frameRequested) requestAnimationFrame(deliverDuePulses);
}
