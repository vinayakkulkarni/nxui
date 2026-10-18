import type { GlitchTextEvent, GlitchTextMode } from './types';

export const MODES: GlitchTextMode[] = ['slices', 'rgb', 'scan', 'noise'];
export const NO_CHARS: string[] = [];
export const GLYPHS = '#%&@$?<>/\\=+*~^!';

const SLICE_STOPS: [number, number][] = [
  [20, 50],
  [10, 60],
  [15, 55],
  [25, 35],
  [30, 40],
  [40, 20],
  [10, 60],
  [15, 55],
  [25, 35],
  [30, 40],
  [20, 50],
  [10, 60],
  [15, 55],
  [25, 35],
  [30, 40],
  [40, 20],
  [20, 50],
  [10, 60],
  [15, 55],
  [25, 35],
  [30, 40],
];

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function bandAt(u: number): [number, number] {
  const x = clamp(u, 0, 1) * (SLICE_STOPS.length - 1);
  const i = Math.min(SLICE_STOPS.length - 2, Math.floor(x));
  const f = x - i;
  const [t0, b0] = SLICE_STOPS[i]!;
  const [t1, b1] = SLICE_STOPS[i + 1]!;
  return [t0 + (t1 - t0) * f, b0 + (b1 - b0) * f];
}

export function pingPong(time: number, period: number): number {
  const p = (time / period) % 2;
  return p < 1 ? 1 - p : p - 1;
}

export function fitBand(top: number, bottom: number): [number, number] {
  const t = clamp(top, 0, 100);
  const b = clamp(bottom, 0, 100);
  return t + b >= 100 ? [0, 100] : [t, b];
}

export function makeEvent(now: number, ms: number): GlitchTextEvent {
  const r = Math.random;
  const sign = () => (r() < 0.5 ? -1 : 1);
  return {
    until: now + ms * (1 + Math.floor(r() * 3)),
    aTop: r() * 80,
    aHeight: 5 + r() * 22,
    bTop: r() * 85,
    bHeight: 3 + r() * 14,
    ax: sign() * (1.3 + r() * 1.5),
    bx: sign() * (1.1 + r() * 1.2),
    ay: (r() - 0.5) * 0.5,
    by: (r() - 0.5) * 0.5,
    skew: sign() * (0.4 + r() * 0.6),
    fresh: true,
  };
}

export function stepLength(speed: number): number {
  return 70 * Math.sqrt(Math.max(0.05, speed) / 0.5);
}
