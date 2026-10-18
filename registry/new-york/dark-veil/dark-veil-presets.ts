import type { DarkVeilLook, DarkVeilPreset } from './types';

const SHAPE: Omit<DarkVeilLook, 'color'> = {
  speed: 0.5,
  scale: 1,
  rotation: 0,
  flow: 1,
  warp: 0,
  variation: 0,
  sheen: 0,
  glow: 0.4,
};

const PRESETS: Record<DarkVeilPreset, DarkVeilLook> = {
  veil: { ...SHAPE, color: '#6b12ff' },
  ember: { ...SHAPE, color: '#ff4d1a', variation: 3 },
  jade: { ...SHAPE, color: '#10b981', variation: 7, rotation: 180, glow: 0.6 },
  silver: { ...SHAPE, color: '#b4b4c4', glow: 0.2 },
  storm: {
    ...SHAPE,
    color: '#3d5afe',
    speed: 1,
    flow: 2.2,
    warp: 0.6,
    variation: 5,
  },
};

/** The look of one of the React Bits demo presets. */
export function darkVeilPreset(name: DarkVeilPreset): DarkVeilLook {
  return { ...PRESETS[name] };
}

export function isDarkVeilPreset(value: unknown): value is DarkVeilPreset {
  return typeof value === 'string' && value in PRESETS;
}
