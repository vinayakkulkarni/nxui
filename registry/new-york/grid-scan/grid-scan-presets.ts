import type { GridScanLook, GridScanPreset } from './types';

const LOOK: GridScanLook = {
  linesColor: '#4d4757',
  scanColor: '#7dd3fc',
  cells: 8,
  lineThickness: 1,
  lineStyle: 'solid',
  depth: 3,
  depthFade: 0.6,
  shading: 0.7,
  reflection: 0.35,
  points: true,
  scanDirection: 'forward',
  scanDuration: 2.4,
  scanDelay: 1.6,
  scanWidth: 1,
  trail: 0.5,
  glow: 0.6,
};

const PRESETS: Record<GridScanPreset, Partial<GridScanLook>> = {
  scan: {},
  laser: {
    scanColor: '#ff453a',
    scanWidth: 0.6,
    trail: 0.3,
    glow: 0.5,
    points: false,
    reflection: 0.55,
  },
  lidar: {
    scanColor: '#5eead4',
    cells: 6,
    trail: 0.9,
    scanDuration: 3.2,
    scanDelay: 0.8,
  },
  blueprint: {
    linesColor: '#5b6b8c',
    scanColor: '#f4f4f5',
    cells: 10,
    lineStyle: 'dashed',
    shading: 0.4,
    points: false,
  },
  deep: { cells: 10, depth: 8, trail: 0.7, scanDuration: 4 },
  wire: {
    linesColor: '#5c5666',
    scanColor: '#fbbf24',
    shading: 0,
    reflection: 0,
    points: false,
    glow: 0.35,
  },
  pulse: {
    scanColor: '#bef264',
    depth: 2.2,
    scanDirection: 'pingpong',
    scanDuration: 1.2,
    scanDelay: 0.2,
    trail: 0.25,
  },
};

const LIGHT_SWAP: Record<GridScanPreset, Partial<GridScanLook>> = {
  scan: { linesColor: '#d4d4d8', scanColor: '#0284c7' },
  laser: { linesColor: '#d4d4d8', scanColor: '#e5332a' },
  lidar: { linesColor: '#d4d4d8', scanColor: '#0d9488' },
  blueprint: { linesColor: '#94a3b8', scanColor: '#18181b' },
  deep: { linesColor: '#d4d4d8', scanColor: '#0284c7' },
  wire: { linesColor: '#a1a1aa', scanColor: '#d97706' },
  pulse: { linesColor: '#d4d4d8', scanColor: '#65a30d' },
};

/** The look of one of the React Bits demo presets, with its light-mode colors when `light` is set. */
export function gridScanPreset(
  name: GridScanPreset,
  light = false,
): GridScanLook {
  return {
    ...LOOK,
    ...PRESETS[name],
    ...(light ? LIGHT_SWAP[name] : {}),
  };
}

export function isGridScanPreset(value: unknown): value is GridScanPreset {
  return typeof value === 'string' && value in PRESETS;
}
