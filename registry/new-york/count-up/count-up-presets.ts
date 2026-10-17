import type { CountUpPresetName, CountUpPresetValues } from './types';

const LOOK: CountUpPresetValues = {
  mode: 'count',
  easing: 'easeOut',
  format: 'standard',
  decimals: 'auto',
  from: '0',
  to: '100',
  duration: 1,
  direction: 'up',
  separator: ',',
  prefix: '',
  suffix: '',
  replayOnHover: true,
  size: 4,
  weight: 700,
};

const OVERRIDES: Record<CountUpPresetName, Partial<CountUpPresetValues>> = {
  classic: {},
  odometer: {
    mode: 'roll',
    easing: 'spring',
    to: '86420',
    duration: 2.4,
    size: 6,
    weight: 600,
  },
  revenue: {
    easing: 'expo',
    decimals: '2',
    to: '48250.75',
    duration: 2.2,
    prefix: '$',
    size: 4.5,
    weight: 500,
  },
  compact: {
    mode: 'roll',
    format: 'compact',
    to: '3400000',
    duration: 1.8,
    suffix: '+',
    size: 7,
    weight: 800,
  },
};

export function isCountUpPreset(value: unknown): value is CountUpPresetName {
  return typeof value === 'string' && Object.hasOwn(OVERRIDES, value);
}

/** Demo look for a preset: the shared defaults with the preset's overrides applied. */
export function countUpPreset(name: CountUpPresetName): CountUpPresetValues {
  return { ...LOOK, ...OVERRIDES[name] };
}

/** Parses a text-input number, falling back when it is empty or invalid. */
export function toNumber(value: string, fallback: number): number {
  const number = Number(value);
  return value !== '' && Number.isFinite(number) ? number : fallback;
}
