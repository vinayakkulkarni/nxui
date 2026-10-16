export type GlareHoverMode = 'hover' | 'follow' | 'loop' | 'click';
export type GlareHoverVariant = 'streak' | 'twin' | 'sheen';
export type GlareHoverBlendMode =
  | 'screen'
  | 'normal'
  | 'overlay'
  | 'soft-light';

export interface GlareHoverProps {
  /** CSS width of the wrapper. */
  width?: string;
  /** CSS height of the wrapper. */
  height?: string;
  /** CSS background of the wrapper. */
  background?: string;
  /** CSS border radius of the wrapper. */
  borderRadius?: string;
  /** CSS color of the 1px border. */
  borderColor?: string;
  /** Color of the glare. */
  glareColor?: string;
  /** Peak opacity of the glare, 0–1. */
  glareOpacity?: number;
  /** Direction the glare travels, in degrees. */
  glareAngle?: number;
  /** Width of the glare as a percentage of the element's diagonal. */
  glareSize?: number;
  /** Edge softness of the glare, 0–1. */
  softness?: number;
  /** Shape of the glare. */
  variant?: GlareHoverVariant;
  /** How the glare mixes with the content. */
  blendMode?: GlareHoverBlendMode;
  /** Lets the edge catch the light where the glare crosses it. */
  rimGlint?: boolean;
  /** Sweep on hover, follow the cursor, shine on a timer, or sweep on click. */
  mode?: GlareHoverMode;
  /** How long one sweep takes, in milliseconds. */
  transitionDuration?: number;
  /** Seconds between sweeps in loop mode. */
  interval?: number;
  /** In hover mode, sweeps only on the way in. */
  playOnce?: boolean;
  /** Sweeps once when the element first scrolls into view. */
  intro?: boolean;
  class?: string;
}

export interface GlareSettings {
  glareAngle: number;
  glareSize: number;
  transitionDuration: number;
  interval: number;
  playOnce: boolean;
  intro: boolean;
  reduce: boolean;
}

export interface GlareElements {
  root: HTMLElement;
  glare: HTMLElement;
  bands: () => HTMLElement[];
}

export interface GlareEngine {
  measure: () => void;
  destroy: () => void;
}
