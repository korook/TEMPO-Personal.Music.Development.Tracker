// Shared Web Audio setup: one AudioContext and one master volume for the whole app.
// The context is created on first use, because browsers only allow sound after the
// user has interacted with the page.

let audioContext = null;
let masterGain = null;

// ─── Context ───

// Returns the app's single AudioContext, creating it (and the master volume) the first time.
export function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
}

// Returns the node every sound should connect to, so one volume controls everything.
export function getMasterOutput() {
  getAudioContext();
  return masterGain;
}

// Wakes the audio up after a click or key press (browsers start it suspended).
export async function unlockAudio() {
  const context = getAudioContext();
  if (context.state === 'suspended') await context.resume();
  return context;
}

// Returns the audio clock in seconds. All sound timing is measured on this clock.
export function audioNow() {
  return getAudioContext().currentTime;
}
