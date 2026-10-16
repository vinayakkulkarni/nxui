import type { MorphEaseFn } from './types';

const linear: MorphEaseFn = (t) => t;

const BASE_IN: Record<string, MorphEaseFn> = {
  power0: linear,
  linear,
  none: linear,
  power1: (t) => t * t,
  quad: (t) => t * t,
  power2: (t) => t * t * t,
  cubic: (t) => t * t * t,
  power3: (t) => t ** 4,
  quart: (t) => t ** 4,
  power4: (t) => t ** 5,
  quint: (t) => t ** 5,
  strong: (t) => t ** 5,
  sine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  expo: (t) => (t === 0 ? 0 : 2 ** (10 * (t - 1))),
  circ: (t) => 1 - Math.sqrt(1 - t * t),
};

/**
 * Resolves a GSAP-style ease name ("power2.inOut", "expo.out", "none")
 * into an easing function. Unknown names fall back to GSAP's default
 * "power1.out".
 */
export function resolveEase(name: string): MorphEaseFn {
  const [rawBase = 'power1', rawType = 'out'] = name.trim().split('.');
  const base = BASE_IN[rawBase.toLowerCase()];
  if (!base) return resolveEase('power1.out');
  if (base === linear) return linear;
  const type = rawType.toLowerCase();
  if (type === 'in') return base;
  if (type === 'inout') {
    return (t) => (t < 0.5 ? base(t * 2) / 2 : 1 - base((1 - t) * 2) / 2);
  }
  return (t) => 1 - base(1 - t);
}
