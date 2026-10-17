import type {
  GridMotionDirection,
  GridMotionItem,
  GridMotionLayout,
  GridMotionLayoutInput,
  GridMotionTile,
} from './types';

export const THEMES = {
  dark: {
    tile: '#1b1922',
    text: 'rgba(255, 255, 255, 0.78)',
    border: 'rgba(255, 255, 255, 0.07)',
  },
  light: {
    tile: '#f4f4f5',
    text: '#3f3f46',
    border: 'rgba(24, 24, 27, 0.08)',
  },
};

export const DIRECTIONS: GridMotionDirection[] = ['alternate', 'left', 'right'];
const IMAGE =
  /^(?:https?:\/\/|\/\/|\/|\.\.?\/|data:image\/|blob:)|\.(?:avif|gif|jpe?g|png|svg|webp)(?:\?.*)?$/i;
export const INERTIA = [0.42, 0.32, 0.26, 0.22];
export const PACE = [1, 0.86, 1.12, 0.94];

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const wrap = (value: number, total: number) =>
  ((value % total) + total) % total;

export const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Smootherstep-feathered linear-gradient used for the edge mask. */
export function feather(side: string, zone: number) {
  const stops: string[] = [];
  const mirrored: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const alpha = t * t * t * (t * (t * 6 - 15) + 10);
    stops.push(`rgba(0, 0, 0, ${alpha.toFixed(4)}) ${(t * zone).toFixed(2)}%`);
    const m = (12 - i) / 12;
    const mAlpha = m * m * m * (m * (m * 6 - 15) + 10);
    mirrored.push(
      `rgba(0, 0, 0, ${mAlpha.toFixed(4)}) ${(100 - m * zone).toFixed(2)}%`,
    );
  }
  return `linear-gradient(${side}, ${stops.join(', ')}, ${mirrored.join(', ')})`;
}

export function toTile(item: GridMotionItem, index: number): GridMotionTile {
  if (item === null || item === undefined || item === false)
    return { kind: 'empty', index, item };
  if (typeof item === 'object')
    return { kind: 'image', index, item, src: item.src, alt: item.alt ?? '' };
  const text = String(item).trim();
  return IMAGE.test(text)
    ? { kind: 'image', index, item, src: text, alt: '' }
    : { kind: 'text', index, item, text };
}

export function computeLayout(
  input: GridMotionLayoutInput,
): GridMotionLayout | null {
  const { width, height, rows, aspect, gap } = input;
  if (!width || !height) return null;
  const turn = (input.angle * Math.PI) / 180;
  const lean = (input.tilt * Math.PI) / 180;
  const cos = Math.abs(Math.cos(turn));
  const sin = Math.abs(Math.sin(turn));
  const planeHeight =
    ((width * sin + height * cos) / Math.max(0.3, Math.cos(lean))) * 1.12;
  const planeWidth =
    (width * cos + height * sin) * (1 + Math.sin(lean) * 0.9) * 1.12;
  const tileHeight = Math.max(16, (planeHeight - gap * (rows - 1)) / rows);
  const tileWidth = tileHeight * aspect;
  const step = tileWidth + gap;
  const perRow = Math.ceil(planeWidth / step) + 1;
  const period = perRow * step;
  return {
    planeWidth,
    planeHeight,
    tileWidth,
    tileHeight,
    step,
    perRow,
    period,
    copies: Math.ceil(planeWidth / period) + 2,
    top: (planeHeight - rows * tileHeight - (rows - 1) * gap) / 2,
    perspective: Math.max(width, height) * 1.5,
  };
}
