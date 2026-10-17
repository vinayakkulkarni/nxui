import type { SplitTextPresetName, SplitTextPresetValues } from './types';

const LOOK: SplitTextPresetValues = {
  effect: 'rise',
  splitType: 'chars',
  ease: '',
  delay: 50,
  duration: 1.25,
  staggerFrom: 'start',
  trigger: 'view',
  hoverEffect: 'lift',
  loop: false,
  loopDelay: 1.5,
  mask: false,
  color: '',
  accentColor: '',
};

const OVERRIDES: Record<SplitTextPresetName, Partial<SplitTextPresetValues>> = {
  rise: {},
  flip: {
    effect: 'flip',
    delay: 45,
    duration: 1.1,
    trigger: 'hover',
    hoverEffect: 'none',
    accentColor: '#ff5a36',
  },
  blur: {
    effect: 'blur',
    splitType: 'words',
    delay: 160,
    duration: 1.6,
    staggerFrom: 'center',
    hoverEffect: 'none',
    loop: true,
    loopDelay: 1.4,
  },
  wave: {
    effect: 'wave',
    delay: 45,
    duration: 1.4,
    trigger: 'click',
    hoverEffect: 'wave',
  },
};

/** Full look for a named preset (the React Bits demo presets). */
export function splitTextPreset(
  name: SplitTextPresetName,
): SplitTextPresetValues {
  return { ...LOOK, ...OVERRIDES[name] };
}

export function isSplitTextPreset(
  value: unknown,
): value is SplitTextPresetName {
  return typeof value === 'string' && value in OVERRIDES;
}
