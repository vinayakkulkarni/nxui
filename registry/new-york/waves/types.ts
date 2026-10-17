export type WavesLineStyle = 'solid' | 'dashed';
export type WavesPreset = 'classic' | 'silk' | 'tide' | 'rain' | 'dune';

export interface WavesProps {
  /** Color of the lines. */
  lineColor?: string;
  /** Color the lines take on where the cursor or a click pushes them. Defaults to `lineColor`. */
  accentColor?: string;
  /** Background behind the lines. */
  backgroundColor?: string;
  /** Draws solid lines, or dashes that stream along them. */
  lineStyle?: WavesLineStyle;
  /** Space between the lines, in px. */
  spacing?: number;
  /** Width of the lines, in px. */
  lineWidth?: number;
  /** Turns the lines, in degrees. 90 lays them flat. */
  rotation?: number;
  /** How far the lines sway, in px. */
  amplitude?: number;
  /** Size of the wave pattern. Higher values make broader, calmer waves. */
  scale?: number;
  /** How much the waves twist the lines, gathering them into bright folds. */
  twist?: number;
  /** How fast the waves flow. 0 holds them still. */
  speed?: number;
  /** Picks a different wave pattern. */
  variation?: number;
  /** Moving the cursor drags the lines along with it. */
  mouseInteraction?: boolean;
  /** Radius around the cursor that drags the lines, in px. */
  mouseRadius?: number;
  /** How hard a moving cursor drags the lines. */
  mouseStrength?: number;
  /** How much the lines overshoot and wobble as they settle, from 0 to 1. */
  bounce?: number;
  /** Roughly how long the lines take to settle back, in seconds. */
  returnDuration?: number;
  /** Clicking parts the lines in a soft ripple. */
  clickRipple?: boolean;
  /** Opens the lines from the center and swells the waves in on mount. */
  intro?: boolean;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Draws the lines as ink for light backgrounds. */
  lightMode?: boolean;
  /** Freezes the waves. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. Defaults to the screen's. */
  dpr?: number;
  class?: string;
}

export interface WavesSettings {
  lineColor: string;
  accentColor: string;
  lineStyle: number;
  spacing: number;
  lineWidth: number;
  rotation: number;
  amplitude: number;
  scale: number;
  twist: number;
  speed: number;
  variation: number;
  mouseInteraction: boolean;
  mouseRadius: number;
  mouseStrength: number;
  bounce: number;
  returnDuration: number;
  clickRipple: boolean;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr: number | undefined;
}

/** The props a demo preset sets. */
export interface WavesShape {
  lineStyle: WavesLineStyle;
  spacing: number;
  lineWidth: number;
  rotation: number;
  amplitude: number;
  scale: number;
  twist: number;
  speed: number;
  variation: number;
  mouseRadius: number;
  mouseStrength: number;
  bounce: number;
  returnDuration: number;
  fade: number;
}

/** Flat, tweakable state behind the docs demo panel. */
export interface WavesDemoParams extends WavesShape {
  preset: WavesPreset;
  lineColor: string;
  accentColor: string;
  opacity: number;
  mouseInteraction: boolean;
  clickRipple: boolean;
  intro: boolean;
  lightMode: boolean;
  paused: boolean;
}

export interface WavesEngine {
  /** Advances one frame. Returns false when the loop should stop. */
  frame: (now: number) => boolean;
  /** Applies new settings: resizes on a pixel-ratio change, otherwise redraws when the loop is idle. */
  update: (idle: boolean) => void;
  resize: (width: number, height: number) => void;
  setVisible: (visible: boolean) => void;
  /** Pointer position relative to the container, in CSS px from the top-left. */
  pointerMove: (x: number, y: number, inside: boolean) => void;
  pointerDown: (x: number, y: number, inside: boolean, snap: boolean) => void;
  pointerUp: (isMouse: boolean) => void;
  pointerLeave: () => void;
  resetClock: () => void;
  dispose: () => void;
}
