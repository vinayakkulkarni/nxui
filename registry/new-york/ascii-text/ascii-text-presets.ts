import { ASCII_CHARSET, ASCII_COLORS } from './ascii-text-gl';
import type { ASCIITextPresetName, ASCIITextPresetValues } from './types';

const BASE: ASCIITextPresetValues = {
  charset: ASCII_CHARSET,
  colors: ASCII_COLORS,
  asciiFontSize: 8,
  textScale: 1,
  blocks: 0.9,
  waves: 1,
  waveSpeed: 1,
  chroma: 1,
  tilt: 1,
  hueShift: 1,
  scramble: 0.6,
};

const OVERRIDES: Record<ASCIITextPresetName, Partial<ASCIITextPresetValues>> = {
  classic: {},
  terminal: {
    charset: ' .:-=+*#%@',
    colors: ['#b8f5c8', '#5ee08a', '#1f9d55'],
    blocks: 0,
    chroma: 0.3,
    hueShift: 0,
    asciiFontSize: 10,
  },
  blocks: {
    charset: ' ░▒▓█',
    colors: ['#ffffff', '#d4d4d8', '#a1a1aa'],
    blocks: 0.2,
    hueShift: 0,
    chroma: 0.6,
  },
  binary: {
    charset: ' 01',
    colors: ['#ffffff', '#bae6fd', '#38bdf8'],
    blocks: 0.35,
    hueShift: 0.4,
    asciiFontSize: 9,
  },
  mono: {
    colors: ['#ffffff', '#e4e4e7', '#a1a1aa'],
    blocks: 0.15,
    chroma: 0,
    hueShift: 0,
    waves: 0.6,
  },
};

export function isASCIITextPreset(
  value: unknown,
): value is ASCIITextPresetName {
  return typeof value === 'string' && Object.hasOwn(OVERRIDES, value);
}

/** Full prop set for a preset: the defaults with the preset's overrides applied. */
export function asciiTextPreset(
  name: ASCIITextPresetName,
): ASCIITextPresetValues {
  const values = { ...BASE, ...OVERRIDES[name] };
  return { ...values, colors: [...values.colors] };
}
