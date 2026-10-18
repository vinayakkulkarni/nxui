import type { BorderGlowHsl, BorderGlowTween } from './types';

const GRADIENT_POSITIONS = [
  '80% 55%',
  '69% 34%',
  '8% 6%',
  '41% 38%',
  '86% 85%',
  '82% 18%',
  '51% 4%',
];
const GRADIENT_KEYS = [
  '--gradient-one',
  '--gradient-two',
  '--gradient-three',
  '--gradient-four',
  '--gradient-five',
  '--gradient-six',
  '--gradient-seven',
];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];
const GLOW_OPACITIES = [100, 60, 50, 40, 30, 20, 10];
const GLOW_KEYS = ['', '-60', '-50', '-40', '-30', '-20', '-10'];

function parseHsl(value: string): BorderGlowHsl {
  const match = /(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%?\s+(\d+(?:\.\d+)?)%?/.exec(
    value,
  );
  if (!match) return { h: 40, s: 80, l: 80 };
  return {
    h: Number.parseFloat(match[1] ?? '40'),
    s: Number.parseFloat(match[2] ?? '80'),
    l: Number.parseFloat(match[3] ?? '80'),
  };
}

export function buildGlowVars(
  glowColor: string,
  intensity: number,
): Record<string, string> {
  const { h, s, l } = parseHsl(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const vars: Record<string, string> = {};
  GLOW_OPACITIES.forEach((opacity, index) => {
    vars[`--glow-color${GLOW_KEYS[index] ?? ''}`] =
      `hsl(${base} / ${Math.min(opacity * intensity, 100)}%)`;
  });
  return vars;
}

export function buildGradientVars(colors: string[]): Record<string, string> {
  const vars: Record<string, string> = {};
  const fallback = colors[0] ?? '#c084fc';
  GRADIENT_KEYS.forEach((key, index) => {
    const color =
      colors[Math.min(COLOR_MAP[index] ?? 0, colors.length - 1)] ?? fallback;
    vars[key] =
      `radial-gradient(at ${GRADIENT_POSITIONS[index]}, ${color} 0px, transparent 50%)`;
  });
  vars['--gradient-base'] = `linear-gradient(${fallback} 0 100%)`;
  return vars;
}

export function isLightColor(color: string): boolean {
  const value = color.trim().replace('#', '');
  if (!/^[\da-f]{3}(?:[\da-f]{3})?$/i.test(value)) return false;
  const hex =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 180;
}

export function easeOutCubic(x: number): number {
  return 1 - (1 - x) ** 3;
}

export function easeInCubic(x: number): number {
  return x * x * x;
}

export function edgeProximity(
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const kx = dx === 0 ? Infinity : cx / Math.abs(dx);
  const ky = dy === 0 ? Infinity : cy / Math.abs(dy);
  return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
}

export function cursorAngle(
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  const dx = x - width / 2;
  const dy = y - height / 2;
  if (dx === 0 && dy === 0) return 0;
  let degrees = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (degrees < 0) degrees += 360;
  return degrees;
}

/** rAF tween. Returns a cancel function so the caller can stop it on unmount. */
export function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: BorderGlowTween): () => void {
  const t0 = performance.now() + delay;
  let frame = 0;
  const tick = () => {
    const t = Math.min((performance.now() - t0) / duration, 1);
    onUpdate(start + (end - start) * ease(Math.max(t, 0)));
    if (t < 1) frame = requestAnimationFrame(tick);
    else onEnd?.();
  };
  const timer = setTimeout(() => {
    frame = requestAnimationFrame(tick);
  }, delay);
  return () => {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
  };
}
