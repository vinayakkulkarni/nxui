export type RippleGridVariant = 'lines' | 'dots' | 'cross';
export type RippleGridAutoRipple = 'center' | 'random' | 'none';
export type RippleGridPreset = 'pulse' | 'floor' | 'dots' | 'cross' | 'calm';

export interface RippleGridProps {
  /** Color of the grid. Light mode derives its ink from it. */
  color?: string;
  /** Draws the grid as lines, dots at each crossing, or small crosses. */
  variant?: RippleGridVariant;
  /** Size of each grid cell, in px. */
  cellSize?: number;
  /** Width of the lines, in px. */
  lineWidth?: number;
  /** Soft glow around the lines. */
  glow?: number;
  /** How far ripples bend the grid and how brightly their crests light it. */
  rippleStrength?: number;
  /** How fast ripples travel outward. */
  rippleSpeed?: number;
  /** Wavelength of the ripples. */
  rippleSize?: number;
  /** Where idle ripples start: from the center, at random spots, or not at all. */
  autoRipple?: RippleGridAutoRipple;
  /** Seconds between idle ripples. */
  rippleInterval?: number;
  /** Lays the grid back in perspective, like a floor, in degrees. */
  tilt?: number;
  /** Turns the grid, in degrees. */
  rotation?: number;
  /** The cursor leaves a wake of small ripples and lights up the lines nearby. */
  mouseInteraction?: boolean;
  /** Clicking sends a strong ripple. */
  clickRipple?: boolean;
  /** Reveals the grid with a ripple from the center. */
  intro?: boolean;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Draws the grid as ink for light backgrounds. */
  lightMode?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

/** The grid shape shared by the demo presets. */
export interface RippleGridShape {
  variant: RippleGridVariant;
  cellSize: number;
  lineWidth: number;
  glow: number;
  rippleStrength: number;
  rippleSpeed: number;
  rippleSize: number;
  autoRipple: RippleGridAutoRipple;
  rippleInterval: number;
  tilt: number;
  rotation: number;
  fade: number;
}

export interface RippleGridDemoParams extends RippleGridShape {
  preset: RippleGridPreset;
  color: string;
  opacity: number;
  mouseInteraction: boolean;
  clickRipple: boolean;
  intro: boolean;
  lightMode: boolean;
}

export interface RippleGridSettings extends Omit<RippleGridShape, 'variant'> {
  color: string;
  variant: number;
  mouseInteraction: boolean;
  clickRipple: boolean;
  intro: boolean;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
}

export interface RippleGridEngine {
  /** Advances one frame. Returns false when the loop can stop. */
  frame: (now: number) => boolean;
  /** Redraws once and resizes when the pixel ratio changed. */
  update: (idle: boolean) => void;
  resize: (width: number, height: number) => void;
  /** Pointer position relative to the container, in CSS px from the top-left. */
  pointerMove: (x: number, y: number, inside: boolean) => void;
  pointerDown: (x: number, y: number, inside: boolean) => void;
  pointerLeave: () => void;
  resetClock: () => void;
  dispose: () => void;
}
