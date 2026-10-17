import type { BeeswarmChartScale } from './types';

/** Median of a list of numbers. Returns 0 for an empty list. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/**
 * Linear x scale with an optional axis break. Values up to `breakAt` use most
 * of the width; values past it are squeezed into a short segment after the
 * `//` mark, so one far outlier does not flatten the rest of the swarm.
 */
export function createScale(
  domain: [number, number],
  width: number,
  breakAt?: number,
): BeeswarmChartScale {
  const [min, max] = domain;
  const pad = 4;
  const hasBreak = breakAt !== undefined && breakAt > min && breakAt < max;
  const mainEnd = hasBreak ? width * 0.79 : width - pad;
  const breakX = hasBreak ? width * 0.84 : mainEnd;
  const tailStart = width * 0.87;
  const tailEnd = width * 0.93;
  const mainMax = hasBreak ? breakAt : max;

  function x(value: number): number {
    const clamped = Math.min(Math.max(value, min), max);
    if (!hasBreak || clamped <= mainMax) {
      const span = mainMax - min || 1;
      return pad + ((clamped - min) / span) * (mainEnd - pad);
    }
    const span = max - mainMax || 1;
    return tailStart + ((clamped - mainMax) / span) * (tailEnd - tailStart);
  }

  return { x, hasBreak, breakX, mainMax };
}

/**
 * Deterministic beeswarm dodge. Dots are placed in order of x; each one takes
 * the smallest vertical offset (closest to the axis) where it does not touch a
 * dot that is already placed. Returns offsets in the input order.
 */
export function dodge(xs: number[], diameter: number): number[] {
  const order = xs
    .map((x, index) => ({ x, index }))
    .sort((a, b) => a.x - b.x || a.index - b.index);
  const offsets = Array.from<number>({ length: xs.length }).fill(0);
  const placed: { x: number; y: number }[] = [];
  const d2 = diameter * diameter;

  function collides(x: number, y: number): boolean {
    return placed.some((p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      return dx * dx + dy * dy < d2 - 1e-6;
    });
  }

  for (const { x, index } of order) {
    const near = placed.filter((p) => Math.abs(p.x - x) < diameter);
    const candidates = [0];
    for (const p of near) {
      const dy = Math.sqrt(d2 - (p.x - x) ** 2);
      candidates.push(p.y + dy, p.y - dy);
    }
    // Closest to the axis first; ties go below, then above, for a stable shape.
    candidates.sort((a, b) => Math.abs(a) - Math.abs(b) || b - a);
    const y = candidates.find((c) => !collides(x, c)) ?? 0;
    placed.push({ x, y });
    offsets[index] = y;
  }
  return offsets;
}
