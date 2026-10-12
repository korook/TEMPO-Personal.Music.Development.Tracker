// Shared Web Audio context. Created on first use, because browsers only allow
// audio to start after the user has interacted with the page.

let audioContext = null;

// ─── Context ───

// Returns the app's single AudioContext, creating it the first time.
export function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}
