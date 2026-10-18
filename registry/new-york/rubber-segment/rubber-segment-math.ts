import type {
  RubberSegmentSample,
  RubberSegmentSize,
  RubberSegmentSizePreset,
  RubberSegmentSlot,
} from './types';

export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
export const SPRING_UI = { type: 'spring' as const, duration: 0.3, bounce: 0 };
export const SPRING_MOMENTUM = {
  type: 'spring' as const,
  duration: 0.4,
  bounce: 0.2,
};
export const SPRING_RELAX = {
  type: 'spring' as const,
  duration: 0.16,
  bounce: 0,
};
export const DILATE = 0.19;
export const HANDOFF = 0.15;
export const FLICK = 110;
export const MAX_VELOCITY = 2000;
export const DEADZONE = 4;
export const SLOP = 10;
const RUBBER = 0.55;

export const SIZES: Record<RubberSegmentSize, RubberSegmentSizePreset> = {
  sm: { height: 28, font: 12, pad: 10, min: 36 },
  md: { height: 36, font: 13, pad: 14, min: 44 },
  lg: { height: 44, font: 14, pad: 18, min: 48 },
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function rubber(over: number, dim: number): number {
  return (over * dim * RUBBER) / (dim + RUBBER * Math.abs(over));
}

export function project(v: number, glide: number): number {
  const d = 1 - 0.1 * Math.pow(0.05, glide / 100);
  return ((v / 1000) * d) / (1 - d);
}

export function velocityOf(hist: RubberSegmentSample[], now: number): number {
  const recent = hist.filter(([t]) => now - t <= 100);
  const first = recent[0];
  const last = recent[recent.length - 1];
  if (recent.length < 2 || !first || !last) return 0;
  const [t0, x0] = first;
  const [t1, x1] = last;
  return t1 - t0 >= 8 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0;
}

export function nearestSlot(slots: RubberSegmentSlot[], x: number): number {
  let best = 0;
  let bestDist = Infinity;
  slots.forEach((s, i) => {
    const dist = Math.abs((s.l + s.r) / 2 - x);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}
