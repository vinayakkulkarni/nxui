export type LineWavesPreset =
  | 'silk'
  | 'gold'
  | 'arctic'
  | 'aurora'
  | 'engraving'
  | 'ribbon'
  | 'storm'
  | 'calm';

export interface LineWavesProps {
  /** First color the lines blend through. */
  color1?: string;
  /** Second color the lines blend through. */
  color2?: string;
  /** Third color the lines blend through. */
  color3?: string;
  /** How fast the colors drift across the lines. 0 keeps them in place. */
  colorCycleSpeed?: number;
  /** How fast the waves flow. 0 freezes them. */
  speed?: number;
  /** Number of lines across the height of the container. */
  lineCount?: number;
  /** Thickness of the lines, in px. */
  lineWidth?: number;
  /** Strength of the soft glow around each line. */
  glow?: number;
  /** Overall brightness of the lines. */
  brightness?: number;
  /** Strength of the band of light that drifts through the lines, from 0 to 1. */
  highlight?: number;
  /** Width of the band of light. Higher values light more lines at once. */
  highlightWidth?: number;
  /** How strongly the lines bend into waves. */
  warpIntensity?: number;
  /** Size of the waves. Higher values give broad, sweeping curves. */
  warpScale?: number;
  /** Angle of the lines, in degrees. */
  rotation?: number;
  /** Fades the lines out toward the edges of the container, from 0 to 1. */
  edgeFade?: number;
  /** The lines spread apart and light up around the cursor. */
  enableMouseInteraction?: boolean;
  /** How strongly the lines react to the cursor. */
  mouseInfluence?: number;
  /** Clicking sends a smooth wave rolling out through the lines. */
  clickRipple?: boolean;
  /** The lines draw in across the container on mount. */
  intro?: boolean;
  /** Draws the lines as ink for light backgrounds. */
  lightMode?: boolean;
  /** Overall opacity, from 0 to 1. */
  opacity?: number;
  /** Highest pixel ratio the canvas renders at. */
  maxDevicePixelRatio?: number;
  class?: string;
}

/** The tunable look shared by the demo presets. */
export interface LineWavesLook {
  color1: string;
  color2: string;
  color3: string;
  colorCycleSpeed: number;
  speed: number;
  lineCount: number;
  lineWidth: number;
  glow: number;
  brightness: number;
  highlight: number;
  highlightWidth: number;
  warpIntensity: number;
  warpScale: number;
  rotation: number;
}

export interface LineWavesDemoParams extends LineWavesLook {
  preset: LineWavesPreset;
  edgeFade: number;
  enableMouseInteraction: boolean;
  mouseInfluence: number;
  clickRipple: boolean;
  intro: boolean;
  lightMode: boolean;
  opacity: number;
}

export interface LineWavesSettings {
  color1: number[];
  color2: number[];
  color3: number[];
  cycleSpeed: number;
  speed: number;
  lines: number;
  width: number;
  glow: number;
  brightness: number;
  highlight: number;
  highlightWidth: number;
  warp: number;
  scale: number;
  rotation: number;
  edge: number;
  mouse: boolean;
  influence: number;
  clickRipple: boolean;
  intro: boolean;
  light: boolean;
  opacity: number;
  maxRatio: number;
}

export interface LineWavesEngine {
  /** Draws one frame. Returns false when the loop can stop. */
  frame: (now: number) => boolean;
  resize: (width: number, height: number) => void;
  /** Pointer position relative to the container, in CSS px from the top-left. */
  pointerMove: (x: number, y: number, inside: boolean) => void;
  pointerDown: (x: number, y: number, inside: boolean) => void;
  pointerLeave: () => void;
  resetClock: () => void;
  dispose: () => void;
}
