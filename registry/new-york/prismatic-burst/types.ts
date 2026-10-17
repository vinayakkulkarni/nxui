import type { CSSProperties } from 'vue';

export type PrismaticBurstAnimationType = 'rotate' | 'rotate3d' | 'hover';

export type PrismaticBurstQuality = 'low' | 'medium' | 'high';

export type PrismaticBurstBlendMode = NonNullable<
  CSSProperties['mixBlendMode']
>;

export interface PrismaticBurstOffset {
  x?: number | string;
  y?: number | string;
}

export interface PrismaticBurstProps {
  /** Colors blended through the rays, up to 64. Leave empty for a full spectrum. */
  colors?: string[];
  /** Overall brightness of the rays. */
  intensity?: number;
  /** How fast the burst turns and shifts. */
  speed?: number;
  /** Flat rotation, full 3D rotation, or a burst that turns to follow the cursor. */
  animationType?: PrismaticBurstAnimationType;
  /** Bends the rays into flowing, organic shapes. */
  distort?: number;
  /** Splits the light into this many evenly spaced spokes. 0 keeps it organic. */
  rayCount?: number;
  /** Thickness of the rays, from thin threads to broad beams. */
  rayWidth?: number;
  /** How close the burst is. Higher values zoom in. */
  zoom?: number;
  /** Swirls the rays into a spiral. Negative values turn the other way. */
  twist?: number;
  /** Streams the colors through the burst. Negative values reverse it. */
  flow?: number;
  /** Size of the dark core at the heart of the burst, 0.5 to 3. */
  centerFade?: number;
  /** Film grain over the light, 0.3 to 1. */
  grain?: number;
  /** Soft bloom around the brightest rays. */
  glow?: number;
  /** Moves the center of the burst, in pixels. Positive y moves it up. */
  offset?: PrismaticBurstOffset;
  /** The burst leans toward the cursor and the rays near it brighten. */
  mouseInteraction?: boolean;
  /** How strongly the burst reacts to the cursor. */
  mouseStrength?: number;
  /** How smoothly the burst follows the cursor, 0 to 1. */
  hoverDampness?: number;
  /** Clicking sends a wave of light racing out along the rays. */
  clickBurst?: boolean;
  /** The burst ignites from the center when it mounts. */
  intro?: boolean;
  /** Fades the edges into the page, 0 to 1. */
  fade?: number;
  /** Render resolution. Lower settings are lighter on slower devices. */
  quality?: PrismaticBurstQuality;
  /** Exact render scale from 0.2 to 1. Overrides quality. */
  resolution?: number;
  /** Draws the burst as colored ink on a white background. */
  lightMode?: boolean;
  /** CSS blend mode for the canvas, such as screen or lighten. */
  mixBlendMode?: PrismaticBurstBlendMode;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

export interface PrismaticBurstSettings {
  colors: string[];
  intensity: number;
  speed: number;
  animation: number;
  distort: number;
  rayCount: number;
  rayWidth: number;
  zoom: number;
  twist: number;
  flow: number;
  centerFade: number;
  grain: number;
  glow: number;
  offsetX: number;
  offsetY: number;
  mouseInteraction: boolean;
  mouseStrength: number;
  hoverDampness: number;
  clickBurst: boolean;
  intro: boolean;
  fade: number;
  scale: number;
  lightMode: boolean;
  paused: boolean;
  dpr: number | undefined;
}

export interface PrismaticBurstTarget {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  width: number;
  height: number;
}

export interface PrismaticBurstProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface PrismaticBurstEngineOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  getSettings: () => PrismaticBurstSettings;
  reduce: boolean;
  onRestored: () => void;
}

export interface PrismaticBurstEngine {
  refresh: () => void;
  resize: () => void;
  pointerMove: (clientX: number, clientY: number) => void;
  pointerDown: (clientX: number, clientY: number) => void;
  pointerLeave: () => void;
  setVisible: (visible: boolean) => void;
  visibilityChanged: () => void;
  dispose: (loseContext: boolean) => void;
}
