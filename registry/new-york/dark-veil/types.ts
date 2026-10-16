export type DarkVeilPreset = 'veil' | 'ember' | 'jade' | 'silver' | 'storm';

export interface DarkVeilProps {
  /** Color of the veil. Highlights are derived from it. */
  color?: string;
  /** Animation speed. */
  speed?: number;
  /** Zoom of the veil. Higher values zoom in. */
  scale?: number;
  /** Turns the veil around the center, in degrees. */
  rotation?: number;
  /** How much the veil drifts and changes shape over time. */
  flow?: number;
  /** Adds a gentle ripple to the veil. */
  warp?: number;
  /** Picks a different veil shape. Any number works. */
  variation?: number;
  /** Overall brightness. */
  brightness?: number;
  /** Strength of the silky highlights along the folds. They follow the cursor like a light. */
  sheen?: number;
  /** Soft glow around the brightest parts. */
  glow?: number;
  /** Strength of the film grain. */
  grain?: number;
  /** Resolution of the veil, from 0.25 to 1. Lower is faster; the veil is soft, so 0.5 looks the same. */
  quality?: number;
  /** Bends the veil and lights it up around the cursor. */
  mouseInteraction?: boolean;
  /** How strongly the cursor bends the veil. */
  mouseStrength?: number;
  /** Fades the veil in as it unfolds. */
  intro?: boolean;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Draws the veil as colored ink for light backgrounds. */
  lightMode?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. Defaults to the screen's ratio. */
  dpr?: number;
  class?: string;
}

export interface DarkVeilSettings {
  color: string;
  speed: number;
  scale: number;
  rotation: number;
  flow: number;
  warp: number;
  variation: number;
  brightness: number;
  sheen: number;
  glow: number;
  grain: number;
  quality: number;
  mouseInteraction: boolean;
  mouseStrength: number;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr: number | undefined;
}

/** The props a demo preset sets. */
export interface DarkVeilLook {
  color: string;
  speed: number;
  scale: number;
  rotation: number;
  flow: number;
  warp: number;
  variation: number;
  sheen: number;
  glow: number;
}

export interface DarkVeilEngine {
  /** Advances one frame. Returns false once nothing is moving, so the loop can stop. */
  frame: (now: number) => boolean;
  /** Applies new settings: resizes on a quality or dpr change, otherwise redraws when the loop is idle. */
  update: (idle: boolean) => void;
  resize: (width: number, height: number) => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (x: number, y: number, inside: boolean) => void;
  pointerLeave: () => void;
  resetClock: () => void;
  dispose: () => void;
}
