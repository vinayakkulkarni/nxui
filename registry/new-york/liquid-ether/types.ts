export interface LiquidEtherProps {
  /** Colors from slow to fast flow. Calm areas take the first color, the fastest currents the last. */
  colors?: string[];
  /** Brightness of the flow. */
  intensity?: number;
  /** How strongly the cursor pushes the liquid. */
  mouseForce?: number;
  /** Size of the area the cursor stirs, in px. */
  cursorSize?: number;
  /** How long the motion lingers before it settles, from 0 to 1. */
  persistence?: number;
  /** How thick the liquid is, from 0 to 1. */
  viscosity?: number;
  /** Detail of the simulation, from 0.05 to 1. Lower values are faster and softer. */
  resolution?: number;
  /** The liquid bounces off the edges instead of flowing out of view. */
  bounceEdges?: boolean;
  /** Clicking shoots a puff of liquid in the direction the cursor was moving. */
  clickBurst?: boolean;
  /** Stirs the liquid on its own while the cursor is away. */
  autoDemo?: boolean;
  /** Speed of the automatic stirring. */
  autoSpeed?: number;
  /** Strength of the automatic stirring compared with the cursor. */
  autoIntensity?: number;
  /** Milliseconds without input before the automatic stirring resumes. */
  autoResumeDelay?: number;
  /** A swirl sweeps out from the center on mount. */
  intro?: boolean;
  /** Renders the flow as soft ink for light backgrounds. */
  lightMode?: boolean;
  /** Solid color behind the flow. `'transparent'` shows the page through. */
  backgroundColor?: string;
  /** Highest pixel ratio the canvas renders at. */
  maxDevicePixelRatio?: number;
  class?: string;
}

export interface LiquidEtherSettings {
  colors: string[];
  paletteKey: string;
  intensity: number;
  force: number;
  radius: number;
  persistence: number;
  viscosity: number;
  resolution: number;
  walls: boolean;
  clickBurst: boolean;
  autoDemo: boolean;
  autoSpeed: number;
  autoIntensity: number;
  autoResumeDelay: number;
  intro: boolean;
  light: boolean;
  background: [number, number, number, number];
  maxRatio: number;
}

export interface LiquidEtherProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface LiquidEtherTarget {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
}

export interface LiquidEtherSplat {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface LiquidEtherEngineOptions {
  getSettings: () => LiquidEtherSettings;
  reducedMotion: boolean;
  /** Whether the opening sweep may play (false after a context restore). */
  allowIntro: boolean;
  onContextRestored: () => void;
}

export interface LiquidEtherEngine {
  refresh: () => void;
  resize: () => void;
  setVisible: (visible: boolean) => void;
  pageVisibilityChanged: () => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  leave: () => void;
  dispose: () => void;
}
