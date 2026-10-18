import type {
  TopographyDirection,
  TopographyHoverEffect,
  TopographyMarkers,
  Vec3,
} from './types';

export const FOV = 0.32;
export const ORBIT = 9;
export const NEAR = 0.05;
export const FAR = 160;
export const HEIGHT = 1.7;
export const FREQUENCY = 0.45;
export const INTRO_SECONDS = 2.8;
export const MAX_PULSES = 4;
export const BLOOM_LEVELS = 4;
export const SCULPT_SIZE = 256;
export const SCULPT_SPAN = 48;
export const MAX_CELLS = 200000;
export const SUN: Vec3 = [-0.81, 0.58, -0.02];
export const DIRECTIONS: Record<
  TopographyDirection,
  readonly [number, number]
> = {
  forward: [0, 1],
  backward: [0, -1],
  left: [-1, 0],
  right: [1, 0],
};
export const HOVER_EFFECTS: readonly TopographyHoverEffect[] = [
  'lift',
  'trace',
  'light',
];
export const MARKER_STYLES: Record<TopographyMarkers, number> = {
  none: -1,
  plus: 0,
  dots: 1,
};
export const MARKER_SPACING = 1.25;
