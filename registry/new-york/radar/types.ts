export type RadarMode = 'sweep' | 'pulse';

export interface RadarProps {
  /** Color of the sweep and the contacts. */
  color?: string;
  /** Fills the canvas behind the radar. Transparent lets the page show through. */
  backgroundColor?: string;
  /** A rotating beam, or sonar rings that expand from the center. */
  mode?: RadarMode;
  /** Speed of the sweep. Negative values sweep counterclockwise. */
  speed?: number;
  /** How long the afterglow lingers behind the sweep, from 0 to 1. */
  trail?: number;
  /** Size of the radar, relative to the shorter side of the view. */
  scale?: number;
  /** Number of range rings. */
  ringCount?: number;
  /** Number of faint bearing lines. 0 hides them. */
  spokeCount?: number;
  /** Shows the bearing scale around the edge. */
  ticks?: boolean;
  /** Number of moving contacts the sweep picks up, up to 16. */
  targets?: number;
  /** Amount of speckled returns the sweep lights up, from 0 to 1. */
  clutter?: number;
  /** Strength of the soft light around the beam and contacts. */
  glow?: number;
  /** Overall brightness. */
  brightness?: number;
  /** Opacity of the rings, ticks and lines, from 0 to 2. */
  gridOpacity?: number;
  /** Width of the grid lines in px. */
  lineWidth?: number;
  /** Tilts the radar back in perspective like a floor, in degrees. */
  tilt?: number;
  /** Horizontal position of the radar center, from 0 to 1. */
  centerX?: number;
  /** Vertical position of the radar center, from 0 at the top to 1 at the bottom. */
  centerY?: number;
  /** Lights up the grid near the cursor; the sweep picks the cursor up as a contact. */
  mouseInteraction?: boolean;
  /** Draws the rings in and starts the sweep on mount. */
  intro?: boolean;
  /** Strength of the film grain. */
  grain?: number;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Draws the radar as ink for light backgrounds. */
  lightMode?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

export interface RadarSettings {
  color: string;
  backgroundColor: string;
  mode: RadarMode;
  speed: number;
  trail: number;
  scale: number;
  ringCount: number;
  spokeCount: number;
  ticks: boolean;
  targets: number;
  clutter: number;
  glow: number;
  brightness: number;
  gridOpacity: number;
  lineWidth: number;
  /** Radians. */
  tilt: number;
  centerX: number;
  centerY: number;
  mouseInteraction: boolean;
  intro: boolean;
  grain: number;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
}

export interface RadarProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface RadarTarget {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  width: number;
  height: number;
}

export interface RadarEcho {
  x: number;
  y: number;
  time: number;
}

export interface RadarContactMotion {
  x: number;
  y: number;
  heading: number;
  velocity: number;
  turn: number;
}

export interface RadarContact extends RadarContactMotion {
  echoes: RadarEcho[];
}

export interface RadarEngineOptions {
  getSettings: () => RadarSettings;
  reducedMotion: boolean;
}

export interface RadarEngine {
  pointerMove: (event: PointerEvent) => void;
  leave: () => void;
  setVisible: (visible: boolean) => void;
  pageVisibilityChanged: () => void;
  resize: () => void;
  refresh: () => void;
  dispose: () => void;
}
