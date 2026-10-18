export const IMAGE_COLORS: readonly string[] = ['#f4f4f5', '#a1a1aa'];
export const FLOW_COLORS: readonly string[] = ['#e2e8f0', '#67e8f9', '#818cf8'];
export const GLITCH_COLORS: readonly string[] = [
  '#ecfccb',
  '#a3e635',
  '#22d3ee',
];

const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function parseHex(color: string): [number, number, number] | null {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (!match) return null;
  return [
    Number.parseInt(match[1] ?? '0', 16),
    Number.parseInt(match[2] ?? '0', 16),
    Number.parseInt(match[3] ?? '0', 16),
  ];
}

/** Interpolated color along `colors` for a 0..1 luminance. */
export function gradientColor(
  colors: readonly string[],
  amount: number,
): string {
  const first = colors[0] ?? '#ffffff';
  if (colors.length < 2) return first;

  const position = clamp(amount) * (colors.length - 1);
  const index = Math.min(Math.floor(position), colors.length - 2);
  const mix = position - index;
  const from = parseHex(colors[index] ?? first);
  const to = parseHex(colors[index + 1] ?? first);
  if (!from || !to) return colors[Math.round(position)] ?? first;

  const r = Math.round(from[0] + (to[0] - from[0]) * mix);
  const g = Math.round(from[1] + (to[1] - from[1]) * mix);
  const b = Math.round(from[2] + (to[2] - from[2]) * mix);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Floyd–Steinberg error diffusion, quantizing to `steps` levels in place. */
export function ditherFloydSteinberg(
  field: Float32Array,
  columns: number,
  rows: number,
  steps: number,
  strength: number,
): void {
  const amount = clamp(strength);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const index = row * columns + column;
      const oldValue = clamp(field[index] ?? 0);
      const quantized = Math.round(oldValue * (steps - 1)) / (steps - 1);
      const value = oldValue + (quantized - oldValue) * amount;
      const error = oldValue - value;
      field[index] = value;
      if (column + 1 < columns) field[index + 1]! += (error * 7) / 16;
      if (row + 1 < rows) {
        if (column > 0) field[index + columns - 1]! += (error * 3) / 16;
        field[index + columns]! += (error * 5) / 16;
        if (column + 1 < columns) field[index + columns + 1]! += error / 16;
      }
    }
  }
}

/** 4×4 ordered (Bayer) dithering in place. */
export function ditherBayer(
  field: Float32Array,
  columns: number,
  rows: number,
  strength: number,
): void {
  const amount = clamp(strength);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const index = row * columns + column;
      const cell = BAYER_4[(row % 4) * 4 + (column % 4)] ?? 0;
      const offset = ((cell / 16 - 0.5) * amount) / 4;
      field[index] = clamp((field[index] ?? 0) + offset);
    }
  }
}

/** Plain posterize to `steps` levels in place. */
export function posterizeField(field: Float32Array, steps: number): void {
  for (let index = 0; index < field.length; index++) {
    field[index] =
      Math.round(clamp(field[index] ?? 0) * (steps - 1)) / (steps - 1);
  }
}
