import type { TiltedCardSpringState } from './types';

export const FLIP_THRESHOLD = 6;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseColor(value: string): number[] | null {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  const digits = hex?.[1];
  if (digits) {
    const full =
      digits.length === 3
        ? digits.replace(/./g, (digit) => digit + digit)
        : digits;
    return [0, 2, 4].map((index) =>
      Number.parseInt(full.slice(index, index + 2), 16),
    );
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) {
    return [rgb[1], rgb[2], rgb[3]].map((channel) =>
      clamp(Math.round(Number.parseFloat(channel ?? '0')), 0, 255),
    );
  }
  return null;
}

export function toLength(value: number | string | undefined) {
  return typeof value === 'number' ? `${value}px` : value;
}

/** Quintic smootherstep on a clamped 0..1 input. */
export function smoother(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * Advance one damped spring `key` toward `target` (sub-stepped at 240 Hz).
 * Returns true while the spring is still moving.
 */
export function step(
  state: TiltedCardSpringState,
  key: string,
  target: number,
  omega: number,
  zeta: number,
  dt: number,
): boolean {
  const velocity = `v${key}`;
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / steps;
  let value = state[key] ?? 0;
  let speed = state[velocity] ?? 0;
  for (let index = 0; index < steps; index++) {
    speed += (omega * omega * (target - value) - 2 * zeta * omega * speed) * h;
    value += speed * h;
  }
  const settled = Math.abs(target - value) < 0.001 && Math.abs(speed) < 0.01;
  if (settled) {
    value = target;
    speed = 0;
  }
  state[key] = value;
  state[velocity] = speed;
  return !settled;
}
