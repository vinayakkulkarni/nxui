export type AcidSquaresShape = 'square' | 'round';

export type AcidSquaresDetail = 'low' | 'medium' | 'high';

export type AcidSquaresLighting = 'split' | 'backlit' | 'overhead';

export type AcidSquaresHoverEffect = 'press' | 'lift' | 'none';

export type AcidSquaresPulseOrigin = 'center' | 'random';

export interface AcidSquaresProps {
  /** Base color of the squares. Set it to your page background, the gaps show the page through. */
  color?: string;
  /** Color of the first light that drifts across the squares. */
  accentColor?: string;
  /** Color of the second light. */
  secondaryColor?: string;
  /** Size of the squares. */
  tileSize?: number;
  /** Width of the gaps between the squares. */
  gap?: number;
  /** Corner radius, from sharp squares at 0 to circles at 1. */
  roundness?: number;
  /** How softly the edges of each square round off into the gaps. */
  softness?: number;
  /** How much each square domes up like a cushion. 0 keeps the tops flat. */
  bulge?: number;
  /** Rotation of the grid, in degrees. */
  rotation?: number;
  /** From soft satin at 0 to glossy at 1, with tighter highlights along the edges. */
  gloss?: number;
  /** Height of the slow swells. 0 lays the surface flat. */
  waves?: number;
  /** Size of the swells. Higher makes them broader. */
  waveScale?: number;
  /** Speed of the swells and the drifting lights. */
  speed?: number;
  /** Shape of the ripples that travel across the surface. */
  shape?: AcidSquaresShape;
  /** Height of the ripples. 0 turns them off. */
  pulse?: number;
  /** How fast the ripples travel. */
  pulseSpeed?: number;
  /** Time between ripples. */
  pulseSpacing?: number;
  /** Width of each ripple. */
  pulseWidth?: number;
  /** Start every ripple from the center, or from random spots on the surface. */
  pulseOrigin?: AcidSquaresPulseOrigin;
  /** Overall brightness. */
  brightness?: number;
  /** Placement of the two lights: from either side, low behind the surface, or from above. */
  lighting?: AcidSquaresLighting;
  /** View angle, from straight down at 0 to low across the surface at 1. */
  tilt?: number;
  /** Zoom. Higher brings the squares closer. */
  zoom?: number;
  /** How far the surface reaches before it fades into the page. */
  depth?: number;
  /** Strength of the film grain. */
  grain?: number;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Switches the squares on from the center outward when the effect first appears. */
  intro?: boolean;
  /** Lets the cursor shape the surface and the view follow it slightly. */
  mouseInteraction?: boolean;
  /** Whether the cursor presses the surface down or lifts it up. */
  hoverEffect?: AcidSquaresHoverEffect;
  /** Depth of the cursor press or lift. */
  mouseStrength?: number;
  /** Size of the area the cursor shapes. */
  mouseRadius?: number;
  /** Sends a ripple out from wherever you click. */
  pulseOnClick?: boolean;
  /** Smoothness of the surface. Lower it for weaker devices. */
  detail?: AcidSquaresDetail;
  /** Draws pale squares with soft tints for light backgrounds. */
  lightMode?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  /** Additional CSS classes. */
  class?: string;
}

type Light = [number, number, number, number, number];

type Vec3 = [number, number, number];

type Mat4 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

interface Settings {
  color: string;
  accentColor: string;
  secondaryColor: string;
  tileSize: number;
  gap: number;
  roundness: number;
  softness: number;
  bulge: number;
  rotation: number;
  gloss: number;
  waves: number;
  waveScale: number;
  speed: number;
  square: number;
  pulse: number;
  pulseSpeed: number;
  pulseSpacing: number;
  pulseWidth: number;
  randomOrigin: boolean;
  brightness: number;
  lights: [Light, Light];
  tilt: number;
  zoom: number;
  depth: number;
  grain: number;
  fade: number;
  opacity: number;
  intro: boolean;
  mouseInteraction: boolean;
  hover: number;
  mouseStrength: number;
  mouseRadius: number;
  pulseOnClick: boolean;
  mesh: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
}

interface Surface {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

interface Ripple {
  x: number;
  z: number;
  start: number;
  strength: number;
}

interface Camera {
  eye: Vec3;
  target: Vec3;
  viewProj: Mat4;
  inverse: Mat4;
  distance: number;
}

interface Pointer {
  x: number;
  y: number;
  inside: boolean;
}

interface Hover {
  x: number;
  z: number;
  vx: number;
  vz: number;
  presence: number;
  placed: boolean;
}

interface Look {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface State {
  clock: number;
  swell: number;
  lights: number;
  frame: number;
  nextRipple: number;
  ripples: Ripple[];
  intro: number;
  width: number;
  height: number;
  colorKey: string;
  color: Vec3;
  accent: Vec3;
  second: Vec3;
  pointer: Pointer;
  hover: Hover;
  look: Look;
  seed: number;
  camera: Camera | null;
}

export type {
  Light,
  Vec3,
  Mat4,
  Settings,
  Surface,
  Ripple,
  Camera,
  Pointer,
  Hover,
  Look,
  State,
};
