import type { VariantType } from 'motion-v';
import type { MagnifyColors, MagnifyPoint, MagnifyTheme } from './types';

/* The poster is drawn in a fixed 500 × 680 space and scaled to fit. */
export const W = 500;
export const H = 680;
/* The lens is drawn at this glass radius and scaled to `lensRadius`. */
export const R0 = 50;
const RIM = 6;
export const LENS_OUTER = (R0 + RIM) * 2;
export const OFFSTAGE: MagnifyPoint = { x: 600, y: -140 };
export const REST: MagnifyPoint = { x: 330, y: 254 };
export const HANDLE_ANGLE = 42;
export const TINT = 0.38;
export const GLYPH_SIZE = 500;
export const MICRO_SIZE = 5.6;

export const COLORS: Record<MagnifyTheme, MagnifyColors> = {
  light: { paper: '#ebe7da', ink: '#161616' },
  dark: { paper: '#1d1c1a', ink: '#ece6d6' },
};

export const GRAIN_MATRIX: Record<MagnifyTheme, string> = {
  light: '0 0 0 0 0.35  0 0 0 0 0.32  0 0 0 0 0.25  0 0 0 0.9 0',
  dark: '0 0 0 0 0.9  0 0 0 0 0.88  0 0 0 0 0.82  0 0 0 0.9 0',
};

export const KEY_MOVES: Record<string, MagnifyPoint> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

export function baseline(size: number): number {
  return 340 + size * 0.36;
}

export function clamp(v: number, max: number): number {
  return Math.max(0, Math.min(max, v));
}

/* motion */

export const LENS_SPRING = { stiffness: 260, damping: 28, mass: 0.9 };
export const ZOOM_SPRING = { stiffness: 200, damping: 22 };
export const LIFT_SPRING = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
} as const;
export const SHADOW_SPRING = {
  type: 'spring',
  stiffness: 200,
  damping: 22,
} as const;

export const FRAME_IN = { opacity: 0, y: 40, rotate: -2.5, scale: 0.96 };
export const FRAME_SHOW = { opacity: 1, y: 0, rotate: 0, scale: 1 };
export const FRAME_TRANSITION = {
  type: 'spring',
  stiffness: 90,
  damping: 16,
} as const;

export const GLYPH_IN = {
  strokeDashoffset: 3200,
  fillOpacity: 0,
  strokeWidth: 1.5,
};
export const GLYPH_SHOW = {
  strokeDashoffset: 0,
  fillOpacity: 1,
  strokeWidth: 0,
};
export const GLYPH_TRANSITION = {
  strokeDashoffset: {
    delay: 0.3,
    duration: 1,
    ease: [0.65, 0, 0.35, 1] as const,
  },
  fillOpacity: { delay: 0.95, duration: 0.5, ease: 'easeOut' },
  strokeWidth: { delay: 1.45, duration: 0.3 },
} as const;

export const HIDDEN = { opacity: 0 };
export const SHOWN = { opacity: 1 };
export const LENS_FADE = { delay: 1.2, duration: 0.3 };

export const LENS_HELD = { scale: 1.04 };
export const LENS_FLOAT: VariantType = {
  scale: [1, 1.012, 1],
  transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
};
export const LENS_STILL = { scale: 1 };

export const HINT_IN = { opacity: 0, y: 6 };
export const HINT_SHOW = { opacity: 1, y: 0 };
