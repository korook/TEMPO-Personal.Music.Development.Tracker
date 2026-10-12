// A tiny Web Worker that sends a "tick" every few milliseconds.
// Timers in a worker keep running steadily when the tab is in the background,
// unlike page timers, which browsers slow down to once a second.

let intervalId = null;

// ─── Messages ───

// Starts ticking on { start: intervalMs } and stops on { stop: true }.
self.onmessage = (event) => {
  const message = event.data;
  if (message.start) {
    clearInterval(intervalId);
    intervalId = setInterval(() => self.postMessage('tick'), message.start);
  }
  if (message.stop) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
