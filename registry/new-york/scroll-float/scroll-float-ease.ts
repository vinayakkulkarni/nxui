import type { ScrollFloatEaseFn } from './types';

const PI = Math.PI;
const TAU = PI * 2;

const POWERS: Record<string, number> = {
  power0: 0,
  linear: 0,
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

function bounceOut(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) {
    const u = t - 1.5 / d1;
    return n1 * u * u + 0.75;
  }
  if (t < 2.5 / d1) {
    const u = t - 2.25 / d1;
    return n1 * u * u + 0.9375;
  }
  const u = t - 2.625 / d1;
  return n1 * u * u + 0.984375;
}

function elasticOut(amplitude = 1, period = 0.3): ScrollFloatEaseFn {
  const p1 = amplitude >= 1 ? amplitude : 1;
  const raw = period / (amplitude < 1 ? amplitude : 1);
  const p3 = (raw / TAU) * (Math.asin(1 / p1) || 0);
  const p2 = TAU / raw;
  return (t) =>
    t === 1 ? 1 : p1 * 2 ** (-10 * t) * Math.sin((t - p3) * p2) + 1;
}

function backOut(overshoot = 1.70158): ScrollFloatEaseFn {
  return (t) => {
    const u = t - 1;
    return u * u * ((overshoot + 1) * u + overshoot) + 1;
  };
}

function outCurve(name: string, args: number[]): ScrollFloatEaseFn | null {
  const power = POWERS[name];
  if (power !== undefined) return (t) => 1 - (1 - t) ** (power + 1);
  switch (name) {
    case 'none':
      return (t) => t;
    case 'expo':
      return (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
    case 'sine':
      return (t) => Math.sin((t * PI) / 2);
    case 'circ':
      return (t) => Math.sqrt(1 - (t - 1) ** 2);
    case 'back':
      return backOut(args[0]);
    case 'elastic':
      return elasticOut(args[0], args[1]);
    case 'bounce':
      return bounceOut;
    default:
      return null;
  }
}

/**
 * Parses a GSAP-style ease string ('power3.out', 'sine.inOut',
 * 'back.inOut(2)', 'elastic.out(1, 0.45)', 'none'). Unknown names are linear.
 */
export function parseEase(value: string): ScrollFloatEaseFn {
  const match = /^([a-z]\w*)(?:\.(inOut|in|out))?(?:\(([^)]*)\))?$/i.exec(
    value.trim(),
  );
  const name = (match?.[1] ?? 'none').toLowerCase();
  const type = match?.[2] ?? 'out';
  const args = (match?.[3] ?? '')
    .split(',')
    .map((part) => Number.parseFloat(part))
    .filter((n) => Number.isFinite(n));
  const out = outCurve(name, args);
  if (!out) return (t) => t;
  if (name === 'none' || name === 'linear' || name === 'power0') return out;
  if (type === 'in') return (t) => 1 - out(1 - t);
  if (type === 'inOut') {
    return (t) =>
      t < 0.5 ? (1 - out(1 - 2 * t)) / 2 : 0.5 + out(2 * t - 1) / 2;
  }
  return out;
}
