import type { DotFieldLook, DotFieldPreset } from './types';

const DOT_FIELD_LOOK: DotFieldLook = {
  pattern: 'grid',
  gradientFrom: '#5227FF',
  gradientTo: '#FF9FFC',
  glowColor: '#ffffff',
  gradientAngle: 135,
  dotRadius: 1.5,
  dotSpacing: 14,
  cursorRadius: 240,
  bulgeStrength: 0.6,
  twist: 0,
  glowRadius: 160,
  glowIntensity: 0.8,
  baseOpacity: 0.55,
  waveAmplitude: 0,
  speed: 1,
  sparkle: false,
  lightMode: false,
};

const DOT_FIELD_PRESETS: Record<DotFieldPreset, Partial<DotFieldLook>> = {
  lens: {},
  vortex: {
    twist: 160,
    bulgeStrength: 0.2,
    cursorRadius: 280,
    gradientFrom: '#22d3ee',
    gradientTo: '#5227FF',
  },
  gravity: {
    bulgeStrength: -0.8,
    cursorRadius: 280,
    glowIntensity: 1,
    gradientFrom: '#FF9FFC',
    gradientTo: '#5227FF',
  },
  sunflower: {
    pattern: 'spiral',
    twist: -90,
    bulgeStrength: 0.4,
    dotRadius: 1.6,
    dotSpacing: 12,
    gradientFrom: '#FFC46B',
    gradientTo: '#FF6B6B',
    glowColor: '#fff4e0',
  },
  honeycomb: {
    pattern: 'hex',
    dotRadius: 2,
    dotSpacing: 12,
    gradientFrom: '#7dd3fc',
    gradientTo: '#a78bfa',
  },
  drift: { waveAmplitude: 8, sparkle: true, speed: 0.8 },
  starfield: {
    pattern: 'scatter',
    sparkle: true,
    dotRadius: 1,
    dotSpacing: 18,
    gradientFrom: '#ffffff',
    gradientTo: '#c7d2fe',
    baseOpacity: 0.45,
  },
};

/** Light-page tweaks for presets whose colors would wash out on white. */
const DOT_FIELD_LIGHT_SWAP: Partial<
  Record<DotFieldPreset, Partial<DotFieldLook>>
> = {
  vortex: { gradientFrom: '#0891b2', gradientTo: '#5227FF' },
  starfield: {
    gradientFrom: '#3f3f46',
    gradientTo: '#6366f1',
    baseOpacity: 0.6,
  },
};

/** Full set of visual props for a preset, optionally in its light variant. */
export function dotFieldPreset(
  preset: DotFieldPreset,
  light = false,
): DotFieldLook {
  return {
    ...DOT_FIELD_LOOK,
    lightMode: light,
    ...DOT_FIELD_PRESETS[preset],
    ...(light ? DOT_FIELD_LIGHT_SWAP[preset] : {}),
  };
}
