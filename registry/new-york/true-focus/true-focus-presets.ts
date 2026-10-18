import type { TrueFocusPresetName, TrueFocusPresetValues } from './types';

const LOOK: TrueFocusPresetValues = {
  sentence: 'True Focus',
  borderColor: '#5227FF',
  highlightColor: '#5227FF',
  easing: 'smooth',
  order: 'sequential',
  animationDuration: 0.5,
  pauseBetweenAnimations: 1,
  focusStyle: 'brackets',
  focusScale: 1,
  blurAmount: 5,
  unfocusedOpacity: 1,
  cornerSize: 16,
  borderWidth: 3,
};

const OVERRIDES: Record<TrueFocusPresetName, Partial<TrueFocusPresetValues>> = {
  classic: {},
  box: {
    sentence: 'Less noise, more focus',
    borderColor: '#ffffff',
    easing: 'spring',
    animationDuration: 0.55,
    pauseBetweenAnimations: 0.9,
    focusStyle: 'box',
    focusScale: 1.06,
    blurAmount: 3,
    unfocusedOpacity: 0.4,
    borderWidth: 1.5,
  },
  underline: {
    sentence: 'Make every word count',
    borderColor: '#ff5a36',
    easing: 'spring',
    order: 'random',
    pauseBetweenAnimations: 0.8,
    focusStyle: 'underline',
    blurAmount: 0,
    unfocusedOpacity: 0.28,
    borderWidth: 4,
  },
  marker: {
    sentence: 'Mark what matters most',
    highlightColor: '#4f8dff',
    animationDuration: 0.6,
    focusStyle: 'highlight',
    focusScale: 1.04,
    blurAmount: 1.5,
    unfocusedOpacity: 0.5,
  },
};

/** Full look for a named preset (the React Bits demo presets). */
export function trueFocusPreset(
  name: TrueFocusPresetName,
): TrueFocusPresetValues {
  return { ...LOOK, ...OVERRIDES[name] };
}

export function isTrueFocusPreset(
  value: unknown,
): value is TrueFocusPresetName {
  return typeof value === 'string' && value in OVERRIDES;
}
