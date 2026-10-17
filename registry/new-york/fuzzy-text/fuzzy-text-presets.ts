import type { FuzzyTextLook, FuzzyTextPresetName } from './types';

const LOOK: FuzzyTextLook = {
  colorSplit: 0,
  trigger: 'hover',
  direction: 'horizontal',
  baseIntensity: 0.2,
  hoverIntensity: 0.5,
  fuzzRange: 30,
  sliceSize: 1,
  fps: 60,
  transitionDuration: 0,
  intro: true,
  introDuration: 1400,
  clickEffect: false,
  glitchMode: false,
  glitchInterval: 2000,
  glitchDuration: 200,
  letterSpacing: 0,
};

const OVERRIDES: Record<FuzzyTextPresetName, Partial<FuzzyTextLook>> = {
  static: {},
  glitch: {
    colorSplit: 0.6,
    trigger: 'click',
    baseIntensity: 0.04,
    hoverIntensity: 0.7,
    fuzzRange: 50,
    sliceSize: 5,
    transitionDuration: 4,
    introDuration: 1100,
    glitchMode: true,
    glitchInterval: 1600,
    glitchDuration: 240,
  },
  shiver: {
    trigger: 'always',
    direction: 'both',
    baseIntensity: 0.12,
    hoverIntensity: 0.4,
    fuzzRange: 14,
    sliceSize: 2,
    fps: 24,
    transitionDuration: 8,
    intro: false,
  },
  melt: {
    direction: 'vertical',
    baseIntensity: 0.25,
    hoverIntensity: 0.9,
    fuzzRange: 26,
    sliceSize: 2,
    transitionDuration: 20,
    introDuration: 2600,
  },
};

/** Full look for a named preset (the React Bits demo presets). */
export function fuzzyTextPreset(name: FuzzyTextPresetName): FuzzyTextLook {
  return { ...LOOK, ...OVERRIDES[name] };
}

export function isFuzzyTextPreset(
  value: unknown,
): value is FuzzyTextPresetName {
  return typeof value === 'string' && value in OVERRIDES;
}
