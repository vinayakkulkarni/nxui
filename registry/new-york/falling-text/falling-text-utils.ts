import type { FallingTextTheme } from './types';

export const STEP = 1000 / 120;
export const WALL = 400;

const SPRING =
  'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9933, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 1)';

export const THEMES: Record<FallingTextTheme, Record<string, string>> = {
  dark: {
    '--falling-text-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--falling-text-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--falling-text-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--falling-text-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--falling-text-tile-ink': '#f4f4f5',
  },
  light: {
    '--falling-text-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--falling-text-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--falling-text-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--falling-text-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--falling-text-tile-ink': '#27272a',
  },
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Near-black or white, whichever reads better on the given hex color. */
export function readableOn(color: string): string {
  let hex = String(color || '')
    .trim()
    .replace('#', '');
  if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#ffffff';
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map((index) => {
    const c = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#18181b' : '#ffffff';
}

export function springEase(): string {
  return typeof CSS !== 'undefined' &&
    CSS.supports('transition-timing-function', 'linear(0, 1)')
    ? SPRING
    : 'cubic-bezier(0.34, 1.4, 0.64, 1)';
}
