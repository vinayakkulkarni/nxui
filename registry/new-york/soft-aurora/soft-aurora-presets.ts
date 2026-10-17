import type { SoftAuroraLook, SoftAuroraPreset } from './types';

const LOOK: SoftAuroraLook = {
  color1: '#f7f7f7',
  color2: '#e100ff',
  spectrum: 1,
  speed: 0.6,
  colorSpeed: 1,
  scale: 1.5,
  brightness: 1,
  noiseFrequency: 2.5,
  noiseAmplitude: 1,
  bandHeight: 0.5,
  bandSpread: 1,
  tilt: 0,
  octaveDecay: 0.1,
  layerOffset: 0,
};

const PRESETS: Record<SoftAuroraPreset, Partial<SoftAuroraLook>> = {
  classic: {},
  borealis: {
    color1: '#3EE59A',
    color2: '#22B8D3',
    spectrum: 0.2,
    bandHeight: 0.55,
    noiseAmplitude: 1.6,
    brightness: 0.8,
  },
  dusk: {
    color1: '#FFB86B',
    color2: '#FF5C8A',
    spectrum: 0.35,
    bandHeight: 0.38,
  },
  mono: {
    color1: '#E4E4E7',
    color2: '#71717A',
    spectrum: 0,
    brightness: 0.7,
  },
  ribbon: { tilt: -14, noiseAmplitude: 2.2, bandSpread: 1.3, scale: 1.2 },
  halo: { bandSpread: 0.55, brightness: 1.2, noiseFrequency: 1.5 },
  calm: { speed: 0.25, colorSpeed: 0.4, noiseAmplitude: 0.6 },
};

const LIGHT_SWAP: Partial<Record<SoftAuroraPreset, Partial<SoftAuroraLook>>> = {
  mono: { color1: '#52525B', color2: '#A1A1AA' },
};

/** The look of one of the demo presets. `light` swaps colors that vanish on light pages. */
export function softAuroraPreset(
  name: SoftAuroraPreset,
  light = false,
): SoftAuroraLook {
  return {
    ...LOOK,
    ...PRESETS[name],
    ...(light ? LIGHT_SWAP[name] : undefined),
  };
}

export function isSoftAuroraPreset(value: unknown): value is SoftAuroraPreset {
  return typeof value === 'string' && value in PRESETS;
}
