const smootherstep = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

const FADE_STEPS = Array.from({ length: 9 }, (_, i) => i / 8);

export const FADE_MASK = `linear-gradient(to right, ${[
  ...FADE_STEPS.map(
    (t) =>
      `rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) ${(t * 12).toFixed(1)}%`,
  ),
  ...FADE_STEPS.map(
    (t) =>
      `rgba(0, 0, 0, ${smootherstep(1 - t).toFixed(3)}) ${(88 + t * 12).toFixed(1)}%`,
  ),
].join(', ')})`;

export const DEFAULT_VELOCITY_MAPPING = {
  input: [0, 1000],
  output: [0, 5],
};

export function wrap(min: number, max: number, v: number): number {
  const range = max - min;
  const mod = (((v - min) % range) + range) % range;
  return mod + min;
}

/** Piecewise-linear map without clamping (extrapolates past the ends). */
export function mapVelocity(
  value: number,
  input: number[],
  output: number[],
): number {
  const count = Math.min(input.length, output.length);
  if (count < 2) return output[0] ?? 0;
  let i = 1;
  while (i < count - 1 && value > (input[i] ?? 0)) i++;
  const x0 = input[i - 1] ?? 0;
  const x1 = input[i] ?? 0;
  const y0 = output[i - 1] ?? 0;
  const y1 = output[i] ?? 0;
  if (x1 === x0) return y1;
  return y0 + ((value - x0) / (x1 - x0)) * (y1 - y0);
}
