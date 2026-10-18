import type { CSSProperties } from 'vue';

export type GradientBlindsShineDirection = 'left' | 'right';

export type GradientBlindsClickEffect = 'ripple' | 'none';

export type GradientBlindsIdle = 'drift' | 'center' | 'stay';

export type GradientBlindsBlendMode = NonNullable<
  CSSProperties['mixBlendMode']
>;

export interface GradientBlindsProps {
  /** Colors of the gradient across the blinds, up to 8. */
  gradientColors?: string[];
  /** Rotation of the blinds in degrees. 0 stands them upright. */
  angle?: number;
  /** Film grain strength, 0 (clean) to 1. */
  noise?: number;
  /** Number of blinds. Upper limit when `blindMinWidth` is set. */
  blindCount?: number;
  /** Narrowest a blind can get, in px. */
  blindMinWidth?: number;
  /** Seconds the light takes to catch up with the cursor. */
  mouseDampening?: number;
  /** Runs the gradient forward and back again. */
  mirrorGradient?: boolean;
  /** Size of the light around the cursor, relative to the area. */
  spotlightRadius?: number;
  /** How the light fades toward its edge. */
  spotlightSoftness?: number;
  /** Strength of the light. */
  spotlightOpacity?: number;
  /** Bends the blinds into soft waves. */
  distortAmount?: number;
  /** Which edge of each blind catches the light. */
  shineDirection?: GradientBlindsShineDirection;
  /** Color of the light that falls on the blinds. */
  lightColor?: string;
  /** Makes the blinds recede to one side, -1 to 1. */
  perspective?: number;
  /** Drifts the colors across the blinds over time. */
  gradientSpeed?: number;
  /** Highlight along the lit edge of each blind, 0 to 1. */
  shine?: number;
  /** Shadow depth where each blind tucks under the next, 0 to 1. */
  relief?: number;
  /** Haze of colored light around the cursor. */
  glow?: number;
  /** How much the blinds drift and turn on their own. */
  sway?: number;
  /** Speed of the sway and of the drifting light. */
  speed?: number;
  /** How much blinds near the cursor turn toward the light, 0 to 1. */
  hoverTilt?: number;
  /** Clicking sends a wave of light through the blinds. */
  clickEffect?: GradientBlindsClickEffect;
  /** What the light does while the cursor is away. */
  idle?: GradientBlindsIdle;
  /** Fades the light in while the blinds turn into place on mount. */
  intro?: boolean;
  /** CSS blend mode over the page in dark mode. */
  mixBlendMode?: GradientBlindsBlendMode;
  /** Draws the blinds as colored light on a white page. */
  lightMode?: boolean;
  /** Freezes the current frame. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

export interface GradientBlindsSettings {
  paused: boolean;
  colorKey: string;
  gradientColors: string[];
  angle: number;
  noise: number;
  blindCount: number;
  blindMinWidth: number;
  mouseDampening: number;
  mirrorGradient: boolean;
  spotlightRadius: number;
  spotlightSoftness: number;
  spotlightOpacity: number;
  distortAmount: number;
  shineDirection: GradientBlindsShineDirection;
  lightColor: string;
  perspective: number;
  gradientSpeed: number;
  shine: number;
  relief: number;
  glow: number;
  sway: number;
  speed: number;
  hoverTilt: number;
  clickEffect: GradientBlindsClickEffect;
  idle: GradientBlindsIdle;
  intro: boolean;
  lightMode: boolean;
  dpr: number | undefined;
}

export interface GradientBlindsEngineOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  getSettings: () => GradientBlindsSettings;
  reduce: boolean;
  onRestored: () => void;
}

export interface GradientBlindsEngine {
  refresh: () => void;
  resize: () => void;
  pointerMove: (clientX: number, clientY: number) => void;
  pointerDown: (clientX: number, clientY: number) => void;
  pointerLeave: () => void;
  setVisible: (visible: boolean) => void;
  visibilityChanged: () => void;
  dispose: (loseContext: boolean) => void;
}

export interface GradientBlindsProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}
