// Presets from @paper-design/shaders-react's lens-distortion
// (https://github.com/paper-design/shaders, Apache-2.0, © Lost Coast Labs).
import type {
  PaperLensDistortionPreset,
  PaperLensDistortionPresetName,
} from './types';

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

const paperLensDistortionDefaultPreset: PaperLensDistortionPreset = {
  name: 'Default',
  params: {
    ...objectSizing,
    scale: 1,
    fit: 'contain',
    speed: 0,
    frame: 0,
    spread: 0.6,
    bias: 1,
    angle: 0,
    perspective: 0.1,
    count: 35,
    dispersion: 1,
    dispersionShift: 0,
    dispersionColor: 0.6,
    focusCenter: 0.8,
    focusEdges: 1,
    swirl: 0.35,
    noise: 0,
    noiseFrequency: 0.25,
    noiseOffset: 0,
    lensBulge: 0,
    lensCircle: 0,
    grainMixer: 0,
    grainOverlay: 0,
    imageX: 0,
    imageY: 0,
  },
};

const paperLensDistortionFisheyePreset: PaperLensDistortionPreset = {
  name: 'Fisheye',
  params: {
    ...objectSizing,
    scale: 1,
    fit: 'contain',
    speed: 0,
    frame: 0,
    spread: 0.7,
    bias: 1,
    angle: 0,
    perspective: 0.75,
    count: 15,
    dispersion: 1,
    dispersionShift: 0,
    dispersionColor: 0.7,
    focusCenter: 0.9,
    focusEdges: 1,
    swirl: 1,
    noise: 0,
    noiseFrequency: 0.25,
    noiseOffset: 0,
    lensBulge: 0.95,
    lensCircle: 1,
    grainMixer: 0.5,
    grainOverlay: 0,
    imageX: 0,
    imageY: 0,
  },
};

const paperLensDistortionDuotonePreset: PaperLensDistortionPreset = {
  name: 'Duotone',
  params: {
    ...objectSizing,
    fit: 'contain',
    speed: 0,
    frame: 0,
    spread: 0.1,
    bias: 0,
    angle: 0,
    perspective: 0,
    count: 2,
    dispersion: 1,
    dispersionShift: 0,
    dispersionColor: 0.1,
    focusCenter: 0,
    focusEdges: 0,
    swirl: 0,
    noise: 0,
    noiseFrequency: 0.25,
    noiseOffset: 0,
    lensBulge: 0,
    lensCircle: 0,
    grainMixer: 0.1,
    grainOverlay: 0.3,
    imageX: 0,
    imageY: 0,
  },
};

const paperLensDistortionSmokePreset: PaperLensDistortionPreset = {
  name: 'Smoke',
  params: {
    ...objectSizing,
    scale: 1,
    fit: 'contain',
    speed: 0,
    frame: 0,
    spread: 0.65,
    bias: -1,
    angle: 0,
    perspective: 0.4,
    count: 50,
    dispersion: 0,
    dispersionShift: 0,
    dispersionColor: 0.31,
    focusCenter: 0,
    focusEdges: 0.6,
    swirl: 0,
    noise: 1,
    noiseFrequency: 0.35,
    noiseOffset: 0.3,
    lensBulge: 0,
    lensCircle: 0,
    grainMixer: 0,
    grainOverlay: 0,
    imageX: 0,
    imageY: 0,
  },
};

export const paperLensDistortionPresets: PaperLensDistortionPreset[] = [
  paperLensDistortionDefaultPreset,
  paperLensDistortionFisheyePreset,
  paperLensDistortionDuotonePreset,
  paperLensDistortionSmokePreset,
];

export function isPaperLensDistortionPresetName(
  value: unknown,
): value is PaperLensDistortionPresetName {
  return paperLensDistortionPresets.some((preset) => preset.name === value);
}

export function getPaperLensDistortionPreset(
  name: PaperLensDistortionPresetName,
): PaperLensDistortionPreset {
  return (
    paperLensDistortionPresets.find((preset) => preset.name === name) ??
    paperLensDistortionDefaultPreset
  );
}
