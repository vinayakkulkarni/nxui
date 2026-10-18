import type { CSSProperties } from 'vue';

export type FluxLinesFlow = 'up' | 'down' | 'left' | 'right';

export interface FluxLinesProps {
  /** Up to 8 colors blended along the lines. */
  colors?: string[];
  /** How fast the fluid churns and flows. */
  speed?: number;
  /** Zoom of the pattern. Higher values show bigger, fewer shapes. */
  scale?: number;
  /** How much the flow swirls and distorts. */
  turbulence?: number;
  /** How smoothly the two layers of the fluid merge. */
  fluidity?: number;
  /** Thickness of the glow around each line. */
  rimWidth?: number;
  /** Falloff of the glow. Higher values are tighter. */
  sharpness?: number;
  /** How much the lines break up into separate strokes. */
  shimmer?: number;
  /** Brightness of the lines. */
  glow?: number;
  /** Width of the crisp core inside each line, in pixels. */
  lineWidth?: number;
  /** Main direction the fluid drifts. */
  flowDirection?: FluxLinesFlow;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Turns the cursor into a magnet that reveals and curls the lines. */
  mouseInteraction?: boolean;
  /** Strength of the cursor magnet. */
  mouseStrength?: number;
  /** Reach of the cursor magnet, as a fraction of the height. */
  mouseRadius?: number;
  /** Seconds the magnet takes to catch up with the cursor. */
  mouseDampening?: number;
  /** Clicking stirs the fluid into a swirl. */
  clickSwirl?: boolean;
  /** Fades the lines in on mount. */
  intro?: boolean;
  /** Draws the lines as ink for light backgrounds. */
  lightMode?: boolean;
  /** Lets the page show through. */
  transparent?: boolean;
  /** Background color when transparent is off. */
  backgroundColor?: string;
  /** Freezes the flow. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  /** CSS mix-blend-mode applied to the container. */
  mixBlendMode?: CSSProperties['mixBlendMode'];
  class?: string;
}

export interface FluxLinesProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}
