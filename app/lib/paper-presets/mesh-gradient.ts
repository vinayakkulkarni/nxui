// Presets from @paper-design/shaders-react 0.0.81
// (packages/shaders-react/src/shaders/mesh-gradient.tsx, Apache-2.0, © Lost Coast Labs).
// The first entry is the default preset.
import type { PaperMeshGradientProps } from '@registry/new-york/paper-mesh-gradient/types';
import type { PaperShaderPreset } from '~/types/paper-presets';

export const paperMeshGradientPresets: PaperShaderPreset<PaperMeshGradientProps>[] =
  [
    {
      name: 'Default',
      params: {
        fit: 'contain',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        originX: 0.5,
        originY: 0.5,
        speed: 1,
        frame: 0,
        colors: ['#e0eaff', '#241d9a', '#f75092', '#9f50d3'],
        distortion: 0.8,
        swirl: 0.1,
        grainMixer: 0,
        grainOverlay: 0,
      },
    },
    {
      name: 'Ink',
      params: {
        fit: 'contain',
        scale: 1,
        rotation: 90,
        offsetX: 0,
        offsetY: 0,
        originX: 0.5,
        originY: 0.5,
        speed: 1,
        frame: 0,
        colors: ['#ffffff', '#000000'],
        distortion: 1,
        swirl: 0.2,
        grainMixer: 0,
        grainOverlay: 0,
      },
    },
    {
      name: 'Purple',
      params: {
        fit: 'contain',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        originX: 0.5,
        originY: 0.5,
        speed: 0.6,
        frame: 0,
        colors: ['#aaa7d7', '#3c2b8e'],
        distortion: 1,
        swirl: 1,
        grainMixer: 0,
        grainOverlay: 0,
      },
    },
    {
      name: 'Beach',
      params: {
        fit: 'contain',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        originX: 0.5,
        originY: 0.5,
        speed: 0.1,
        frame: 0,
        colors: ['#bcecf6', '#00aaff', '#00f7ff', '#ffd447'],
        distortion: 0.8,
        swirl: 0.35,
        grainMixer: 0,
        grainOverlay: 0,
      },
    },
  ];
