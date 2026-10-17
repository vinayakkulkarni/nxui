import type { PixelSwapGrid, PixelSwapPattern, PixelSwapPoint } from './types';

const MAX_PIXELS = 600;
export const STEP = 1 / 240;
export const PATTERNS: PixelSwapPattern[] = [
  'pointer',
  'random',
  'center',
  'edges',
  'left-to-right',
  'right-to-left',
  'top-to-bottom',
  'bottom-to-top',
  'diagonal',
  'spiral',
];
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const smoothstep = (
  edge0: number,
  edge1: number,
  value: number,
): number => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const hash = (index: number): number => {
  let h = Math.imul(index + 1, 668265261);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const round = (value: number): number => Math.round(value * 10) / 10;

export const buildGrid = (
  width: number,
  height: number,
  pixelSize: number,
  gap: number,
): PixelSwapGrid => {
  let size = pixelSize;
  let columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
  let rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  if (columns * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS));
    columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
    rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  }
  const stride = size + gap;
  const startX = (width - (columns * stride - gap)) / 2;
  const startY = (height - (rows * stride - gap)) / 2;
  const count = columns * rows;
  const cx = new Float32Array(count);
  const cy = new Float32Array(count);
  const gx = new Float32Array(count);
  const gy = new Float32Array(count);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const index = row * columns + column;
      cx[index] = startX + column * stride + size / 2;
      cy[index] = startY + row * stride + size / 2;
      gx[index] = columns > 1 ? column / (columns - 1) : 0.5;
      gy[index] = rows > 1 ? row / (rows - 1) : 0.5;
    }
  }
  return { count, size, stride, gap, width, height, cx, cy, gx, gy };
};

export const orderOf = (
  grid: PixelSwapGrid,
  index: number,
  pattern: PixelSwapPattern,
  point: PixelSwapPoint | null,
): number => {
  const x = grid.gx[index]!;
  const y = grid.gy[index]!;
  if (pattern === 'random') return hash(index + 11);
  if (pattern === 'center') return Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
  if (pattern === 'edges') return 1 - Math.min(x, 1 - x, y, 1 - y) * 2;
  if (pattern === 'left-to-right') return x;
  if (pattern === 'right-to-left') return 1 - x;
  if (pattern === 'top-to-bottom') return y;
  if (pattern === 'bottom-to-top') return 1 - y;
  if (pattern === 'diagonal') return (x + y) / 2;
  if (pattern === 'spiral') {
    const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2);
    return (angle + Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2) / 2;
  }
  const px = point ? point.x : grid.width / 2;
  const py = point ? point.y : grid.height / 2;
  const reach = Math.max(
    Math.hypot(px, py),
    Math.hypot(grid.width - px, py),
    Math.hypot(px, grid.height - py),
    Math.hypot(grid.width - px, grid.height - py),
    1,
  );
  return Math.hypot(grid.cx[index]! - px, grid.cy[index]! - py) / reach;
};

export const pixelPath = (
  x: number,
  y: number,
  half: number,
  radius: number,
  angle: number,
): string => {
  if (!angle) {
    const x0 = round(x - half);
    const x1 = round(x + half);
    const y0 = round(y - half);
    const y1 = round(y + half);
    if (radius < 0.2) return `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
    const r = round(radius);
    return `M${round(x0 + r)} ${y0}H${round(x1 - r)}A${r} ${r} 0 0 1 ${x1} ${round(y0 + r)}V${round(y1 - r)}A${r} ${r} 0 0 1 ${round(x1 - r)} ${y1}H${round(x0 + r)}A${r} ${r} 0 0 1 ${x0} ${round(y1 - r)}V${round(y0 + r)}A${r} ${r} 0 0 1 ${round(x0 + r)} ${y0}Z`;
  }
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const at = (u: number, v: number) =>
    `${round(x + u * cos - v * sin)} ${round(y + u * sin + v * cos)}`;
  const h = half;
  if (radius < 0.2)
    return `M${at(-h, -h)}L${at(h, -h)}L${at(h, h)}L${at(-h, h)}Z`;
  const r = round(radius);
  const k = h - radius;
  return `M${at(-k, -h)}L${at(k, -h)}A${r} ${r} 0 0 1 ${at(h, -k)}L${at(h, k)}A${r} ${r} 0 0 1 ${at(k, h)}L${at(-k, h)}A${r} ${r} 0 0 1 ${at(-h, k)}L${at(-h, -k)}A${r} ${r} 0 0 1 ${at(-k, -h)}Z`;
};
