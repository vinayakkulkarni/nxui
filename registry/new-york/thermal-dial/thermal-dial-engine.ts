import { transform } from 'motion-v';
import type { ThermalDialSeason, ThermalDialTick } from './types';

/** Tick count on the ring. */
export const TICK_COUNT = 96;
/** Sweep, in degrees from 12 o'clock, clockwise. */
const A0 = -115;
const A1 = 115;
const GAP_HALF = (360 - (A1 - A0)) / 2;
/** Dial geometry in the 440 × 458 card space. */
export const VIEW_W = 440;
export const VIEW_H = 458;
export const CX = 220;
export const CY = 322;
export const R = 166;
export const NEEDLE_TOP = CY - R - 16;
export const NEEDLE_LEN = 100;
/** How long the outgoing season letters take, in ms. */
export const SEASON_OUT_MS = 160;

export function seasonFor(v: number): ThermalDialSeason {
  if (v < 5) return 'Winter';
  if (v < 16) return 'Autumn';
  if (v < 26) return 'Spring';
  return 'Summer';
}

/* the heat palette: cold blue → amber → summer red, by absolute temperature */
const STOPS = [-9, 8, 22, 38, 70];
export const heatC1 = transform(STOPS, [
  '#1d4ed8',
  '#0e7490',
  '#c2410c',
  '#e01e0b',
  '#b3071f',
]);
export const heatC2 = transform(STOPS, [
  '#3b82f6',
  '#22d3ee',
  '#f59e0b',
  '#ff6410',
  '#ff3d1a',
]);
export const heatC3 = transform(STOPS, [
  '#bfdbfe',
  '#a5f3fc',
  '#fde68a',
  '#ffc24a',
  '#ffb347',
]);

export const TICKS: ThermalDialTick[] = Array.from(
  { length: TICK_COUNT },
  (_, i) => {
    const tf = i / (TICK_COUNT - 1);
    const a = A0 + tf * (A1 - A0);
    return {
      tf,
      transform: `rotate(${a.toFixed(2)} ${CX} ${CY})`,
      /* both ends of the arc dissolve into the heat */
      edge: 1 - Math.pow(Math.abs(a) / 120, 4),
    };
  },
);

export function clampTo(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function angleFor(v: number, min: number, max: number): number {
  return A0 + ((v - min) / (max - min)) * (A1 - A0);
}

/** Pointer position (in dial units, relative to the centre) → reading. */
export function valueFromPoint(
  x: number,
  y: number,
  min: number,
  max: number,
): number {
  let a = (Math.atan2(x, -y) * 180) / Math.PI; // 0 = up, clockwise positive
  if (a > A1) a = a < A1 + GAP_HALF ? A1 : A0; // snap across the gap
  if (a < A0) a = a > A0 - GAP_HALF ? A0 : A1;
  return min + ((a - A0) / (A1 - A0)) * (max - min);
}

/** Splits a reading into the leading slot (sign + all but the last digit) and the last digit. */
export function digitsFor(n: number): [string, string] {
  const s = String(Math.abs(n));
  return [(n < 0 ? '−' : '') + s.slice(0, -1), s.slice(-1)];
}
