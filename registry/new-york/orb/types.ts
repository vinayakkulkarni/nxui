export type OrbColor = [number, number, number];

export interface OrbProps {
  /** Two colors that swirl around the ring, then the deep glow color. */
  colors?: string[];
  /** Shifts the hue of every color, in degrees. */
  hue?: number;
  /** Color the orb sits on. Light colors switch it to a filled style. */
  backgroundColor?: string;
  /** Size of the orb relative to the container. */
  size?: number;
  /** How soft and wide the glow around the ring is. */
  glow?: number;
  /** How far the glow bleeds into the inside of the orb. */
  bleed?: number;
  /** How much the ring breathes and warps at rest. */
  wobble?: number;
  /** Brightness of the light that orbits the ring. */
  highlight?: number;
  /** Length of the tail behind the orbiting light. */
  trail?: number;
  /** Tilts the ring back in perspective, in degrees. */
  tiltX?: number;
  /** Turns the ring sideways in perspective, in degrees. */
  tiltY?: number;
  /** Speed of the swirl, the orbiting light and the breathing. */
  speed?: number;
  /** How far the ring reaches toward the cursor and how bright it gets. */
  hoverIntensity?: number;
  /** Slowly turns the orb while it is hovered. */
  rotateOnHover?: boolean;
  /** Keeps the hover effect on without hovering. */
  forceHoverState?: boolean;
  /** The orbiting light swings toward the cursor while hovered. */
  followCursor?: boolean;
  /** Clicking the orb makes it pulse and swirl. */
  clickPulse?: boolean;
  /** Powers the orb on with a spring and a swirl. */
  intro?: boolean;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

export interface OrbSettings {
  colors: [string, string, string];
  hue: number;
  backgroundColor: string;
  size: number;
  glow: number;
  bleed: number;
  wobble: number;
  highlight: number;
  trail: number;
  tiltX: number;
  tiltY: number;
  speed: number;
  hoverIntensity: number;
  rotateOnHover: boolean;
  forceHoverState: boolean;
  followCursor: boolean;
  clickPulse: boolean;
  intro: boolean;
  opacity: number;
  paused: boolean;
  dpr: number | undefined;
}

export interface OrbEngineOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  getSettings: () => OrbSettings;
  reduce: boolean;
  onRestored: () => void;
}

export interface OrbEngine {
  refresh: () => void;
  resize: () => void;
  pointerMove: (clientX: number, clientY: number) => void;
  pointerDown: (clientX: number, clientY: number) => void;
  pointerUp: (pointerType: string) => void;
  pointerLeave: () => void;
  setVisible: (visible: boolean) => void;
  visibilityChanged: () => void;
  dispose: (loseContext: boolean) => void;
}

export interface OrbProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}
