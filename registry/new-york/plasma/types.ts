export type PlasmaDirection = 'forward' | 'reverse' | 'pingpong';
export type PlasmaPreset = 'silver' | 'copper' | 'ocean' | 'jade' | 'vortex';

export interface PlasmaProps {
  /** Color of the plasma. Highlights are derived from it. */
  color?: string;
  /** Animation speed. */
  speed?: number;
  /** Which way the plasma flows. Ping pong eases back and forth. */
  direction?: PlasmaDirection;
  /** Zoom of the plasma. Higher values zoom in. */
  scale?: number;
  /** How tightly the plasma spirals. */
  twist?: number;
  /** How much the plasma ripples as it flows. */
  wave?: number;
  /** How soft the folds of light are, from 0 for crisp to 1 for misty. */
  softness?: number;
  /** Strength of the bright highlights along the folds. */
  shine?: number;
  /** Overall brightness. */
  brightness?: number;
  /** Strength of the film grain. */
  grain?: number;
  /** Render resolution, from 0.25 to 1. Lower values run faster on slow devices. */
  quality?: number;
  /** Turns the plasma in 3D to follow the cursor and brightens it nearby. */
  mouseInteractive?: boolean;
  /** Fades the plasma in as it twists into place. */
  intro?: boolean;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Draws the plasma as tinted satin for light backgrounds. */
  lightMode?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

/** The look shared by the demo presets. */
export interface PlasmaLook {
  color: string;
  speed: number;
  twist: number;
  wave: number;
  softness: number;
  shine: number;
}

export interface PlasmaDemoParams extends PlasmaLook {
  preset: PlasmaPreset;
  direction: PlasmaDirection;
  scale: number;
  brightness: number;
  grain: number;
  quality: number;
  fade: number;
  opacity: number;
  mouseInteractive: boolean;
  intro: boolean;
  lightMode: boolean;
}

export interface PlasmaSettings extends PlasmaLook {
  direction: PlasmaDirection;
  scale: number;
  brightness: number;
  grain: number;
  quality: number;
  mouseInteractive: boolean;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
}

export interface PlasmaEngine {
  /** Advances one frame. Returns false when the loop can stop. */
  frame: (now: number) => boolean;
  /** Redraws once and resizes when quality or pixel ratio changed. */
  update: (idle: boolean) => void;
  resize: (width: number, height: number) => void;
  /** Pointer position relative to the container, in CSS px from the top-left. */
  pointerMove: (x: number, y: number, inside: boolean) => void;
  pointerLeave: () => void;
  resetClock: () => void;
  dispose: () => void;
}
