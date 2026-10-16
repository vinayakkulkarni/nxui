import type { CSSProperties } from 'vue';

export type GhostCursorTheme = 'dark' | 'light';

export interface GhostCursorProps {
  /** Color of the smoke. Dense parts glow lighter. */
  color?: string;
  /** Brightness of the smoke. */
  brightness?: number;
  /** Size of the ghost, in px. */
  size?: number;
  /** How long the smoke lingers behind the cursor, from 1 to 200. */
  trailLength?: number;
  /** How far the ghost floats behind the cursor and glides on when it leaves, from 0 to 0.99. */
  inertia?: number;
  /** How much the smoke swirls and curls as it drifts, from 0 to 2. */
  turbulence?: number;
  /** How fast the smoke rises. Negative values let it sink. */
  drift?: number;
  /** How wispy the smoke is, from 0 for a soft glow to 1 for billowing wisps. */
  detail?: number;
  /** Film grain over the smoke, from 0 to 1. */
  grainIntensity?: number;
  /** Strength of the soft glow around the smoke. */
  bloomStrength?: number;
  /** How far the glow spreads, from 0 to 3. */
  bloomRadius?: number;
  /** How bright smoke has to be before it glows. */
  bloomThreshold?: number;
  /** Fades the smoke out toward the edges of the area, from 0 to 1. */
  edgeIntensity?: number;
  /** Clicking releases a puff of smoke. */
  clickPuff?: boolean;
  /** The ghost floats across once when it first appears, before the cursor arrives. */
  intro?: boolean;
  /** Glowing smoke for dark pages, or soft ink smoke for light ones. */
  theme?: GhostCursorTheme;
  /** CSS blend mode for the canvas. Defaults to `screen` (dark) or `normal` (light). */
  mixBlendMode?: CSSProperties['mixBlendMode'];
  /** Time after the cursor stops before the ghost starts to fade, in ms. Defaults to 1000 (500 on touch). */
  fadeDelayMs?: number;
  /** How long the fade takes, in ms. Defaults to 1500 (1000 on touch). */
  fadeDurationMs?: number;
  /** Highest pixel ratio the canvas renders at. */
  maxDevicePixelRatio?: number;
  /** Pixel budget for the smoke. Defaults to 600000 (300000 on touch). */
  targetPixels?: number;
  /** Stacking order of the effect over your content. */
  zIndex?: number;
  class?: string;
}

export interface GhostCursorSettings {
  color: [number, number, number];
  brightness: number;
  size: number;
  trail: number;
  inertia: number;
  turbulence: number;
  drift: number;
  detail: number;
  grain: number;
  bloom: number;
  bloomRadius: number;
  threshold: number;
  edge: number;
  clickPuff: boolean;
  theme: number;
  fadeDelay: number;
  fadeDuration: number;
  maxRatio: number;
  budget: number;
}

export interface GhostCursorEngine {
  wake: () => void;
  pointerMove: (clientX: number, clientY: number) => void;
  pointerDown: (clientX: number, clientY: number) => void;
  leave: () => void;
  setVisible: (visible: boolean) => void;
  setPageVisible: (visible: boolean) => void;
  markDirty: () => void;
  dispose: () => void;
}

export interface GhostCursorEngineOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  getSettings: () => GhostCursorSettings;
  intro: boolean;
  pageVisible: boolean;
}

export interface GhostCursorProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface GhostCursorTarget {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
}
