import type { CircularTextHover } from './types';

export const HOVER_SPEED: Record<CircularTextHover, number> = {
  slowDown: 0.5,
  speedUp: 4,
  pause: 0,
  goBonkers: 20,
};

export const MAX_FLING = 1440;

export const clamp = (v: number, a: number, b: number): number =>
  v < a ? a : v > b ? b : v;

export interface LetterLayoutInput {
  glyphs: string[];
  copies: number;
  fill: boolean;
  startAngle: number;
  size: number;
  fontSize: number;
  letterSpacing: number;
  advances: number[] | null;
}

/** Angle (deg) of every letter around the ring, all copies included. */
export function letterAngles(input: LetterLayoutInput): number[] {
  const { glyphs, copies, fill, startAngle, size, fontSize, letterSpacing } =
    input;
  const count = glyphs.length;
  if (!count) return [];
  const total = count * copies;
  if (fill) {
    return Array.from(
      { length: total },
      (_, i) => startAngle + (360 / total) * i,
    );
  }
  const known =
    input.advances && input.advances.length === count ? input.advances : null;
  const toDegrees = 180 / (Math.PI * Math.max(size / 2 - fontSize * 0.6, 1));
  const arcs = glyphs.map((glyph, i) => {
    const width = known
      ? (known[i] ?? 0)
      : fontSize * (glyph === ' ' ? 0.3 : 0.6);
    return Math.max(0, width + letterSpacing * fontSize) * toDegrees;
  });
  const span = arcs.reduce((sum, arc) => sum + arc, 0);
  const fit = span > 0 ? Math.min(1, 360 / (span * copies)) : 1;
  const result: number[] = [];
  for (let copy = 0; copy < copies; copy += 1) {
    let cursor =
      startAngle + (360 / copies) * copy - ((arcs[0] ?? 0) * fit) / 2;
    for (let i = 0; i < count; i += 1) {
      const arc = (arcs[i] ?? 0) * fit;
      result.push(cursor + arc / 2);
      cursor += arc;
    }
  }
  return result;
}

export interface CircularTextMotionState {
  hovering: boolean;
  dragging: boolean;
  fling: number;
  cruise: number;
  angle: number | null;
  travel: number;
  samples: [number, number][];
}
