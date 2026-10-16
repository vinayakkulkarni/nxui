import type {
  LetterGlitchCharset,
  LetterGlitchFont,
  LetterGlitchLook,
  LetterGlitchPreset,
} from './types';

export const LETTER_GLITCH_CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789';

export const LETTER_GLITCH_FONT =
  "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, 'Liberation Mono', monospace";

export const LETTER_GLITCH_DARK_COLORS = ['#ffffff', '#61dca3'];
export const LETTER_GLITCH_LIGHT_COLORS = ['#18181b', '#0f9f6e'];

/** Font stacks behind the demo's font picker. `system` uses the default stack. */
export const LETTER_GLITCH_FONTS: Record<LetterGlitchFont, string> = {
  system: LETTER_GLITCH_FONT,
  geist: "'Geist Mono', ui-monospace, monospace",
  code: "'Google Sans Code', ui-monospace, monospace",
  pixel: "'Press Start 2P', ui-monospace, monospace",
};

/** Character sets behind the demo's character picker. */
export const LETTER_GLITCH_CHARSETS: Record<LetterGlitchCharset, string> = {
  classic: LETTER_GLITCH_CHARACTERS,
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  binary: '01',
  hex: '0123456789ABCDEF',
  symbols: '!@#$%&*+-=/|<>[]{}()~^:;.,?',
  braille: '⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵',
};

const LOOK: LetterGlitchLook = {
  glitchColors: LETTER_GLITCH_DARK_COLORS,
  baseColor: '#ffffff',
  font: 'system',
  charset: 'classic',
  fontSize: 14,
  spacing: 0.6,
  density: 0.9,
  baseOpacity: 0.16,
  glitchAmount: 0.5,
  speed: 1,
  flow: 0.5,
  smooth: true,
  edgeFade: 0,
  centerFade: 0,
};

const PRESETS: Record<LetterGlitchPreset, Partial<LetterGlitchLook>> = {
  signature: {},
  classic: {
    glitchColors: ['#61dca3', '#61b3dc'],
    baseColor: '#2b4539',
    baseOpacity: 1,
    spacing: 0.1,
    density: 1,
    glitchAmount: 0.85,
    flow: 0,
  },
  terminal: {
    glitchColors: ['#ffffff'],
    font: 'geist',
    smooth: false,
    glitchAmount: 0.7,
    flow: 0.3,
  },
  binary: {
    charset: 'binary',
    glitchColors: ['#ffffff', '#60a5fa'],
    fontSize: 13,
    spacing: 0.8,
  },
  hex: { charset: 'hex', font: 'code', glitchColors: ['#ffffff', '#fbbf24'] },
  sparse: {
    density: 0.35,
    fontSize: 18,
    spacing: 1.1,
    speed: 0.6,
    flow: 0.8,
    edgeFade: 0.2,
  },
  storm: { glitchAmount: 1, speed: 1.8, flow: 0.8, baseOpacity: 0.22 },
  pixel: {
    font: 'pixel',
    charset: 'letters',
    fontSize: 10,
    spacing: 1,
    glitchColors: ['#ffffff', '#ff6b6b'],
  },
};

const LIGHT_SWAP: Record<
  LetterGlitchPreset,
  Pick<LetterGlitchLook, 'glitchColors' | 'baseColor'>
> = {
  signature: { glitchColors: ['#18181b', '#0f9f6e'], baseColor: '#18181b' },
  classic: { glitchColors: ['#047857', '#0369a1'], baseColor: '#a3c2b2' },
  terminal: { glitchColors: ['#18181b'], baseColor: '#18181b' },
  binary: { glitchColors: ['#18181b', '#2563eb'], baseColor: '#18181b' },
  hex: { glitchColors: ['#18181b', '#d97706'], baseColor: '#18181b' },
  sparse: { glitchColors: ['#18181b', '#0f9f6e'], baseColor: '#18181b' },
  storm: { glitchColors: ['#18181b', '#0f9f6e'], baseColor: '#18181b' },
  pixel: { glitchColors: ['#18181b', '#e11d48'], baseColor: '#18181b' },
};

const PRESET_NAMES = new Set<string>(Object.keys(PRESETS));

export function isLetterGlitchPreset(
  value: unknown,
): value is LetterGlitchPreset {
  return typeof value === 'string' && PRESET_NAMES.has(value);
}

/** The full look of a preset, with its light-mode colors when `light` is true. */
export function letterGlitchPreset(
  name: LetterGlitchPreset,
  light = false,
): LetterGlitchLook {
  const look: LetterGlitchLook = { ...LOOK, ...PRESETS[name] };
  if (light) Object.assign(look, LIGHT_SWAP[name]);
  return { ...look, glitchColors: [...look.glitchColors] };
}
