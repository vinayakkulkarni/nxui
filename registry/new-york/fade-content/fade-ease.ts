import type { FadeEaseFn } from './types';

const linear: FadeEaseFn = (t) => t;

const BASES: Record<string, FadeEaseFn> = {
  power0: linear,
  power1: (t) => t ** 2,
  quad: (t) => t ** 2,
  power2: (t) => t ** 3,
  cubic: (t) => t ** 3,
  power3: (t) => t ** 4,
  quart: (t) => t ** 4,
  power4: (t) => t ** 5,
  quint: (t) => t ** 5,
  strong: (t) => t ** 5,
  sine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  expo: (t) => (t === 0 ? 0 : 2 ** (10 * (t - 1))),
  circ: (t) => 1 - Math.sqrt(1 - t * t),
  back: (t) => t * t * (2.70158 * t - 1.70158),
};

/**
 * Parses a GSAP-style ease name ('power2.out', 'expo.inOut', 'sine.in',
 * 'none') into an easing function. Unknown names fall back to power2.out,
 * GSAP's default. A bare base ('power3') is read as '.out', like GSAP.
 */
export function parseEase(name: string): FadeEaseFn {
  const value = name.trim();
  if (value === 'none' || value === 'linear' || value === '') return linear;
  const [base = 'power2', mode = 'out'] = value.split('.');
  const easeIn = BASES[base] ?? BASES.power2 ?? linear;
  if (mode === 'in') return easeIn;
  if (mode === 'inOut') {
    return (t) => (t < 0.5 ? easeIn(t * 2) / 2 : 1 - easeIn((1 - t) * 2) / 2);
  }
  return (t) => 1 - easeIn(1 - t);
}
