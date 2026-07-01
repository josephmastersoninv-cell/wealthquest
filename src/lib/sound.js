// Web Audio API sound engine — no external files needed
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(freq, type, duration, volume = 0.3, delay = 0) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    gain.gain.setValueAtTime(0, c.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration);
  } catch {}
}

const ENABLED_KEY = 'wealthquest_sound';
export function isSoundEnabled() {
  return localStorage.getItem(ENABLED_KEY) !== 'false';
}
export function toggleSound() {
  const next = !isSoundEnabled();
  localStorage.setItem(ENABLED_KEY, String(next));
  return next;
}

function play(fn) {
  if (!isSoundEnabled()) return;
  fn();
}

export const sounds = {
  correct() {
    play(() => {
      tone(523, 'sine', 0.12, 0.25);        // C5
      tone(659, 'sine', 0.12, 0.25, 0.1);   // E5
      tone(784, 'sine', 0.18, 0.25, 0.2);   // G5
    });
  },
  wrong() {
    play(() => {
      tone(220, 'sawtooth', 0.15, 0.2);
      tone(180, 'sawtooth', 0.2, 0.15, 0.12);
    });
  },
  flip() {
    play(() => tone(800, 'sine', 0.06, 0.08));
  },
  levelUp() {
    play(() => {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', 0.18, 0.3, i * 0.1));
    });
  },
  coinCollect() {
    play(() => {
      tone(1047, 'sine', 0.08, 0.2);
      tone(1319, 'sine', 0.08, 0.15, 0.07);
    });
  },
  xpBomb() {
    play(() => {
      tone(400, 'sine', 0.05, 0.2);
      tone(600, 'sine', 0.05, 0.25, 0.05);
      tone(900, 'sine', 0.08, 0.3, 0.1);
      tone(1200, 'sine', 0.15, 0.3, 0.16);
    });
  },
  streak() {
    play(() => {
      [523, 587, 659, 698, 784].forEach((f, i) => tone(f, 'triangle', 0.12, 0.2, i * 0.07));
    });
  },
  cardNext() {
    play(() => tone(440, 'sine', 0.05, 0.06));
  },
};
