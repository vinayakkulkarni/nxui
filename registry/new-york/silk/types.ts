export type SilkPreset =
  | 'satin'
  | 'classic'
  | 'champagne'
  | 'midnight'
  | 'emerald'
  | 'graphite'
  | 'velvet';

export interface SilkProps {
  /** How fast the folds flow. */
  speed?: number;
  /** Size of the folds. Higher values pack more in. */
  scale?: number;
  /** Color of the silk. */
  color?: string;
  /** Tint of the glossy highlights, blended with the silk color. */
  sheenColor?: string;
  /** Strength of the fine grain over the fabric. */
  noiseIntensity?: number;
  /** Turns the folds, in radians. */
  rotation?: number;
  /** Strength of the glossy highlights that run along the folds. */
  sheen?: number;
  /** How deep the folds look, from flat at 0 to deep, shaded creases at 1. */
  depth?: number;
  /** Soft glow around the brightest folds. */
  glow?: number;
  /** Strength of the fine ripples running through the folds. 0 smooths them out. */
  ripple?: number;
  /** How much the folds sway as they flow. */
  wave?: number;
  /** Picks a different arrangement of folds. Any number works. */
  variation?: number;
  /** The light turns to follow the cursor and the fabric drags along with it. */
  mouseInteraction?: boolean;
  /** How strongly the cursor moves the fabric and its light. */
  interactionStrength?: number;
  /** Clicking sends a ripple rolling through the fabric. */
  clickRipple?: boolean;
  /** The folds rise out of the dark and settle when the silk first appears. */
  intro?: boolean;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Draws pale silk with white highlights for light backgrounds. */
  lightMode?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

/** The tunable look shared by the demo presets. */
export interface SilkLook {
  color: string;
  sheenColor: string;
  speed: number;
  scale: number;
  rotation: number;
  sheen: number;
  depth: number;
  glow: number;
  ripple: number;
  wave: number;
  variation: number;
  noiseIntensity: number;
}

export interface SilkDemoParams extends SilkLook {
  preset: SilkPreset;
  mouseInteraction: boolean;
  interactionStrength: number;
  clickRipple: boolean;
  intro: boolean;
  fade: number;
  lightMode: boolean;
}

export interface SilkSettings extends SilkLook {
  mouseInteraction: boolean;
  interactionStrength: number;
  clickRipple: boolean;
  intro: boolean;
  fade: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
}

export interface SilkEngine {
  /** Advances one frame. Returns false when the loop should stop. */
  frame: (now: number) => boolean;
  /** Applies new settings: resizes on a pixel-ratio change, otherwise redraws when the loop is idle. */
  update: (idle: boolean) => void;
  resize: (width: number, height: number) => void;
  setVisible: (visible: boolean) => void;
  /** Pointer position relative to the container, in CSS px from the top-left. */
  pointerMove: (x: number, y: number, inside: boolean) => void;
  pointerDown: (x: number, y: number, inside: boolean) => void;
  pointerLeave: () => void;
  resetClock: () => void;
  dispose: () => void;
}
