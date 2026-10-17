export type PixelTransitionPattern = 'random' | 'dither' | 'ripple' | 'wipe';
export type PixelTransitionAnimation = 'pop' | 'grow' | 'fade';
export type PixelTransitionShape = 'square' | 'rounded' | 'circle';
export type PixelTransitionTrigger = 'hover' | 'click';

export interface PixelTransitionProps {
  /** Number of pixels across the card. Rows follow so every pixel stays square. */
  gridSize?: number;
  /** Color of the pixels. Any CSS color works. */
  pixelColor?: string;
  /** Gives each pixel a slightly different tone of the pixel color, 0–1. */
  mosaic?: number;
  /** Seconds the pixels take to cover the card, and again to clear it. */
  animationStepDuration?: number;
  /** Order the pixels appear in. */
  pattern?: PixelTransitionPattern;
  /** Breaks up the ripple and wipe fronts, 0–1. */
  randomness?: number;
  /** How each pixel appears and disappears. */
  pixelAnimation?: PixelTransitionAnimation;
  /** Shape of the pixels while the transition runs. */
  pixelShape?: PixelTransitionShape;
  /** Space between pixels in px. */
  gap?: number;
  /** Caps redraws for a choppy retro feel. 0 redraws every frame. */
  fps?: number;
  /** What starts the transition. */
  trigger?: PixelTransitionTrigger;
  /** Controls the state from outside (use with v-model:active). */
  active?: boolean;
  /** Keeps the second content once it has been revealed. */
  once?: boolean;
  /** Percentages work like padding-top ('125%'), anything else is a CSS ratio ('4 / 5'). */
  aspectRatio?: string;
  class?: string;
}

export interface PixelTransitionSettings {
  gridSize: number;
  pixelColor: string;
  mosaic: number;
  duration: number;
  pattern: PixelTransitionPattern;
  randomness: number;
  animation: PixelTransitionAnimation;
  shape: PixelTransitionShape;
  gap: number;
  fps: number;
  once: boolean;
  reduce: boolean;
}

export interface PixelTransitionPoint {
  x: number;
  y: number;
}

export interface PixelTransitionEngine {
  go: (next: boolean, point: PixelTransitionPoint | null) => void;
  goal: () => number;
  resize: () => void;
  destroy: () => void;
}
