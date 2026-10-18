import type { CSSProperties } from 'vue';

export type GradualBlurPosition = 'top' | 'bottom' | 'left' | 'right';

export type GradualBlurCurve =
  | 'linear'
  | 'bezier'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out';

export type GradualBlurTarget = 'parent' | 'page';

export interface GradualBlurProps {
  /** Edge the blur grows toward. */
  position?: GradualBlurPosition;
  /** Sit inside the nearest positioned parent, or stay fixed to the viewport edge. */
  target?: GradualBlurTarget;
  /** How far the blur reaches in from the edge. For left and right this is its width. Numbers are px. */
  height?: string | number;
  /** For top and bottom, a narrower centered band. For left and right, overrides height. */
  width?: string | number;
  /** How blurry the very edge gets. Each step adds about 12px of blur. */
  strength?: number;
  /** Blur layers stacked across the ramp, from 1 to 16. */
  layers?: number;
  /** How the blur builds across the ramp. */
  curve?: GradualBlurCurve;
  /** Doubles the blur toward the edge so it starts gently. */
  exponential?: boolean;
  /** Opacity of the blur layers. */
  opacity?: number;
  /** Color boost of the blurred content, building toward the edge. */
  saturation?: number;
  /** Color the content fades into at the edge. */
  tint?: string;
  /** Fades the blur out when the scroll container reaches this edge. */
  autoHide?: boolean;
  /** Scroll container watched by autoHide: a selector or an element. */
  container?: string | HTMLElement | null;
  /** Multiplies the blur while the cursor is over it. 0 clears it on hover. */
  hoverIntensity?: number;
  /** Length of the hover and autoHide transitions, in seconds or as a CSS time. */
  duration?: number | string;
  /** CSS easing of those transitions. */
  easing?: string;
  /** Stacking order of the overlay. */
  zIndex?: number;
  /** Extra classes for the overlay. */
  class?: string;
}

export interface GradualBlurStackOptions {
  layers: number;
  curve: GradualBlurCurve;
  strength: number;
  exponential: boolean;
  saturation: number;
  duration: number | string;
  easing: string;
  edge: GradualBlurPosition;
  opacity: number;
  tint: string;
}

export interface GradualBlurStack {
  steps: CSSProperties[];
  wash: CSSProperties | null;
}
