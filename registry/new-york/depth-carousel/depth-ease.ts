import type { DepthCarouselEase } from './types';

const linear: DepthCarouselEase = (t) => t;

const POWER: Record<string, number> = {
  power0: 1,
  linear: 1,
  power1: 2,
  quad: 2,
  power2: 3,
  cubic: 3,
  power3: 4,
  quart: 4,
  power4: 5,
  quint: 5,
  strong: 5,
};

function baseIn(name: string, arg: number): DepthCarouselEase | null {
  const power = POWER[name];
  if (power !== undefined) return (t) => t ** power;
  switch (name) {
    case 'sine':
      return (t) => 1 - Math.cos((t * Math.PI) / 2);
    case 'expo':
      return (t) => (t <= 0 ? 0 : 2 ** (10 * (t - 1)));
    case 'circ':
      return (t) => 1 - Math.sqrt(1 - t * t);
    case 'back': {
      const s = Number.isFinite(arg) ? arg : 1.70158;
      return (t) => t * t * ((s + 1) * t - s);
    }
    default:
      return null;
  }
}

/**
 * Resolves a GSAP ease string (`power3.out`, `expo.inOut`, `back.out(1.4)`,
 * `none`) to an easing function. Unknown names fall back to `power3.out`.
 */
export function resolveEase(ease: string): DepthCarouselEase {
  const match =
    /^\s*([a-z0-9]+)(?:\.(in|out|inout))?(?:\(([-\d.]+)\))?\s*$/i.exec(ease);
  if (!match) return resolveEase('power3.out');
  const name = (match[1] ?? '').toLowerCase();
  if (name === 'none') return linear;
  const type = (match[2] ?? 'out').toLowerCase();
  const easeIn = baseIn(name, Number.parseFloat(match[3] ?? ''));
  if (!easeIn)
    return ease === 'power3.out' ? linear : resolveEase('power3.out');
  if (type === 'in') return easeIn;
  if (type === 'out') return (t) => 1 - easeIn(1 - t);
  return (t) => (t < 0.5 ? easeIn(t * 2) / 2 : 1 - easeIn((1 - t) * 2) / 2);
}

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(Math.max(v, min), max);

export const wrapIndex = (v: number, n: number): number => ((v % n) + n) % n;
