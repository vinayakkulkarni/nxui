import type { LiquidChromeLook, LiquidChromePreset } from './types';

const LOOK: LiquidChromeLook = {
  color: '#ffffff',
  speed: 0.2,
  amplitude: 0.3,
  frequencyX: 3,
  frequencyY: 3,
  detail: 4,
  thickness: 1,
  depth: 1,
  roughness: 0.3,
  exposure: 1,
};

const PRESETS: Record<LiquidChromePreset, Partial<LiquidChromeLook>> = {
  satin: {},
  polished: { roughness: 0.17 },
  velvet: { thickness: 1.1, roughness: 0.5 },
  mercury: {
    speed: 0.14,
    amplitude: 0.22,
    frequencyX: 2.5,
    frequencyY: 2.5,
    detail: 3,
    thickness: 1.15,
    roughness: 0.2,
  },
  molten: {
    speed: 0.28,
    amplitude: 0.38,
    frequencyX: 3.2,
    frequencyY: 3.2,
    detail: 5,
    thickness: 0.85,
  },
  gold: { color: '#f2c46d' },
};

const PRESET_NAMES = new Set<string>(Object.keys(PRESETS));

export function isLiquidChromePreset(
  value: unknown,
): value is LiquidChromePreset {
  return typeof value === 'string' && PRESET_NAMES.has(value);
}

/** The full look of a preset: the defaults with the preset's overrides. */
export function liquidChromePreset(name: LiquidChromePreset): LiquidChromeLook {
  return { ...LOOK, ...PRESETS[name] };
}
