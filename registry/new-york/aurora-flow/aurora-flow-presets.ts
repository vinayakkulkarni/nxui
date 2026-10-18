import type {
  AuroraFlowPalette,
  AuroraFlowPreset,
  AuroraFlowRgb,
} from './types';

export const AURORA_FLOW_PRESETS: Record<AuroraFlowPreset, AuroraFlowPalette> =
  {
    ocean: ['#020817', '#062a55', '#0b62b4', '#39bfe6', '#d9f6ff'],
    aurora: ['#07051a', '#25105e', '#4d43c7', '#20a7a0', '#c3f5eb'],
    sky: ['#071425', '#16456e', '#4d9acb', '#9edbf0', '#eefaff'],
    cloud: ['#20242c', '#4b5360', '#8c98a7', '#ced5dc', '#f7f8fa'],
    sunset: ['#1d0812', '#6d1e3e', '#d95b48', '#f2a35b', '#ffe2a6'],
    midnight: ['#010206', '#080d1c', '#17264d', '#304d7f', '#a8c6ef'],
    ice: ['#07141b', '#123b49', '#3e8796', '#a6e4e7', '#f1ffff'],
    dream: ['#10091c', '#3b1d58', '#8d4ca0', '#df91bd', '#ffe7f1'],
    nebula: ['#090512', '#32104a', '#813b8f', '#315fa8', '#e2b7ff'],
    emerald: ['#03120e', '#073c2c', '#0e7358', '#53c89f', '#d9fff0'],
    lavender: ['#100b20', '#30205d', '#6252a6', '#b58bc6', '#f4dff4'],
    mono: ['#020202', '#171717', '#414141', '#8a8a8a', '#f2f2f2'],
  };

export const AURORA_FLOW_PRESET_NAMES: readonly AuroraFlowPreset[] = [
  'ocean',
  'aurora',
  'sky',
  'cloud',
  'sunset',
  'midnight',
  'ice',
  'dream',
  'nebula',
  'emerald',
  'lavender',
  'mono',
];

const HEX_COLOR_REGEX = /^#?[\da-f]{6}$/i;

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function sanitizeHexColor(
  value: string | undefined,
  fallback: string,
): string {
  const trimmed = value?.trim() ?? '';
  if (!HEX_COLOR_REGEX.test(trimmed)) return fallback;
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

export function hexToRgb01(hex: string): AuroraFlowRgb {
  const normalized = hex.slice(1);
  return [
    Number.parseInt(normalized.slice(0, 2), 16) / 255,
    Number.parseInt(normalized.slice(2, 4), 16) / 255,
    Number.parseInt(normalized.slice(4, 6), 16) / 255,
  ];
}
