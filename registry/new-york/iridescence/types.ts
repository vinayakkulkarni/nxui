/** Any CSS color, or an RGB array from 0 to 1. */
export type IridescenceColor = string | number[];

export type IridescencePreset =
  | 'classic'
  | 'pearl'
  | 'chrome'
  | 'graphite'
  | 'oil';

export interface IridescenceProps {
  /** Tint multiplied over the colors. Any CSS color, or an RGB array from 0 to 1. */
  color?: IridescenceColor;
  /** Animation speed. 0 holds the pattern still. */
  speed?: number;
  /** How far the pattern drifts toward the pointer. */
  amplitude?: number;
  /** Turns the pointer interactions on or off: parallax, stir and sheen. */
  mouseReact?: boolean;
  /** Size of the pattern. Higher values give broader folds. */
  scale?: number;
  /** How many layers of folds are stacked, from 1 to 24. */
  detail?: number;
  /** Rotation of the pattern in degrees. */
  rotation?: number;
  /** How strongly the folds bend into each other. */
  warp?: number;
  /** Rotates the hues, in degrees. */
  hueShift?: number;
  /** Color intensity. 0 gives a monochrome chrome look. */
  saturation?: number;
  /** Overall brightness. */
  brightness?: number;
  /** Contrast between the folds. */
  contrast?: number;
  /** Drags the folds along with the pointer like a liquid. 0 turns it off. */
  stir?: number;
  /** Brightens the surface softly around the pointer. */
  sheen?: number;
  /** Stirs a swirl into the surface wherever you click, which slowly unwinds. */
  clickSwirl?: boolean;
  /** Film grain over the surface, from 0 to 1. */
  grain?: number;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Render scale, from 0.1 to 2. Lower values trade sharpness for speed. */
  resolution?: number;
  /** Freezes the animation. */
  paused?: boolean;
  class?: string;
}

export interface IridescenceSettings {
  colorKey: string;
  color: IridescenceColor;
  speed: number;
  amplitude: number;
  mouseReact: boolean;
  scale: number;
  detail: number;
  rotation: number;
  warp: number;
  hueShift: number;
  saturation: number;
  brightness: number;
  contrast: number;
  stir: number;
  sheen: number;
  clickSwirl: boolean;
  grain: number;
  fade: number;
  opacity: number;
  resolution: number;
  paused: boolean;
}

/** The props a demo preset sets. */
export interface IridescenceLook {
  color: string;
  hueShift: number;
  saturation: number;
  brightness: number;
  contrast: number;
  speed: number;
  scale: number;
  detail: number;
  warp: number;
  rotation: number;
  mouseReact: boolean;
  amplitude: number;
  stir: number;
  sheen: number;
  clickSwirl: boolean;
  grain: number;
  fade: number;
}

export interface IridescenceEngine {
  /** Advances one frame. Returns false once nothing is moving, so the loop can stop. */
  frame: (now: number) => boolean;
  /** Redraws with the current settings, resizing first if the render scale changed. */
  update: () => void;
  resize: (width: number, height: number) => void;
  /** Pointer position as 0..1 of the container, y up. */
  pointerMove: (x: number, y: number) => void;
  pointerLeave: () => void;
  /** Starts a swirl at a point (0..1, y up). Returns true if one was added. */
  swirl: (x: number, y: number) => boolean;
  resetClock: () => void;
  dispose: () => void;
}
