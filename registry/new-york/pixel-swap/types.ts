export type PixelSwapPattern =
  | 'pointer'
  | 'random'
  | 'center'
  | 'edges'
  | 'left-to-right'
  | 'right-to-left'
  | 'top-to-bottom'
  | 'bottom-to-top'
  | 'diagonal'
  | 'spiral';

export type PixelSwapTrigger = 'hover' | 'click' | 'none';

export interface PixelSwapProps {
  /** Order the pixels arrive in. 'pointer' starts the wave where the cursor enters, leaves or clicks. */
  pattern?: PixelSwapPattern;
  /** Edge length of each pixel in px. Grows automatically when the grid would pass 600 pixels. */
  pixelSize?: number;
  /** Space between pixels in px while they grow. */
  gap?: number;
  /** Corner rounding of the pixels while they grow, as a percentage. 50 starts them as dots. */
  pixelRadius?: number;
  /** Size each pixel pops in at, from 0 to grow out of nothing to 0.9 for a hard pop. */
  pixelScale?: number;
  /** Degrees each pixel turns as it grows in. */
  pixelSpin?: number;
  /** Time in ms the wave takes to cross the content. */
  duration?: number;
  /** Time in ms a single pixel takes to grow. */
  pixelDuration?: number;
  /** Noise mixed into the pattern, from 0 for a clean wave to 1 for a scatter. */
  randomness?: number;
  /** How far each pixel overshoots before it settles, from 0 to 1. */
  bounce?: number;
  /** What starts the swap. With 'none', drive it with active. */
  trigger?: PixelSwapTrigger;
  /** Builds the first content in from pixels on mount. */
  intro?: boolean;
  /** Starts on the second content. */
  initialActive?: boolean;
  /** Controls which content shows. Pair it with `update:active` (or use `v-model:active`). */
  active?: boolean;
  /** Aspect ratio of the root. */
  aspectRatio?: string;
  class?: string;
}

export interface PixelSwapSettings {
  pattern: PixelSwapPattern;
  pixelSize: number;
  gap: number;
  pixelRadius: number;
  pixelScale: number;
  pixelSpin: number;
  duration: number;
  pixelDuration: number;
  randomness: number;
  bounce: number;
}

export interface PixelSwapGrid {
  count: number;
  size: number;
  stride: number;
  gap: number;
  width: number;
  height: number;
  cx: Float32Array;
  cy: Float32Array;
  gx: Float32Array;
  gy: Float32Array;
}

export type PixelSwapMode = 'intro' | 'swap';

export interface PixelSwapEngine {
  mode: PixelSwapMode;
  grid: PixelSwapGrid;
  value: Float32Array;
  velocity: Float32Array;
  flipAt: Float64Array;
  target: Uint8Array;
  desired: number;
  last: number;
  running: boolean;
}

export interface PixelSwapPoint {
  x: number;
  y: number;
}
