import type { CurvedLoopGeometry, CurvedLoopShape } from './types';

export const VIEW_WIDTH = 1440;
const VIEW_HEIGHT = 120;
export const MAX_FLING = 4000;
const WAVE_LENGTH = 960;
const RING_RADIUS = 2.2;
const TAU = Math.PI * 2;

export function wrapOffset(value: number, length: number): number {
  return length > 0 ? (((value % length) + length) % length) - length : value;
}

export function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function edgeMask(amount: number, span: number): string | undefined {
  const size = Math.min(Math.max(amount, 0), 1) * 50 * span;
  if (size <= 0) return undefined;
  const start = 50 - span * 50;
  const steps = 10;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const alpha = (t * t * t * (t * (t * 6 - 15) + 10)).toFixed(3);
    left.push(`rgba(0, 0, 0, ${alpha}) ${(start + t * size).toFixed(2)}%`);
    right.unshift(
      `rgba(0, 0, 0, ${alpha}) ${(100 - start - t * size).toFixed(2)}%`,
    );
  }
  return `linear-gradient(to right, ${[...left, ...right].join(', ')})`;
}

function wavePath(amplitude: number, baseline: number): string {
  const from = -100;
  const to = VIEW_WIDTH + 100;
  const k = TAU / WAVE_LENGTH;
  const y = (x: number) =>
    baseline + amplitude * Math.cos(k * (x - VIEW_WIDTH / 2));
  const slope = (x: number) =>
    -amplitude * k * Math.sin(k * (x - VIEW_WIDTH / 2));
  const count = Math.ceil((to - from) / (WAVE_LENGTH / 8));
  const step = (to - from) / count;
  const f = (n: number) => n.toFixed(2);
  let d = `M${f(from)},${f(y(from))}`;
  for (let i = 0; i < count; i++) {
    const x0 = from + i * step;
    const x1 = x0 + step;
    d += ` C${f(x0 + step / 3)},${f(y(x0) + (slope(x0) * step) / 3)} ${f(x1 - step / 3)},${f(y(x1) - (slope(x1) * step) / 3)} ${f(x1)},${f(y(x1))}`;
  }
  return d;
}

export function getGeometry(
  shape: CurvedLoopShape,
  curveAmount: number,
  fontSize: number,
  spacing: number,
): CurvedLoopGeometry {
  if (shape === 'circle') {
    const repeats =
      spacing > 0
        ? Math.max(1, Math.round((TAU * fontSize * RING_RADIUS) / spacing))
        : 1;
    const radius =
      spacing > 0 ? (repeats * spacing) / TAU : fontSize * RING_RADIUS;
    const half = radius + fontSize;
    return {
      d: `M${-radius},0 A${radius},${radius} 0 1,1 ${radius},0 A${radius},${radius} 0 1,1 ${-radius},0`,
      viewBox: `${-half} ${-half} ${half * 2} ${half * 2}`,
      radius,
      repeats,
      span: Math.min(1, (fontSize * (RING_RADIUS + 1) * 2) / VIEW_WIDTH),
    };
  }
  const viewBox = `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`;
  const baseline = VIEW_HEIGHT / 2 + fontSize * 0.36;
  let d = `M-100,40 Q500,${40 + curveAmount} 1540,40`;
  if (shape === 'line')
    d = `M-100,${baseline} L${VIEW_WIDTH + 100},${baseline}`;
  else if (shape === 'wave') d = wavePath(curveAmount * 0.25, baseline);
  return { d, viewBox, radius: 0, repeats: 0, span: 1 };
}
