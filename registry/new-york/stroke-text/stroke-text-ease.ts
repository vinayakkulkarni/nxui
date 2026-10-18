import type { StrokeTextEase } from './types';

type Curve = (t: number) => number;

const linear: Curve = (t) => t;

const powerIn =
  (n: number): Curve =>
  (t) =>
    t ** n;

const BACK = 1.70158;
const POWER1 = powerIn(2);

const IN_CURVES: Record<string, Curve> = {
  none: linear,
  linear,
  power0: linear,
  power1: POWER1,
  quad: powerIn(2),
  power2: powerIn(3),
  cubic: powerIn(3),
  power3: powerIn(4),
  quart: powerIn(4),
  power4: powerIn(5),
  quint: powerIn(5),
  strong: powerIn(5),
  sine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  expo: (t) => (t === 0 ? 0 : 2 ** (10 * (t - 1))),
  circ: (t) => 1 - Math.sqrt(1 - t * t),
  back: (t) => t * t * ((BACK + 1) * t - BACK),
};

/** Resolves a GSAP-style ease name (`power2.out`, `sine.inOut`, `expo.in`, `none`) to a curve. */
export function resolveEase(name: string): StrokeTextEase {
  const [family = 'power1', direction = 'out'] = String(name || '')
    .trim()
    .split('.');
  const easeIn = IN_CURVES[family.toLowerCase()] ?? POWER1;
  if (easeIn === linear) return linear;
  const dir = direction.toLowerCase();
  if (dir === 'in') return easeIn;
  if (dir === 'inout') {
    return (t) => (t < 0.5 ? easeIn(t * 2) / 2 : 1 - easeIn((1 - t) * 2) / 2);
  }
  return (t) => 1 - easeIn(1 - t);
}
