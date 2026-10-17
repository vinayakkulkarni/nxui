import type { SilkLook, SilkPreset } from './types';

const LOOK: SilkLook = {
  color: '#5227FF',
  sheenColor: '#ffffff',
  speed: 5,
  scale: 1,
  rotation: 0,
  sheen: 0.5,
  depth: 0.5,
  glow: 0.3,
  ripple: 1,
  wave: 1,
  variation: 0,
  noiseIntensity: 1.5,
};

const PRESETS: Record<SilkPreset, SilkLook> = {
  satin: LOOK,
  classic: { ...LOOK, sheen: 0, depth: 0, glow: 0 },
  champagne: {
    ...LOOK,
    color: '#b08d57',
    sheenColor: '#fff3dc',
    sheen: 0.6,
    depth: 0.55,
    glow: 0.35,
  },
  midnight: {
    ...LOOK,
    color: '#2a4bd7',
    speed: 3.5,
    sheen: 0.55,
    glow: 0.4,
    variation: 3,
  },
  emerald: {
    ...LOOK,
    color: '#12805f',
    sheenColor: '#e3fff4',
    rotation: 0.35,
    variation: 7,
  },
  graphite: {
    ...LOOK,
    color: '#8d8a96',
    sheen: 0.7,
    depth: 0.7,
    glow: 0.2,
    noiseIntensity: 1,
  },
  velvet: {
    ...LOOK,
    color: '#8f2747',
    sheenColor: '#ffd9e2',
    scale: 1.25,
    ripple: 1.8,
    wave: 1.6,
    speed: 4,
    depth: 0.65,
  },
};

/** The look of one of the demo presets. */
export function silkPreset(name: SilkPreset): SilkLook {
  return { ...PRESETS[name] };
}

export function isSilkPreset(value: unknown): value is SilkPreset {
  return typeof value === 'string' && value in PRESETS;
}
