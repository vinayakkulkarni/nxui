// Presets from @paper-design/shaders-react 0.0.81
// (packages/shaders-react/src/shaders/simplex-noise.tsx, Apache-2.0, © Lost Coast Labs).
// The first entry is the default preset.
import type { PaperSimplexNoiseProps } from '@registry/new-york/paper-simplex-noise/types';
import type { PaperShaderPreset } from '~/types/paper-presets';

export const paperSimplexNoisePresets: PaperShaderPreset<PaperSimplexNoiseProps>[] =
  [
    {
      name: 'Default',
      params: {
        fit: 'none',
        scale: 0.6,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        originX: 0.5,
        originY: 0.5,
        speed: 0.5,
        frame: 0,
        colors: ['#4449CF', '#FFD1E0', '#F94446', '#FFD36B', '#FFFFFF'],
        stepsPerColor: 2,
        softness: 0,
      },
    },
    {
      name: 'Spots',
      params: {
        fit: 'none',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        originX: 0.5,
        originY: 0.5,
        speed: 0.6,
        frame: 0,
        colors: ['#ff7b00', '#f9ffeb', '#320d82'],
        stepsPerColor: 1,
        softness: 0,
      },
    },
    {
      name: 'First contact',
      params: {
        fit: 'none',
        scale: 0.2,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        originX: 0.5,
        originY: 0.5,
        speed: 2,
        frame: 0,
        colors: ['#e8cce6', '#120d22', '#442c44', '#e6baba', '#fff5f5'],
        stepsPerColor: 2,
        softness: 0,
      },
    },
    {
      name: 'Bubblegum',
      params: {
        fit: 'none',
        scale: 1.6,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        originX: 0.5,
        originY: 0.5,
        speed: 2,
        frame: 0,
        colors: ['#ffffff', '#ff9e9e', '#5f57ff', '#00f7ff'],
        stepsPerColor: 1,
        softness: 1,
      },
    },
  ];
