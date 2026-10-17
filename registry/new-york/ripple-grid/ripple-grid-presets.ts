import type { RippleGridPreset, RippleGridShape } from './types';

const SHAPE: RippleGridShape = {
  variant: 'lines',
  cellSize: 48,
  lineWidth: 1,
  glow: 0.6,
  rippleStrength: 1,
  rippleSpeed: 1,
  rippleSize: 1,
  autoRipple: 'center',
  rippleInterval: 2.6,
  tilt: 0,
  rotation: 0,
  fade: 0.5,
};

const PRESETS: Record<RippleGridPreset, RippleGridShape> = {
  pulse: SHAPE,
  floor: {
    ...SHAPE,
    tilt: 62,
    cellSize: 56,
    autoRipple: 'random',
    rippleInterval: 1.6,
    fade: 0.35,
  },
  dots: { ...SHAPE, variant: 'dots', cellSize: 32, glow: 0.4 },
  cross: { ...SHAPE, variant: 'cross', cellSize: 56, lineWidth: 1.5 },
  calm: { ...SHAPE, autoRipple: 'none', rippleStrength: 0.8, glow: 0.4 },
};

/** The grid shape of one of the demo presets. Color is left to you. */
export function rippleGridPreset(name: RippleGridPreset): RippleGridShape {
  return { ...PRESETS[name] };
}

export function isRippleGridPreset(value: unknown): value is RippleGridPreset {
  return typeof value === 'string' && value in PRESETS;
}
