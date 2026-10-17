// Presets from @paper-design/shaders-react 0.0.81
// (packages/shaders-react/src/shaders/metaballs.tsx, Apache-2.0, © Lost Coast Labs).
// The first entry is the default preset.
import type { PaperMetaballsProps } from '@registry/new-york/paper-metaballs/types';
import type { PaperShaderPreset } from '~/types/paper-presets';

export const paperMetaballsPresets: PaperShaderPreset<PaperMetaballsProps>[] = [
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
      colorBack: '#000000',
      colors: ['#6e33cc', '#ff5500', '#ffc105', '#ffc800', '#f585ff'],
      count: 10,
      size: 0.83,
    },
  },
  {
    name: 'Ink Drops',
    params: {
      fit: 'contain',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      originX: 0.5,
      originY: 0.5,
      speed: 2,
      frame: 0,
      colorBack: '#ffffff00',
      colors: ['#000000'],
      count: 18,
      size: 0.1,
    },
  },
  {
    name: 'Solar',
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
      colors: ['#ffc800', '#ff5500', '#ffc105'],
      colorBack: '#102f84',
      count: 7,
      size: 0.75,
    },
  },
  {
    name: 'Background',
    params: {
      fit: 'contain',
      scale: 4,
      rotation: 0,
      offsetX: -0.3,
      offsetY: 0,
      originX: 0.5,
      originY: 0.5,
      speed: 0.5,
      frame: 0,
      colors: ['#ae00ff', '#00ff95', '#ffc105'],
      colorBack: '#2a273f',
      count: 13,
      size: 0.81,
    },
  },
];
