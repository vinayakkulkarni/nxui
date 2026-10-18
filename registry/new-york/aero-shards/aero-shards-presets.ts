import type { AeroShardsLook, AeroShardsPreset } from './types';

const AERO_SHARDS_LOOK: AeroShardsLook = {
  shardColor: '#896ABD',
  accentColor: '#A855F7',
  lightMode: false,
  placement: 'full',
  material: 'glass',
  markers: 'plus',
  count: 1300,
  shardSize: 1,
  spread: 1,
  twist: 1,
  billow: 1,
  speed: 1,
  scale: 1,
  depthOfField: 0.75,
  glow: 0.35,
  grain: 0.06,
  vignette: 0.3,
};

const PRESETS: Record<AeroShardsPreset, Partial<AeroShardsLook>> = {
  amethyst: {},
  glacier: {
    shardColor: '#9cc9ff',
    accentColor: '#38bdf8',
    material: 'glass',
    placement: 'right',
    spread: 1.2,
    speed: 0.8,
  },
  copper: {
    shardColor: '#e3a17a',
    accentColor: '#f97316',
    material: 'chrome',
    markers: 'dots',
    twist: 1.3,
    speed: 0.9,
  },
  graphite: {
    shardColor: '#a1a1aa',
    accentColor: '#e4e4e7',
    material: 'chrome',
    glow: 0.25,
    billow: 0.7,
  },
  halo: {
    shardColor: '#b4a6f0',
    accentColor: '#818cf8',
    placement: 'center',
    twist: 1.4,
    count: 1500,
  },
};

const LIGHT_SWAP: Record<AeroShardsPreset, Partial<AeroShardsLook>> = {
  amethyst: { lightMode: true, shardColor: '#7c5cbf', accentColor: '#a855f7' },
  glacier: { lightMode: true, shardColor: '#3b82f6', accentColor: '#0ea5e9' },
  copper: { lightMode: true, shardColor: '#c2410c', accentColor: '#f97316' },
  graphite: { lightMode: true, shardColor: '#3f3f46', accentColor: '#71717a' },
  halo: { lightMode: true, shardColor: '#6d5bd0', accentColor: '#6366f1' },
};

const AERO_SHARDS_PRESETS: readonly AeroShardsPreset[] = [
  'amethyst',
  'glacier',
  'copper',
  'graphite',
  'halo',
];

const AERO_SHARDS_PRESET_NAMES: readonly string[] = AERO_SHARDS_PRESETS;

export function isAeroShardsPreset(value: unknown): value is AeroShardsPreset {
  return typeof value === 'string' && AERO_SHARDS_PRESET_NAMES.includes(value);
}

/** The full look for a preset, with the light-background swap applied when asked. */
export function aeroShardsPreset(
  preset: AeroShardsPreset,
  light = false,
): AeroShardsLook {
  return {
    ...AERO_SHARDS_LOOK,
    ...PRESETS[preset],
    ...(light ? LIGHT_SWAP[preset] : {}),
  };
}
