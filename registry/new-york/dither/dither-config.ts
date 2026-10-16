import type { DitherProps, DitherSettings } from './types';

const MODES: Record<string, number> = {
  bayer: 0,
  bayer4: 1,
  bayer2: 2,
  halftone: 3,
  lines: 4,
  crosshatch: 5,
  noise: 6,
  none: 7,
};
const EFFECTS: Record<string, number> = {
  erase: 0,
  reveal: 1,
  ripple: 2,
};
export const MAX_TRAIL = 16;
export const MAX_RIPPLES = 4;
export const MAX_PALETTE = 8;
export const INTRO_SECONDS = 1.8;
export const RIPPLE_SECONDS = 1.6;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** sRGB channel (0..1) to linear. */
export function toLinear(value: number) {
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

/** Clamps raw props into the ranges the renderer expects. */
export function resolveSettings(
  props: Required<Omit<DitherProps, 'dpr' | 'class' | 'palette'>> & {
    dpr?: number;
    palette?: string[];
  },
): DitherSettings {
  return {
    waveSpeed: props.waveSpeed,
    waveFrequency: props.waveFrequency,
    waveAmplitude: props.waveAmplitude,
    waveColor: props.waveColor,
    backgroundColor: props.backgroundColor,
    colorNum: Math.max(2, props.colorNum),
    pixelSize: Math.max(1, props.pixelSize),
    disableAnimation: props.disableAnimation,
    enableMouseInteraction: props.enableMouseInteraction,
    mouseRadius: Math.max(0.001, props.mouseRadius),
    mode: MODES[props.ditherMode] ?? 0,
    palette: Array.isArray(props.palette)
      ? props.palette.filter(Boolean).slice(0, MAX_PALETTE)
      : [],
    scale: Math.max(0.05, props.scale),
    contrast: props.contrast,
    brightness: props.brightness,
    effect: EFFECTS[props.mouseEffect] ?? 0,
    mouseStrength: Math.max(0, props.mouseStrength),
    trail: clamp(props.trail, 0, 1),
    clickRipple: props.clickRipple,
    intro: props.intro,
    dpr: props.dpr,
  };
}
