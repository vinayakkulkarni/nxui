import type { DistortionWaveTheme, WaveFrame } from './types';

export const THEMES: Record<DistortionWaveTheme, string[]> = {
  prism: ['#ff4fb8', '#ff9a3d', '#4f8dff', '#a46bff'],
  meadow: ['#3ddc5a', '#a6f04a', '#1fbf6b', '#6dffb0'],
  lagoon: ['#3aa0ff', '#38e1d0', '#5b6bff', '#7fd4ff'],
  ember: ['#ff6a3d', '#ffc23d', '#ff3d6e', '#ff8f5a'],
};

const HEX = /^#?([\da-f]{6})$/i;

/** Hex colours to 0–1 RGB, always four of them (cycled). */
export function toRgb(list: string[]): [number, number, number][] {
  const parsed = list.flatMap((c): [number, number, number][] => {
    const m = HEX.exec(c.trim());
    if (!m?.[1]) return [];
    const v = Number.parseInt(m[1], 16);
    return [[((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]];
  });
  const base: [number, number, number][] = parsed.length ? parsed : [[1, 1, 1]];
  return [0, 1, 2, 3].map((i) => base[i % base.length] ?? [1, 1, 1]);
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Where the front leaves its source, as a share of the run. */
const LAUNCH = 0.12;

export interface TimelineInput {
  /** Run progress 0–1. */
  u: number;
  /** Seconds since the run began. */
  time: number;
  /** Distance the front must travel to clear the element, CSS px. */
  distance: number;
  /** Width of the bending band at full size, CSS px. */
  band: number;
}

/** The wave at progress `u`: pull, launch, crossing, glow left on the rim. */
export function frameAt(
  { u, time, distance, band }: TimelineInput,
  into: WaveFrame,
): WaveFrame {
  const v = clamp01((u - LAUNCH) / (1 - LAUNCH - 0.1));
  into.pull = smooth(0, 0.07, u) * (1 - smooth(0.09, 0.17, u));
  into.reach = distance * (1 - (1 - v) ** 1.3) - band * 0.5 * (1 - v);
  into.band = band * (0.4 + 0.6 * smooth(0, 0.3, v));
  into.glow = smooth(0, 0.05, v) * (1 - smooth(0.72, 1, v));
  into.rim = smooth(0.12, 0.42, v) * (1 - smooth(0.6, 1, u));
  into.settle = smooth(0.1, 0.8, v);
  into.time = time;
  return into;
}
