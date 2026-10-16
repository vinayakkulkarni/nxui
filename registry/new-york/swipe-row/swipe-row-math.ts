/** Pixels the pointer must travel horizontally before the row grabs. */
export const HYST = 10;
/** Release velocity (px/s) that counts as a flick. */
export const FLICK = 110;
/** Velocity clamp for the flick spring (px/s). */
export const VMAX = 1500;
const DECEL = 0.998;

export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Rubber-band an overshoot `o` against dimension `dim` with constant `c`. */
export function rubber(o: number, dim: number, c: number): number {
  return (o * dim * c) / (dim + c * Math.abs(o));
}

/** Inverse of `rubber`. */
export function unrubber(y: number, dim: number, c: number): number {
  return (y * dim) / (c * Math.max(1, dim - Math.abs(y)));
}

/** Where a release at velocity `v` (px/s) would coast to. */
export function project(v: number): number {
  return ((v / 1000) * DECEL) / (1 - DECEL);
}

/** Velocity (px/s) across the sampled pointer history. */
export function velocityOf(hist: Array<[number, number]>): number {
  if (hist.length < 2) return 0;
  const a = hist[0]!;
  const b = hist[hist.length - 1]!;
  return ((b[1] - a[1]) / Math.max(1, b[0] - a[0])) * 1000;
}

/** Readable foreground (near-black or white) for a hex background. */
export function onColor(hex: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) return '#ffffff';
  const h = m[1].length === 3 ? [...m[1]].map((ch) => ch + ch).join('') : m[1];
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#111111' : '#ffffff';
}
