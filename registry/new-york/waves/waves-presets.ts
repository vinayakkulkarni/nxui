import type { WavesPreset, WavesShape } from './types';

const SHAPE: WavesShape = {
  lineStyle: 'solid',
  spacing: 10,
  lineWidth: 1,
  rotation: 0,
  amplitude: 32,
  scale: 1,
  twist: 1,
  speed: 1,
  variation: 0,
  mouseRadius: 175,
  mouseStrength: 1,
  bounce: 0.5,
  returnDuration: 1.4,
  fade: 0,
};

const PRESETS: Record<WavesPreset, WavesShape> = {
  classic: { ...SHAPE },
  silk: {
    ...SHAPE,
    spacing: 6,
    lineWidth: 0.75,
    amplitude: 40,
    scale: 1.3,
    twist: 0.8,
    speed: 0.6,
    returnDuration: 2,
  },
  tide: {
    ...SHAPE,
    rotation: 90,
    spacing: 12,
    amplitude: 28,
    scale: 1.4,
    twist: 0.9,
    speed: 0.8,
  },
  rain: {
    ...SHAPE,
    lineStyle: 'dashed',
    spacing: 12,
    rotation: 8,
    amplitude: 28,
    speed: 1.6,
  },
  dune: {
    ...SHAPE,
    amplitude: 40,
    scale: 1.1,
    twist: 1.5,
    speed: 1.6,
    bounce: 0.65,
  },
};

/** The shape props of one of the demo presets. Colors are left to you. */
export function wavesPreset(name: WavesPreset): WavesShape {
  return { ...PRESETS[name] };
}

export function isWavesPreset(value: unknown): value is WavesPreset {
  return typeof value === 'string' && value in PRESETS;
}
