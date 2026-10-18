// Presets from @paper-design/shaders-react's paper-texture
// (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
import type { PaperTexturePreset, PaperTexturePresetName } from './types';

const objectSizing = {
  fit: 'contain',
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  originX: 0.5,
  originY: 0.5,
  worldWidth: 0,
  worldHeight: 0,
} as const;

const paperTextureDefaultPreset: PaperTexturePreset = {
  name: 'Default',
  params: {
    ...objectSizing,
    fit: 'contain',
    scale: 0.9,
    speed: 0,
    frame: 0,
    colorBack: '#d3d2ab',
    colorPaper: '#ffffff',
    colorShadow: '#cccccc',
    blending: 1,
    distortion: 0.75,
    clip: false,
    angle: 300,
    seed: 4,
    roughness: 0.4,
    roughnessSize: 0.5,
    roughnessRows: 0,
    fiber: 0.4,
    fiberSize: 0.5,
    folds: 0.5,
    foldSizeX: 1,
    foldSizeY: 1,
    foldOffsetX: 0,
    foldOffsetY: 0,
    wrinkles: 1,
    wrinkleSize: 0.65,
    crumples: 0,
    crumpleCount: 6,
    drops: 0.4,
  },
};

const paperTextureCreasedPreset: PaperTexturePreset = {
  name: 'Creased',
  params: {
    ...objectSizing,
    fit: 'contain',
    scale: 0.9,
    speed: 0,
    frame: 0,
    colorBack: '#d3d2ab',
    colorPaper: '#ffffff',
    colorShadow: '#b3b3b3',
    blending: 1,
    distortion: -0.5,
    clip: false,
    angle: 60,
    seed: 49,
    roughness: 0.4,
    roughnessSize: 0.25,
    roughnessRows: 0,
    fiber: 0.4,
    fiberSize: 0.5,
    folds: 0,
    foldSizeX: 0.6,
    foldSizeY: 0.89,
    foldOffsetX: 0.59,
    foldOffsetY: 1,
    wrinkles: 0,
    wrinkleSize: 0.65,
    crumples: 1,
    crumpleCount: 4,
    drops: 0,
  },
};

const paperTextureSpreadPreset: PaperTexturePreset = {
  name: 'Spread',
  params: {
    ...objectSizing,
    fit: 'contain',
    scale: 0.9,
    speed: 0,
    frame: 0,
    colorBack: '#ffffff00',
    colorPaper: '#ffffffb5',
    colorShadow: '#b3b3b3',
    blending: 1,
    distortion: -0.3,
    clip: true,
    angle: 236,
    seed: 613,
    roughness: 0.15,
    roughnessSize: 0.25,
    roughnessRows: 0,
    fiber: 0.5,
    fiberSize: 0.5,
    folds: 1,
    foldSizeX: 0.4,
    foldSizeY: 0.89,
    foldOffsetX: 0,
    foldOffsetY: 0,
    wrinkles: 0,
    wrinkleSize: 0.65,
    crumples: 0,
    crumpleCount: 9,
    drops: 0,
  },
};

const paperTextureFlatPreset: PaperTexturePreset = {
  name: 'Flat',
  params: {
    ...objectSizing,
    fit: 'contain',
    scale: 0.9,
    speed: 0,
    frame: 0,
    colorBack: '#d4cdab',
    colorPaper: '#ffffffa8',
    colorShadow: '#b3b3b3',
    blending: 1,
    distortion: 0,
    clip: false,
    angle: 0,
    seed: 455,
    roughness: 1,
    roughnessSize: 0.5,
    roughnessRows: 0.6,
    fiber: 0.7,
    fiberSize: 1,
    folds: 0,
    foldSizeX: 0,
    foldSizeY: 0.44,
    foldOffsetX: 0,
    foldOffsetY: 0,
    wrinkles: 0,
    wrinkleSize: 0,
    crumples: 0,
    crumpleCount: 6,
    drops: 0.2,
  },
};

export const paperTexturePresets: PaperTexturePreset[] = [
  paperTextureDefaultPreset,
  paperTextureSpreadPreset,
  paperTextureCreasedPreset,
  paperTextureFlatPreset,
];

export function isPaperTexturePresetName(
  value: unknown,
): value is PaperTexturePresetName {
  return paperTexturePresets.some((preset) => preset.name === value);
}

export function getPaperTexturePreset(
  name: PaperTexturePresetName,
): PaperTexturePreset {
  return (
    paperTexturePresets.find((preset) => preset.name === name) ??
    paperTextureDefaultPreset
  );
}
