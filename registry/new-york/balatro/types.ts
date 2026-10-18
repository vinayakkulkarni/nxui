export interface BalatroProps {
  /** Main paint color. */
  color1?: string;
  /** Second paint color, swirled into the first. */
  color2?: string;
  /** Color of the gaps between the two paints. */
  color3?: string;
  /** How sharply the paints separate. Lower values blend them into soft washes. */
  contrast?: number;
  /** Strength of the glossy highlights on the paint. */
  lighting?: number;
  /** How tightly the paint spirals around the center, from 0 to 1. */
  swirl?: number;
  /** How fast the paint flows. 0 freezes it. */
  speed?: number;
  /** Turns the whole swirl continuously. Negative values turn it the other way. */
  rotationSpeed?: number;
  /** Size of the paint shapes. Higher values zoom in. */
  scale?: number;
  /** How many times the paint folds over itself, from 1 to 8. */
  detail?: number;
  /** Moves the center of the swirl, as a fraction of the container diagonal. */
  offset?: [number, number];
  /** Size of the pixels in CSS pixels. 0 renders it smooth. */
  pixelSize?: number;
  /** Scanlines and soft edge falloff of an old CRT screen, from 0 to 1. */
  crt?: number;
  /** The cursor stirs the paint and steers the swirl. */
  mouseInteraction?: boolean;
  /** How strongly the cursor drags the paint along. */
  mouseStrength?: number;
  /** Clicking spins the paint into a whirlpool that slowly unwinds. */
  clickSwirl?: boolean;
  /** The swirl spins into place on mount. */
  intro?: boolean;
  /** Lightens the gaps between the paints so it sits on light pages. */
  lightMode?: boolean;
  /** Overall opacity, from 0 to 1. */
  opacity?: number;
  /** Highest pixel ratio the canvas renders at. */
  maxDevicePixelRatio?: number;
  class?: string;
}

export type BalatroRgb = [number, number, number];

export interface BalatroSettings {
  color1: BalatroRgb;
  color2: BalatroRgb;
  color3: BalatroRgb;
  contrast: number;
  lighting: number;
  swirl: number;
  speed: number;
  rotation: number;
  scale: number;
  detail: number;
  offset: [number, number];
  pixelSize: number;
  crt: number;
  mouse: boolean;
  strength: number;
  clickSwirl: boolean;
  intro: boolean;
  light: boolean;
  opacity: number;
  maxRatio: number;
}

export interface BalatroUniforms {
  [name: string]: WebGLUniformLocation | undefined;
}

export interface BalatroProgram {
  program: WebGLProgram;
  uniforms: BalatroUniforms;
}

export interface BalatroTarget {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
}

export interface BalatroTwirl {
  x: number;
  y: number;
  age: number;
  direction: number;
}

export interface BalatroPointer {
  clientX: number;
  clientY: number;
  pointerType: string;
}

export interface BalatroEngine {
  resize: () => void;
  wake: () => void;
  pointerMove: (event: BalatroPointer) => void;
  pointerDown: (event: BalatroPointer) => void;
  pointerUp: (event: BalatroPointer) => void;
  leave: () => void;
  setVisible: (value: boolean) => void;
  setPageVisible: (value: boolean) => void;
  loseContext: () => void;
  destroy: () => void;
}
