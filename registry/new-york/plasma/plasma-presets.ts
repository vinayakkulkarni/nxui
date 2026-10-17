import type { PlasmaLook, PlasmaPreset } from './types';

const SHAPE = {
  speed: 1,
  twist: 1,
  wave: 1,
  softness: 0.5,
  shine: 1,
};

const PRESETS: Record<PlasmaPreset, PlasmaLook> = {
  silver: { ...SHAPE, color: '#a6a3b8' },
  copper: { ...SHAPE, color: '#ff8a5c' },
  ocean: { ...SHAPE, color: '#4f7cff' },
  jade: { ...SHAPE, color: '#2fbf8f' },
  vortex: {
    ...SHAPE,
    color: '#a6a3b8',
    twist: 1.8,
    speed: 1.3,
    softness: 0.3,
    shine: 1.4,
  },
};

/** The look of one of the demo presets. */
export function plasmaPreset(name: PlasmaPreset): PlasmaLook {
  return { ...PRESETS[name] };
}

export function isPlasmaPreset(value: unknown): value is PlasmaPreset {
  return typeof value === 'string' && value in PRESETS;
}
