// Presets from @paper-design/shaders-react 0.0.81
// (packages/shaders-react/src/shaders/neuro-noise.tsx, Apache-2.0, © Lost Coast Labs).
// The first entry is the default preset.
import type { PaperNeuroNoiseProps } from '@registry/new-york/paper-neuro-noise/types';
import type { PaperShaderPreset } from '~/types/paper-presets';

export const paperNeuroNoisePresets: PaperShaderPreset<PaperNeuroNoiseProps>[] =
  [
    {
      name: 'Default',
      params: {
        fit: 'none',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        originX: 0.5,
        originY: 0.5,
        speed: 1,
        frame: 0,
        colorFront: '#ffffff',
        colorMid: '#47a6ff',
        colorBack: '#000000',
        brightness: 0.05,
        contrast: 0.3,
      },
    },
    {
      name: 'Sensation',
      params: {
        fit: 'none',
        scale: 3,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        originX: 0.5,
        originY: 0.5,
        speed: 1,
        frame: 0,
        colorFront: '#00c8ff',
        colorMid: '#fbff00',
        colorBack: '#8b42ff',
        brightness: 0.19,
        contrast: 0.12,
      },
    },
    {
      name: 'Bloodstream',
      params: {
        fit: 'none',
        scale: 0.7,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        originX: 0.5,
        originY: 0.5,
        speed: 1,
        frame: 0,
        colorFront: '#ff0000',
        colorMid: '#ff0000',
        colorBack: '#ffffff',
        brightness: 0.24,
        contrast: 0.17,
      },
    },
    {
      name: 'Ghost',
      params: {
        fit: 'none',
        scale: 0.55,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        originX: 0.5,
        originY: 0.5,
        speed: 1,
        frame: 0,
        colorFront: '#ffffff',
        colorMid: '#000000',
        colorBack: '#ffffff',
        brightness: 0,
        contrast: 1,
      },
    },
  ];
