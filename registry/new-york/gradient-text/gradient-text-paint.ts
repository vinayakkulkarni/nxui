import type {
  GradientPaintSettings,
  GradientPointerState,
  GradientTextDirection,
} from './types';

const TAU = Math.PI * 2;

export const ANGLES: Record<GradientTextDirection, number> = {
  horizontal: 90,
  vertical: 180,
  diagonal: 135,
};

export const DEFAULT_COLORS = ['#5227FF', '#FF9FFC', '#B497CF'];

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Builds the CSS background-image for the current frame. */
export function gradientImage(
  s: GradientPaintSettings,
  state: GradientPointerState,
): string {
  const list = s.colors;
  const first = list[0] ?? '#ffffff';
  const cycle = state.time / s.speed;

  if (s.variant === 'flow') {
    const blobs = list.map((color, i) => {
      const spin = cycle * TAU;
      const rate = 0.55 + ((i * 0.618) % 1) * 0.5;
      let x = 50 + 44 * Math.sin(spin * rate + i * 2.1);
      let y = 50 + 40 * Math.sin(spin * (rate * 0.83 + 0.21) + i * 1.3);
      if (i === 0) {
        x += (state.px * 100 - x) * state.pull;
        y += (state.py * 100 - y) * state.pull;
      }
      return `radial-gradient(ellipse ${(22 + 12 * s.scale).toFixed(1)}% ${(60 + 30 * s.scale).toFixed(1)}% at ${x.toFixed(2)}% ${y.toFixed(2)}%, ${color} 0%, transparent 100%)`;
    });
    return `${blobs.join(', ')}, linear-gradient(${s.angle}deg, ${list.join(', ')})`;
  }

  if (s.variant === 'conic') {
    const sway = s.yoyo ? Math.sin(cycle * Math.PI) * 50 : cycle * 360;
    const cx = 50 + (state.px * 100 - 50) * state.pull;
    const cy = 260 + (state.py * 100 - 260) * state.pull;
    const stops = [...list, first]
      .map(
        (color, i) =>
          `${color} ${((i / list.length) * 60 * (3 / s.scale)).toFixed(2)}deg`,
      )
      .join(', ');
    return `repeating-conic-gradient(from ${(sway - 30).toFixed(2)}deg at ${cx.toFixed(2)}% ${cy.toFixed(2)}%, ${stops})`;
  }

  const loop = [...list, first];
  const period = 100 * s.scale;
  let offset: number;
  if (s.yoyo) {
    const swing = cycle % 2;
    const t = swing < 1 ? swing : 2 - swing;
    offset = (0.5 - Math.cos(Math.PI * t) / 2) * (period - 100);
  } else {
    offset = (cycle % 1) * period;
  }
  offset += (state.px - 0.5) * period * 0.5 * state.pull;
  const stops = loop.map(
    (color, i) =>
      `${color} ${((i / (loop.length - 1)) * period - offset).toFixed(2)}%`,
  );
  return `repeating-linear-gradient(${s.angle}deg, ${stops.join(', ')})`;
}
