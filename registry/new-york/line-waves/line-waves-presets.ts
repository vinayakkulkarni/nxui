import type { LineWavesLook, LineWavesPreset } from './types';

const LOOK: LineWavesLook = {
  color1: '#ffffff',
  color2: '#ffffff',
  color3: '#ffffff',
  colorCycleSpeed: 1,
  speed: 0.3,
  lineCount: 72,
  lineWidth: 1.3,
  glow: 0.6,
  brightness: 1,
  highlight: 1,
  highlightWidth: 1,
  warpIntensity: 1,
  warpScale: 1,
  rotation: -33,
};

const PRESETS: Record<LineWavesPreset, LineWavesLook> = {
  silk: LOOK,
  gold: { ...LOOK, color1: '#ffd9a0', color2: '#ffb45e', color3: '#fff0d6' },
  arctic: { ...LOOK, color1: '#cfe9ff', color2: '#7cc0ff', color3: '#eef8ff' },
  aurora: { ...LOOK, color1: '#8ff0d0', color2: '#7aa8ff', color3: '#5fd3e6' },
  engraving: { ...LOOK, lineCount: 130, lineWidth: 0.8, glow: 0.25 },
  ribbon: { ...LOOK, lineCount: 34, lineWidth: 3, glow: 0.9 },
  storm: { ...LOOK, speed: 0.55, warpIntensity: 1.6, warpScale: 0.8 },
  calm: { ...LOOK, speed: 0.15, warpIntensity: 0.6, highlightWidth: 1.8 },
};

/** The look of one of the demo presets. */
export function lineWavesPreset(name: LineWavesPreset): LineWavesLook {
  return { ...PRESETS[name] };
}

export function isLineWavesPreset(value: unknown): value is LineWavesPreset {
  return typeof value === 'string' && value in PRESETS;
}
