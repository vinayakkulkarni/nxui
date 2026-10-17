import type { IridescenceLook, IridescencePreset } from './types';

const LOOK: IridescenceLook = {
  color: '#8099cc',
  hueShift: 0,
  saturation: 1,
  brightness: 1.5,
  contrast: 1,
  speed: 1,
  scale: 1,
  detail: 8,
  warp: 1,
  rotation: 0,
  mouseReact: true,
  amplitude: 0.1,
  stir: 0.5,
  sheen: 0.3,
  clickSwirl: true,
  grain: 0,
  fade: 0,
};

const PRESETS: Record<IridescencePreset, Partial<IridescenceLook>> = {
  classic: {},
  pearl: {
    color: '#ffffff',
    saturation: 0.55,
    brightness: 1,
    contrast: 0.85,
    scale: 1.4,
  },
  chrome: {
    color: '#ffffff',
    saturation: 0,
    contrast: 2.2,
    brightness: 0.55,
    detail: 12,
  },
  graphite: {
    color: '#ffffff',
    saturation: 0,
    contrast: 3,
    brightness: 0.35,
    detail: 9,
    scale: 0.9,
  },
  oil: {
    color: '#ffffff',
    saturation: 1.4,
    brightness: 0.35,
    contrast: 2.2,
    detail: 12,
    scale: 1.3,
  },
};

/** The look of one of the demo presets. */
export function iridescencePreset(name: IridescencePreset): IridescenceLook {
  return { ...LOOK, ...PRESETS[name] };
}

export function isIridescencePreset(
  value: unknown,
): value is IridescencePreset {
  return typeof value === 'string' && value in PRESETS;
}
