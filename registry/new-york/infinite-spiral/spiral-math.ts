export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const modulo = (value: number, divisor: number) =>
  ((value % divisor) + divisor) % divisor;

export const smoothstep = (min: number, max: number, value: number) => {
  const x = clamp((value - min) / (max - min || 1), 0, 1);
  return x * x * (3 - 2 * x);
};

export const INFINITE_SPIRAL_NO_ITEMS: string[] = [];
