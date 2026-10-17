import type { CSSProperties } from 'vue';

export type LightPillarBlendMode = NonNullable<CSSProperties['mixBlendMode']>;

export type LightPillarQuality = 'low' | 'medium' | 'high';

export interface LightPillarProps {
  /** Color of the lower, denser part of the pillar. */
  topColor?: string;
  /** Color the light fades into toward the top. */
  bottomColor?: string;
  /** Overall brightness. */
  intensity?: number;
  /** How fast the pillar turns. Also drives the overall animation speed. */
  rotationSpeed?: number;
  /** How fast the light streams along the pillar, relative to the rotation. */
  flow?: number;
  /** The pillar leans, drifts and turns toward the cursor. */
  interactive?: boolean;
  /** Clicking sends a surge of light racing up the pillar. */
  clickPulse?: boolean;
  /** How much light the strands gather. */
  glowAmount?: number;
  /** Soft halo around the brightest strands, 0 to 1. */
  bloom?: number;
  /** Width of the pillar. */
  pillarWidth?: number;
  /** Vertical stretch of the strands. */
  pillarHeight?: number;
  /** Tilts the pillar, in degrees. */
  pillarRotation?: number;
  /** How much the strands swirl around each other. */
  twist?: number;
  /** Layers of turbulence in the strands, 1 to 6. */
  detail?: number;
  /** Strength of the film grain. */
  noiseIntensity?: number;
  /** Fades the edges into the page, 0 to 1. */
  fade?: number;
  /** The pillar ignites from the bottom and widens when it first appears. */
  intro?: boolean;
  /** CSS blend mode for the canvas. */
  mixBlendMode?: LightPillarBlendMode;
  /** Render resolution of the light. */
  quality?: LightPillarQuality;
  /** Exact render scale relative to the element size, 0.25 to 2. Overrides quality. */
  resolution?: number;
  /** Draws the pillar as colored light on a white background. */
  lightMode?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  class?: string;
}

export interface LightPillarSettings {
  topColor: string;
  bottomColor: string;
  intensity: number;
  rotationSpeed: number;
  flow: number;
  interactive: boolean;
  clickPulse: boolean;
  glowAmount: number;
  bloom: number;
  pillarWidth: number;
  pillarHeight: number;
  pillarRotation: number;
  twist: number;
  detail: number;
  noiseIntensity: number;
  fade: number;
  intro: boolean;
  scale: number;
  lightMode: boolean;
  paused: boolean;
}

export type LightPillarRgb = [number, number, number];

export interface LightPillarPulse {
  axis: number;
  age: number;
}

export interface LightPillarEngineOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  getSettings: () => LightPillarSettings;
  reduce: boolean;
  onRestored: () => void;
}

export interface LightPillarEngine {
  refresh: () => void;
  resize: () => void;
  pointerMove: (clientX: number, clientY: number) => void;
  pointerDown: (clientX: number, clientY: number) => void;
  pointerLeave: () => void;
  setVisible: (visible: boolean) => void;
  visibilityChanged: () => void;
  dispose: (loseContext: boolean) => void;
}
