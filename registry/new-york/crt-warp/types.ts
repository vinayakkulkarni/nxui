export type CrtWarpMask = 'aperture' | 'shadow' | 'slot' | 'none';

export type CrtWarpPreset =
  | 'ultraviolet'
  | 'amber'
  | 'oscilloscope'
  | 'arcade'
  | 'interference';

export type CrtWarpRGB = [number, number, number];

export interface CrtWarpProps {
  /** Phosphor color of the picture. */
  color?: string;
  /** Color of the dark tube behind the picture. Use 'transparent' to let the page show through. */
  backgroundColor?: string;
  /** Prints the picture as ink on a light background instead of glowing phosphor. */
  lightMode?: boolean;
  /** How fast the plasma flows. */
  speed?: number;
  /** Picks a different plasma pattern. Each whole number is a new one. */
  variation?: number;
  /** How tightly the plasma folds into bands. */
  waveAmplitude?: number;
  /** How many blobs fit on screen. */
  waveFrequency?: number;
  /** Number of brightness steps in the picture. */
  levels?: number;
  /** Width of the low resolution picture in blocks. Fewer columns make chunkier blocks. */
  columns?: number;
  /** How long the phosphor keeps glowing after the picture moves on, leaving soft trails. */
  persistence?: number;
  /** Bulge of the curved glass. */
  curvature?: number;
  /** Rounds the corners of the tube and shows its edge. 0 keeps the picture edge to edge. */
  corners?: number;
  /** Depth of the dark gaps between scanlines. Bright lines widen and fill the gaps. */
  scanlineStrength?: number;
  /** Number of scanlines from top to bottom. */
  scanlineFrequency?: number;
  /** The phosphor pattern of the tube: vertical stripes, dot triads, slots, or a plain mono tube. */
  mask?: CrtWarpMask;
  /** Visibility of the phosphor mask. */
  maskStrength?: number;
  /** Glow that spills from bright areas. */
  bloom?: number;
  /** How far the glow spreads. */
  bloomRadius?: number;
  /** Misalignment of the red and blue beams, which fringes edges with color. */
  rgbShift?: number;
  /** Grain in the lit picture. */
  noise?: number;
  /** Brightness flicker of the tube. */
  flicker?: number;
  /** A slow hum bar rolling down the screen and jitter along the lines. */
  interference?: number;
  /** Darkening toward the edges of the tube. */
  vignette?: number;
  /** Overall brightness, or ink strength in light mode. */
  brightness?: number;
  /** Warms the tube up when it first comes into view. */
  intro?: boolean;
  /** The cursor acts like a magnet held to the glass, twisting the picture with color fringes. */
  mouseReact?: boolean;
  /** Strength of the magnet. */
  mouseStrength?: number;
  /** Clicking changes the channel: the picture rolls through static and comes back with a new pattern. */
  changeOnClick?: boolean;
  /** Maximum device pixel ratio of the canvas. */
  dpr?: number;
  /** Maximum frame rate. */
  fps?: number;
  /** Freezes the plasma. */
  paused?: boolean;
  /** Extra class names for the container. */
  class?: string;
}

/** The visual props a preset sets. */
export interface CrtWarpLook {
  color: string;
  backgroundColor: string;
  lightMode: boolean;
  mask: CrtWarpMask;
  speed: number;
  variation: number;
  waveAmplitude: number;
  waveFrequency: number;
  levels: number;
  columns: number;
  persistence: number;
  curvature: number;
  corners: number;
  scanlineStrength: number;
  scanlineFrequency: number;
  maskStrength: number;
  bloom: number;
  bloomRadius: number;
  rgbShift: number;
  noise: number;
  flicker: number;
  interference: number;
  vignette: number;
  brightness: number;
}

/** Normalised values the renderer reads every frame. */
export interface CrtWarpSettings {
  ink: CrtWarpRGB;
  paper: CrtWarpRGB | null;
  lightMode: boolean;
  speed: number;
  variation: number;
  amplitude: number;
  frequency: number;
  levels: number;
  columns: number;
  persistence: number;
  curve: number;
  corners: number;
  scanline: number;
  lines: number;
  mask: number;
  maskStrength: number;
  bloom: number;
  bloomRadius: number;
  rgbShift: number;
  noise: number;
  flicker: number;
  interference: number;
  vignette: number;
  brightness: number;
  intro: boolean;
  mouseReact: boolean;
  mouseStrength: number;
  changeOnClick: boolean;
  dpr: number;
  fps: number;
  paused: boolean;
}

export interface CrtWarpProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface CrtWarpTarget {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
}

export interface CrtWarpEngine {
  /** Advances the simulation and draws one frame. */
  frame: (now: number, reduced: boolean) => void;
  /** Resizes the drawing buffer from the container's CSS size. */
  resize: (cssWidth: number, cssHeight: number) => void;
  /** Pointer position in 0..1 container space. */
  pointerMove: (x: number, y: number, inside: boolean) => void;
  pointerLeave: () => void;
  /** Starts a channel flip. */
  flipChannel: (reduced: boolean) => void;
  setVisible: (visible: boolean) => void;
  dispose: () => void;
}
