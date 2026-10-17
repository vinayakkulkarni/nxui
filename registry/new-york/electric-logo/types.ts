import type { Texture as OglTexture } from 'ogl';

export type ElectricLogoTheme = 'dark' | 'light';

export interface ElectricLogoProps {
  /** Any image URL. SVGs and transparent PNGs are traced by their alpha; opaque images by keying out their backdrop colour. */
  src?: string;
  /** Colour of the hot core of every strand. */
  color?: string;
  /** Colour of the glow around the strands, the bloom and the interior fill. */
  glowColor?: string;
  /** Size of the logo as a fraction of the container. The glow and arcs extend beyond it. */
  scale?: number;
  /** Overall brightness of the effect. */
  intensity?: number;
  /** Strength of the halo around strands and the soft bloom around the shape. */
  glow?: number;
  /** Width of the main strand, in px. Satellite strands are thinner and every strand swells and thins as it flows. */
  thickness?: number;
  /** Number of filaments tracing the outline, from 1 to 6. Extra strands come and go along the edge. */
  strands?: number;
  /** How far the strands sway and ripple away from the outline. The main strand stays closest. */
  bend?: number;
  /** Size of the fine crinkle along every strand and arc. */
  crackle?: number;
  /** How often short arcs leap off the edge and land further along it. 0 turns them off. */
  arcs?: number;
  /** How much the whole effect pulses and each strand shimmers in brightness. */
  flicker?: number;
  /** Translucent glow inside the shape, brightest near its edges. */
  fill?: number;
  /** Animation speed. 0 freezes the current frame. */
  speed?: number;
  /** Turn on pointer interactions. Hovering charges the lightning around the cursor; a click sends a ripple with a burst of arcs. */
  interactive?: boolean;
  /** How strongly the lightning charges up around the cursor. 0 turns the hover charge off. */
  cursorIntensity?: number;
  /** Radius of the charged area around the cursor, in px. */
  cursorRadius?: number;
  /** The background the logo sits on. Dark renders the lightning as emitted light. Light renders crisp electric ink. */
  theme?: ElectricLogoTheme;
  /** Called immediately after each rendered frame. Copy the canvas synchronously to capture the current frame for effects such as live reflections. */
  onRender?: (canvas: HTMLCanvasElement) => void;
  /** Extra classes on the container. */
  class?: string;
}

export type ElectricLogoSettings = Required<
  Omit<ElectricLogoProps, 'class' | 'onRender'>
> &
  Pick<ElectricLogoProps, 'onRender'>;

export interface ElectricLogoShape {
  field: Float32Array;
  edges: number[];
  width: number;
  height: number;
  pad: number;
  logoWidth: number;
  logoHeight: number;
  glow: Float32Array;
  glowWidth: number;
  glowHeight: number;
  glowOffset: number;
}

export interface ElectricLogoSlot {
  shape: ElectricLogoShape | null;
  field: OglTexture;
  glow: OglTexture;
}

export interface ElectricLogoPulse {
  x: number;
  y: number;
  born: number;
}

export interface ElectricLogoPoint {
  x: number;
  y: number;
}

export interface ElectricLogoFocus {
  x: number;
  y: number;
  radius: number;
}

export interface ElectricLogoSpark {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  bow: number;
  seed: number;
  born: number;
  life: number;
}
