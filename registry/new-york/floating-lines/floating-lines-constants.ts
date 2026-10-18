import type {
  FloatingLinesLook,
  FloatingLinesPresetName,
  FloatingLinesWave,
  FloatingLinesWavePosition,
} from './types';

export const MAX_LINES = 24;
export const MAX_STOPS = 8;
export const MAX_CLICKS = 3;
export const INTRO_SECONDS = 1.8;

export const WAVES: readonly FloatingLinesWave[] = ['top', 'middle', 'bottom'];

export const WAVE_DEFAULTS: Record<
  FloatingLinesWave,
  FloatingLinesWavePosition
> = {
  top: { x: 10, y: 0.5, rotate: -0.4 },
  middle: { x: 5, y: 0, rotate: 0.2 },
  bottom: { x: 2, y: -0.7, rotate: -1 },
};

export const WAVE_SHAPE = {
  top: { offset: 1, step: 0.2, light: 0.2, flip: 1, depth: 1, drift: 0.6 },
  middle: { offset: 2, step: 0.15, light: 1, flip: 0, depth: 0, drift: 1 },
  bottom: {
    offset: 1.5,
    step: 0.2,
    light: 0.32,
    flip: 0,
    depth: 0.6,
    drift: 1.4,
  },
} satisfies Record<FloatingLinesWave, Record<string, number>>;

const LOOK: FloatingLinesLook = {
  linesGradient: ['#e945f5', '#ffffff'],
  lineStyle: 'solid',
  lineCount: 10,
  lineDistance: 6,
  lineWidth: 1,
  glow: 1,
  brightness: 1,
  animationSpeed: 1,
  amplitude: 1,
  depthOfField: 0.5,
  edgeFade: 0,
};

const PRESETS: Record<FloatingLinesPresetName, Partial<FloatingLinesLook>> = {
  signature: {},
  classic: { linesGradient: ['#e945f5', '#2f4bc0', '#e945f5'] },
  mono: { linesGradient: ['#ffffff', '#8b93a7'] },
  lagoon: { linesGradient: ['#5eead4', '#e0fff8'] },
  ember: { linesGradient: ['#ff7a45', '#ffd29a'] },
  dotted: { lineStyle: 'dotted', lineCount: 14, lineDistance: 4 },
  blueprint: {
    lineStyle: 'dashed',
    linesGradient: ['#7fb2ff', '#ffffff'],
    glow: 0.6,
  },
  calm: { animationSpeed: 0.5, amplitude: 0.7, glow: 0.6, edgeFade: 0.6 },
};

/** Full look for a named preset, ready to spread onto the component. */
export function floatingLinesPreset(
  name: FloatingLinesPresetName,
): FloatingLinesLook {
  const look = { ...LOOK, ...PRESETS[name] };
  return { ...look, linesGradient: [...look.linesGradient] };
}

export function isFloatingLinesPreset(
  value: unknown,
): value is FloatingLinesPresetName {
  return typeof value === 'string' && Object.hasOwn(PRESETS, value);
}
