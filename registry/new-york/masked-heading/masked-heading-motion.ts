export const clamp = (v: number, a: number, b: number): number =>
  v < a ? a : v > b ? b : v;

/** Soft radial mask: transparent at the spot center, opaque at its edge. */
export const SPOT_MASK = `radial-gradient(circle var(--mh-spot-r, 160px) at var(--mh-spot-x, 50%) var(--mh-spot-y, 50%), ${Array.from(
  { length: 9 },
  (_, i) => {
    const t = i / 8;
    const u = clamp((t - 0.1) / 0.9, 0, 1);
    return `rgba(0, 0, 0, ${(u * u * u * (u * (u * 6 - 15) + 10)).toFixed(3)}) ${(t * 100).toFixed(1)}%`;
  },
).join(', ')})`;

// GSAP ease equivalents (powerN = polynomial of degree N + 1).
export const easeOut2 = (t: number): number => 1 - (1 - t) ** 3;
export const easeOut3 = (t: number): number => 1 - (1 - t) ** 4;
export const easeOut4 = (t: number): number => 1 - (1 - t) ** 5;
export const easeInOut3 = (t: number): number =>
  t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
export const easeExpoOut = (t: number): number =>
  t >= 1 ? 1 : 1 - 2 ** (-10 * t);

/** Progress (0–1) of a tween that starts after `delay` ms and lasts `duration` ms. */
export function progressAt(
  elapsed: number,
  delay: number,
  duration: number,
): number {
  if (duration <= 0) return elapsed >= delay ? 1 : 0;
  return clamp((elapsed - delay) / duration, 0, 1);
}
