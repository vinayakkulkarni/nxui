export type FerrofluidFlow = 'up' | 'down' | 'left' | 'right' | 'none';

export type FerrofluidBlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'
  | 'plus-lighter';

export interface FerrofluidProps {
  /** Colors of the studio lights reflected in the fluid: key light, side lights and fill light. */
  colors?: string[];
  /** How fast the swells roll across the surface. */
  speed?: number;
  /** Zoom of the fluid. Higher values show bigger, fewer spikes. */
  scale?: number;
  /** How tall the spikes grow in a strong field. */
  spikeHeight?: number;
  /** How peaked the spikes are. Low values give soft mounds, high values taller cones. */
  sharpness?: number;
  /** How much the spike pattern sways and drifts out of its regular grid. */
  turbulence?: number;
  /** How loosely the spikes respond, from 0 (thick and slow) to 1 (bouncy). */
  fluidity?: number;
  /** Viewing angle in degrees. Low values look down from above, high values look across the fluid. */
  tilt?: number;
  /** Strength of the magnetic field that raises swells of spikes across the surface. */
  magnetism?: number;
  /** Picks a different arrangement of swells. */
  variation?: number;
  /** Direction the swells roll. None keeps them morphing in place. */
  flowDirection?: FerrofluidFlow;
  /** Strength of the reflections. */
  brightness?: number;
  /** Turns the cursor into a magnet that raises a crown of spikes. */
  mouseInteraction?: boolean;
  /** Strength of the cursor magnet. */
  mouseStrength?: number;
  /** Reach of the cursor magnet, as a fraction of the height. */
  mouseRadius?: number;
  /** Time in seconds the crown takes to catch up with the cursor. 0 follows instantly. */
  mouseDampening?: number;
  /** Clicking sends a magnetic pulse through the fluid. */
  clickPulse?: boolean;
  /** Raises the spikes when the field switches on. */
  intro?: boolean;
  /** Renders the fluid as glossy white liquid for light backgrounds. */
  lightMode?: boolean;
  /** Lets the page show through. When off, the fluid sits on `color`. */
  transparent?: boolean;
  /** Background color when transparent is off. Defaults to #120f17, or white in light mode. */
  color?: string;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Freezes the fluid. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  /** CSS mix-blend-mode applied to the container. */
  mixBlendMode?: FerrofluidBlendMode;
  /** Extra classes for the container. */
  class?: string;
}

export interface FerrofluidSettings {
  colors: string[];
  speed: number;
  scale: number;
  spikeHeight: number;
  sharpness: number;
  turbulence: number;
  fluidity: number;
  tilt: number;
  magnetism: number;
  variation: number;
  flow: [number, number];
  brightness: number;
  mouseInteraction: boolean;
  mouseStrength: number;
  mouseRadius: number;
  mouseDampening: number;
  clickPulse: boolean;
  intro: boolean;
  lightMode: boolean;
  transparent: boolean;
  color: string | undefined;
  opacity: number;
  paused: boolean;
  dpr: number | undefined;
  reduce: boolean;
}

export interface FerrofluidProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface FerrofluidTarget {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
}

export interface FerrofluidShape {
  round: number;
  exponent: number;
  span: number;
}

export interface FerrofluidEngine {
  resize: () => void;
  wake: () => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  pointerLeave: () => void;
  visibilityChange: () => void;
  destroy: () => void;
}
