import type { PeelDirection, StickerSettings } from './types';

export const defaultSettings: StickerSettings = {
  finish: 'holo',
  size: 0.74,
  border: 0.019,
  cutTolerance: 0.03,
  overlay: 'none',
  ink: 1,
  relief: 0.22,
  layersOn: true,
  layerDepth: 0.002,
  layerMaterials: ['gloss', 'auto', 'matte'],
  holoIntensity: 0.6,
  bands: 9,
  hueShift: 0,
  grain: 0,
  pattern: 'linear',
  peelDirection: 'top-right',
  peelAmount: 0.31,
  curl: 0.09,
  shadow: 0,
  light: { x: 0.65, y: 0.7 },
  background: 'transparent',
};

export const peelAngles: Record<PeelDirection, number> = {
  // angle of the direction the peel travels (from corner into the sticker)
  'top-right': (225 * Math.PI) / 180,
  top: (270 * Math.PI) / 180,
  'top-left': (315 * Math.PI) / 180,
  left: 0,
  'bottom-left': (45 * Math.PI) / 180,
  bottom: (90 * Math.PI) / 180,
  'bottom-right': (135 * Math.PI) / 180,
  right: Math.PI,
};
