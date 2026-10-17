import type { SplitTextEaseFn, SplitTextStaggerFrom } from './types';

const TWO_PI = Math.PI * 2;

const linear: SplitTextEaseFn = (t) => t;

function outOf(easeIn: SplitTextEaseFn): SplitTextEaseFn {
  return (t) => 1 - easeIn(1 - t);
}

function inOutOf(easeIn: SplitTextEaseFn): SplitTextEaseFn {
  return (t) => (t < 0.5 ? easeIn(t * 2) / 2 : 1 - easeIn((1 - t) * 2) / 2);
}

function bounceOut(t: number): number {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) {
    const u = t - 1.5 / d;
    return n * u * u + 0.75;
  }
  if (t < 2.5 / d) {
    const u = t - 2.25 / d;
    return n * u * u + 0.9375;
  }
  const u = t - 2.625 / d;
  return n * u * u + 0.984375;
}

function elasticOut(amplitude: number, period: number): SplitTextEaseFn {
  const p1 = amplitude >= 1 ? amplitude : 1;
  const span = period / (amplitude < 1 ? amplitude : 1);
  const p2 = (span / TWO_PI) * (Math.asin(1 / p1) || 0);
  const p3 = TWO_PI / span;
  return (t) =>
    t === 1 ? 1 : p1 * Math.pow(2, -10 * t) * Math.sin((t - p2) * p3) + 1;
}

const POWER_ALIASES: Record<string, number> = {
  power0: 0,
  power1: 1,
  quad: 1,
  power2: 2,
  cubic: 2,
  power3: 3,
  quart: 3,
  power4: 4,
  quint: 4,
  strong: 4,
};

function easeInFor(
  family: string,
  args: number[],
): SplitTextEaseFn | 'bounce' | 'elastic' | null {
  const power = POWER_ALIASES[family];
  if (power !== undefined) {
    return (t) => Math.pow(t, power + 1);
  }
  switch (family) {
    case 'sine':
      return (t) => 1 - Math.cos((t * Math.PI) / 2);
    case 'expo':
      return (t) => (t ? Math.pow(2, 10 * (t - 1)) : 0);
    case 'circ':
      return (t) => -(Math.sqrt(1 - t * t) - 1);
    case 'back': {
      const s = args[0] ?? 1.70158;
      return (t) => t * t * ((s + 1) * t - s);
    }
    case 'bounce':
      return 'bounce';
    case 'elastic':
      return 'elastic';
    default:
      return null;
  }
}

/**
 * Parse a GSAP-style ease string (`'power3.out'`, `'back.out(2)'`,
 * `'elastic.out(1, 0.3)'`, `'bounce.out'`, `'none'`) into a function.
 * Unknown names fall back to `fallback`.
 */
export function parseEase(
  value: string | SplitTextEaseFn | undefined,
  fallback: SplitTextEaseFn,
): SplitTextEaseFn {
  if (typeof value === 'function') return value;
  if (!value) return fallback;
  const match = /^([a-z\d]+)(?:\.(inOut|in|out))?(?:\(([^)]*)\))?$/i.exec(
    value.trim(),
  );
  if (!match) return fallback;
  const family = (match[1] ?? '').toLowerCase();
  if (family === 'none' || family === 'linear') return linear;
  const variant = match[2] ?? 'out';
  const args = (match[3] ?? '')
    .split(',')
    .map((part) => Number.parseFloat(part))
    .filter((part) => Number.isFinite(part));
  const easeIn = easeInFor(family, args);
  if (!easeIn) return fallback;
  if (easeIn === 'bounce') {
    const easeInBounce: SplitTextEaseFn = (t) => 1 - bounceOut(1 - t);
    if (variant === 'in') return easeInBounce;
    if (variant === 'inOut') return inOutOf(easeInBounce);
    return bounceOut;
  }
  if (easeIn === 'elastic') {
    const out = elasticOut(args[0] ?? 1, args[1] ?? 0.3);
    const easeInElastic: SplitTextEaseFn = (t) => 1 - out(1 - t);
    if (variant === 'in') return easeInElastic;
    if (variant === 'inOut') return inOutOf(easeInElastic);
    return out;
  }
  if (variant === 'in') return easeIn;
  if (variant === 'inOut') return inOutOf(easeIn);
  return outOf(easeIn);
}

/** The crest ease the `wave` effect uses: overshoots and swings back. */
export const waveEase: SplitTextEaseFn = (t) =>
  1 - Math.cos(t * Math.PI * 1.5) * Math.pow(1 - t, 1.2);

/**
 * Per-piece start offsets in seconds, matching gsap.utils.distribute
 * ({ each, from }) for a one-dimensional list.
 */
export function distribute(
  count: number,
  each: number,
  from: SplitTextStaggerFrom,
): number[] {
  if (count <= 1) return Array.from({ length: count }, () => 0);
  const span = each * (count - 1);
  const middle = (count - 1) / 2;
  const distances = Array.from({ length: count }, (_, index) => {
    switch (from) {
      case 'center':
      case 'edges':
        return Math.abs(index - middle);
      case 'end':
        return count - 1 - index;
      case 'random':
        return Math.random() * (count - 1);
      default:
        return index;
    }
  });
  const min = Math.min(...distances);
  const range = Math.max(...distances) - min || 1;
  return distances.map((distance) => {
    const ratio = (distance - min) / range;
    return from === 'edges' ? span - ratio * span : ratio * span;
  });
}
