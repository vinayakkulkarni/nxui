export type CrosshairLineStyle = 'solid' | 'dashed' | 'dotted';
export type CrosshairTargetEffect = 'lock' | 'glitch' | 'none';
export type CrosshairBlendMode = 'normal' | 'difference';

export interface CrosshairProps {
  /** Color of the lines, labels and brackets. */
  color?: string;
  /**
   * Keeps the crosshair inside this element (needs a non-static position).
   * Without it the crosshair covers the whole viewport.
   */
  container?: HTMLElement | null;
  /** Line thickness in px. */
  thickness?: number;
  /** Opacity of everything the crosshair draws. */
  opacity?: number;
  lineStyle?: CrosshairLineStyle;
  /** Empty space in px left around the pointer where the lines would cross. */
  gap?: number;
  /** How much the lines fade out toward the edges, 0–1. */
  fade?: number;
  /** How far the lines trail behind the pointer. 0 sticks to it. */
  smoothing?: number;
  /** Pointer position where the lines meet the edges, and locked-target size. */
  showCoordinates?: boolean;
  targetEffect?: CrosshairTargetEffect;
  /** CSS selector for the elements the crosshair reacts to. */
  targetSelector?: string;
  /** Ring out from the pointer on every click or tap. */
  clickPulse?: boolean;
  /** Hides the system cursor inside the area and draws a dot instead. */
  hideCursor?: boolean;
  blendMode?: CrosshairBlendMode;
  class?: string;
}

export interface CrosshairInk {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface CrosshairPulse {
  x: number;
  y: number;
  age: number;
}

export interface CrosshairBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CrosshairSettings {
  color: string;
  thickness: number;
  opacity: number;
  lineStyle: CrosshairLineStyle;
  gap: number;
  fade: number;
  smoothing: number;
  showCoordinates: boolean;
  targetEffect: CrosshairTargetEffect;
  targetSelector: string;
  clickPulse: boolean;
  hideCursor: boolean;
}
