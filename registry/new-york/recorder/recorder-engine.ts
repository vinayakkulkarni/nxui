import type { RecorderGlyph, RecorderMode, RecorderVoice } from './types';

/* ---------------------------------------------------------------- motion -- */

export const PRESS = {
  type: 'spring',
  stiffness: 1100,
  damping: 42,
  mass: 0.5,
} as const;
export const RELEASE = {
  type: 'spring',
  stiffness: 600,
  damping: 15,
  mass: 0.6,
} as const;
export const SPRING = { type: 'spring', stiffness: 420, damping: 32 } as const;
export const SOFT = { type: 'spring', stiffness: 170, damping: 22 } as const;
const ROLL = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.8,
} as const;
const MORPH = { type: 'spring', stiffness: 460, damping: 24 } as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;

/* blur rides an eased tween beside the spring: a spring would overshoot below blur(0) */
const BLUR_EASE = { type: 'tween', duration: 0.3, ease: 'easeOut' } as const;
export const ROLL_BLUR = { ...ROLL, filter: BLUR_EASE } as const;
export const SPRING_BLUR = { ...SPRING, filter: BLUR_EASE } as const;
export const MORPH_BLUR = { ...MORPH, filter: BLUR_EASE } as const;
export const INSTANT = { duration: 0 } as const;

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));
export const pad2 = (n: number): string => String(n).padStart(2, '0');

/* -------------------------------------------------------------- geometry -- */

/** The card is authored at 700 × 700 and scaled to fit. */
export const SIZE = 700;

/** A radius-200 superellipse (n = 4). */
function squirclePath(
  w: number,
  h: number,
  r: number,
  inset = 0,
  steps = 28,
): string {
  const pts: string[] = [];
  const centers: Array<[number, number]> = [
    [w - r, r],
    [r, r],
    [r, h - r],
    [w - r, h - r],
  ];
  centers.forEach(([cx, cy], q) => {
    for (let i = 0; i <= steps; i++) {
      const t = ((q + i / steps) * Math.PI) / 2;
      const c = Math.cos(t);
      const s = Math.sin(t);
      const x = cx + r * Math.sign(c) * Math.sqrt(Math.abs(c));
      const y = cy - r * Math.sign(s) * Math.sqrt(Math.abs(s));
      pts.push(`${(x + inset).toFixed(2)} ${(y + inset).toFixed(2)}`);
    }
  });
  return `M${pts.join('L')}Z`;
}

export const CLIP = `path("${squirclePath(SIZE, SIZE, 200)}")`;
export const RIM = squirclePath(SIZE - 2, SIZE - 2, 199, 1);

/* -------------------------------------------------------------- waveform -- */

/** Seconds per bar. */
export const BAR_DT = 0.1;
export const PITCH = 10;
export const HEAD_X = 380;
export const BAR_OFFSET = 11.5;
const MIN_H = 4;
export const MAX_H = 340;
export const COLLAPSE_MS = 460;
export const RIPPLE_MS = 700;
export const POOL = Math.ceil(SIZE / PITCH) + 12;

/** x positions of the dotted track to the right of the playhead. */
export const DOT_XS: number[] = Array.from(
  { length: Math.floor((672 - 392) / 9) + 1 },
  (_, i) => 392 + i * 9,
);

/** A damped spring from 0 → 1 as a bar is born. */
export const grow = (age: number): number =>
  age >= 0.7 ? 1 : Math.max(0, 1 - Math.exp(-age * 14) * Math.cos(age * 20));

/** Generated "speech": words with a rise-and-fall envelope, then pauses. */
export function nextHeight(voice: RecorderVoice): number {
  if (voice.i >= voice.len) {
    voice.speaking = !voice.speaking;
    voice.i = 0;
    voice.len = voice.speaking
      ? 4 + Math.floor(Math.random() * 7)
      : 2 + Math.floor(Math.random() * 5);
    voice.peak = 0.55 + Math.random() * 0.45;
  }
  const u = (voice.i + 0.5) / voice.len;
  voice.i++;
  if (!voice.speaking) return MIN_H + Math.random() * 8;
  const env = Math.pow(Math.sin(Math.PI * u), 0.6);
  const a = clamp(env * voice.peak * (0.55 + Math.random() * 0.45), 0.02, 1);
  return MIN_H + Math.pow(a, 1.3) * (MAX_H - MIN_H);
}

/* ---------------------------------------------------------------- labels -- */

export const LABELS: Record<RecorderMode, string> = {
  idle: 'READY',
  recording: 'REC',
  paused: 'PAUSED',
  saved: 'SAVED',
  playing: 'PLAY',
};

/** The status dot's fill per mode; recording and paused keep the stylesheet's red gradient. */
export const DOT_STYLE: Record<RecorderMode, Record<string, string>> = {
  idle: { background: 'var(--prec-dot-idle)' },
  recording: {},
  paused: {},
  saved: { background: 'var(--prec-dot-saved)' },
  playing: { background: 'var(--prec-dot-play)' },
};
export const MAIN_GLYPH: Record<RecorderMode, RecorderGlyph> = {
  idle: 'rec',
  recording: 'pause',
  paused: 'rec',
  saved: 'play',
  playing: 'pause',
};

export const SIDE_GLYPH: Record<RecorderMode, RecorderGlyph> = {
  idle: 'stop',
  recording: 'stop',
  paused: 'stop',
  saved: 'clear',
  playing: 'stop',
};

export const MAIN_LABEL: Record<RecorderMode, string> = {
  idle: 'Record',
  recording: 'Pause',
  paused: 'Resume recording',
  saved: 'Play',
  playing: 'Pause playback',
};
