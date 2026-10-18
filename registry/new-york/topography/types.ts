export type TopographyDirection = 'forward' | 'backward' | 'left' | 'right';
export type TopographyHoverEffect = 'lift' | 'trace' | 'light';
export type TopographyClickEffect = 'pulse' | 'peak' | 'none';
export type TopographyMarkers = 'none' | 'plus' | 'dots';

export interface TopographyProps {
  /** Color of the contour lines. The brightest lines glow toward white. */
  color?: string;
  /** How many contour lines stack up the tallest mountain. */
  lineCount?: number;
  /** Width of the lines in px. Nearer lines draw a little thicker. */
  lineWidth?: number;
  /** Draws every fifth line bolder and brighter, like the index lines on a map. */
  majorLines?: boolean;
  /** How tall the mountains rise. 0 lays the map flat. */
  elevation?: number;
  /** How much height the land keeps as it reaches the camera. */
  foreground?: number;
  /** Size of the landforms. Larger values give broader mountains. */
  scale?: number;
  /** Fine wobble in the lines and small rings on the plains, from 0 to 1. */
  detail?: number;
  /** Camera angle in degrees, from a low view across the land to 90 for straight down. */
  tilt?: number;
  /** How fast the camera glides over the land. */
  speed?: number;
  /** Which way the camera travels. */
  direction?: TopographyDirection;
  /** How quickly the landforms reshape over time. 0 keeps the terrain still. */
  morph?: number;
  /** Soft bloom around the lit lines. */
  glow?: number;
  /** Softens lines away from the focus point, which follows the cursor. */
  depthOfField?: number;
  /** How quickly the land fades into the distance. 1 leaves only the foreground. */
  fog?: number;
  /** Overall brightness of the lines. */
  brightness?: number;
  /** Overall opacity of the effect. */
  opacity?: number;
  /** Lets the cursor light and shape the terrain, and tilts the camera toward it. */
  mouseInteraction?: boolean;
  /** Lift raises the land under the cursor, trace lights the contour at its height, light only lights it. */
  hoverEffect?: TopographyHoverEffect;
  /** Size of the area the cursor affects. */
  mouseRadius?: number;
  /** How high the land lifts and how brightly it lights. */
  mouseStrength?: number;
  /** How long the lifted land takes to settle back, from 0 to 1. */
  trail?: number;
  /** How far the camera leans toward the cursor, from 0 to 1. */
  parallax?: number;
  /** Pulse sends a ring of light rolling out over the land, peak raises a new mountain. */
  clickEffect?: TopographyClickEffect;
  /** Survey markers on a grid across the land. */
  markers?: TopographyMarkers;
  /** How often brief data glitches slice through the lines, from 0 to 1. */
  glitch?: number;
  /** The map fades in flat and rises into mountains on mount. */
  intro?: boolean;
  /** Draws the lines as crisp ink for light backgrounds instead of glowing light. */
  lightMode?: boolean;
  /** Maximum device pixel ratio, capped at 2. Defaults to the screen ratio. */
  dpr?: number;
  /** Extra classes for the container. */
  class?: string;
}

export type Vec3 = [number, number, number];

/** Normalised settings the render loop reads every frame. */
export interface TopographySettings {
  color: string;
  lineCount: number;
  lineWidth: number;
  majorLines: boolean;
  elevation: number;
  foreground: number;
  scale: number;
  detail: number;
  tilt: number;
  speed: number;
  direction: readonly [number, number];
  morph: number;
  glow: number;
  depthOfField: number;
  fog: number;
  brightness: number;
  opacity: number;
  mouseInteraction: boolean;
  hoverEffect: TopographyHoverEffect;
  mouseRadius: number;
  mouseStrength: number;
  trail: number;
  parallax: number;
  clickEffect: TopographyClickEffect;
  /** -1 = none, 0 = plus, 1 = dots. */
  markers: number;
  glitch: number;
  intro: boolean;
  lightMode: boolean;
  dpr: number | undefined;
  reduce: boolean;
}

export interface TopographyEngine {
  wake: () => void;
  resize: () => void;
  setVisible: (value: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  pointerLeave: () => void;
  destroy: (loseContext: boolean) => void;
}

export interface TopographyProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface TopographyTarget {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  depth: WebGLRenderbuffer | null;
  width: number;
  height: number;
}

export interface TopographyField {
  texture: WebGLTexture | null;
  heights: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  width: number;
  height: number;
}

export interface TopographyFrame {
  f: Vec3;
  r: Vec3;
  u: Vec3;
}

export interface TopographyCamera extends TopographyFrame {
  distance: number;
  eye: Vec3;
}

export interface TopographyHit {
  x: number;
  y: number;
  z: number;
  depth: number;
}

export interface TopographyPoint {
  x: number;
  z: number;
}

export interface TopographyPulse extends TopographyPoint {
  age: number;
}

export interface TopographyBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  near: number;
}

export interface TopographyGrid {
  cell: number;
  camX: number;
  camZ: number;
  fracX: number;
  fracZ: number;
  k0: number;
  m0: number;
  columns: number;
  rows: number;
}

export interface TopographyState {
  intro: number;
  rise: number;
  travelX: number;
  travelZ: number;
  morph: number;
  yaw: number;
  pitch: number;
  yawVelocity: number;
  pitchVelocity: number;
  presence: number;
  focus: number;
  hit: TopographyHit | null;
  brushFrom: TopographyPoint | null;
  sculptLife: number;
  burst: TopographyPulse | null;
  level: number;
  trace: number;
  clock: number;
  tilt: number;
  elevation: number;
  scale: number;
}
