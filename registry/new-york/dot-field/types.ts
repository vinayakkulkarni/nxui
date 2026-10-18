export type DotFieldPattern = 'grid' | 'hex' | 'spiral' | 'scatter';

export type DotFieldPreset =
  | 'lens'
  | 'vortex'
  | 'gravity'
  | 'sunflower'
  | 'honeycomb'
  | 'drift'
  | 'starfield';

/** The visual props a preset sets. */
export interface DotFieldLook {
  pattern: DotFieldPattern;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  gradientAngle: number;
  dotRadius: number;
  dotSpacing: number;
  cursorRadius: number;
  bulgeStrength: number;
  twist: number;
  glowRadius: number;
  glowIntensity: number;
  baseOpacity: number;
  waveAmplitude: number;
  speed: number;
  sparkle: boolean;
  lightMode: boolean;
}

export interface DotFieldProps {
  /** Radius of each dot in pixels. */
  dotRadius?: number;
  /** Gap between neighbouring dots in pixels. */
  dotSpacing?: number;
  /** How the dots are laid out. */
  pattern?: DotFieldPattern;
  /** Color the gradient starts from. */
  gradientFrom?: string;
  /** Color the gradient ends on. */
  gradientTo?: string;
  /** Direction of the gradient in degrees, like CSS linear-gradient. */
  gradientAngle?: number;
  /** Radius of the lens that follows the cursor, in pixels. */
  cursorRadius?: number;
  /** How much the lens magnifies the dots, from -1 (pinch) to 1. */
  bulgeStrength?: number;
  /** Swirls the dots around the cursor by this many degrees. */
  twist?: number;
  /** Color the dots inside the glow light up to. */
  glowColor?: string;
  /** Radius of the glow around the cursor, in pixels. 0 turns it off. */
  glowRadius?: number;
  /** How strongly the dots inside the glow light up and bloom. */
  glowIntensity?: number;
  /** Opacity of the dots outside the glow. */
  baseOpacity?: number;
  /** How far the dots drift in a slow rolling wave, in pixels. */
  waveAmplitude?: number;
  /** A few dots at a time softly grow and brighten. */
  sparkle?: boolean;
  /** How fast the wave and the sparkles animate. */
  speed?: number;
  /** The lens follows the cursor or finger. */
  interactive?: boolean;
  /** Pressing and holding deepens the lens. */
  holdToZoom?: boolean;
  /** The field pulls into focus on mount. */
  intro?: boolean;
  /** Prints the dots as ink so they stay crisp on light backgrounds. */
  lightMode?: boolean;
  /** Overall opacity, from 0 to 1. */
  opacity?: number;
  /** Highest pixel ratio the canvas renders at. */
  maxDevicePixelRatio?: number;
  class?: string;
}

export type Vec3 = [number, number, number];

/** Normalised values the renderer reads every frame. */
export interface DotFieldSettings {
  radius: number;
  step: number;
  pattern: number;
  from: Vec3;
  to: Vec3;
  glowColor: Vec3;
  glowWeight: number;
  direction: [number, number];
  lensRadius: number;
  strength: number;
  twist: number;
  glowRadius: number;
  glowIntensity: number;
  base: number;
  wave: number;
  sparkle: number;
  speed: number;
  interactive: boolean;
  holdToZoom: boolean;
  intro: boolean;
  light: boolean;
  opacity: number;
  maxRatio: number;
}

export interface DotFieldEngine {
  /** Draws one frame. Returns false once nothing is moving. */
  frame: (now: number) => boolean;
  /** Resets the frame clock before the loop starts again. */
  start: (now: number) => void;
  resize: (width: number, height: number, devicePixelRatio: number) => void;
  pointer: (x: number, y: number, inside: boolean, down?: boolean) => void;
  release: (keepInside: boolean) => void;
  leave: () => void;
  dispose: () => void;
}
