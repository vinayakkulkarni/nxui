// Presets from @paper-design/shaders-react 0.0.81
// (packages/shaders-react/src/shaders/heatmap.tsx, Apache-2.0, © Lost Coast Labs).
// The first entry is the default preset.
import type { PaperHeatmapProps } from '@registry/new-york/paper-heatmap/types';
import type { PaperShaderPreset } from '~/types/paper-presets';

export const paperHeatmapPresets: PaperShaderPreset<
  Omit<PaperHeatmapProps, 'image'>
>[] = [
  {
    name: 'Default',
    params: {
      fit: 'contain',
      scale: 0.75,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      originX: 0.5,
      originY: 0.5,
      speed: 1,
      frame: 0,
      contour: 0.5,
      angle: 0,
      noise: 0,
      innerGlow: 0.5,
      outerGlow: 0.5,
      colorBack: '#000000',
      colors: [
        '#11206a',
        '#1f3ba2',
        '#2f63e7',
        '#6bd7ff',
        '#ffe679',
        '#ff991e',
        '#ff4c00',
      ],
    },
  },
  {
    name: 'Sepia',
    params: {
      fit: 'contain',
      scale: 0.75,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      originX: 0.5,
      originY: 0.5,
      speed: 0.5,
      frame: 0,
      contour: 0.5,
      angle: 0,
      noise: 0.75,
      innerGlow: 0.5,
      outerGlow: 0.5,
      colorBack: '#000000',
      colors: ['#997F45', '#ffffff'],
    },
  },
];
