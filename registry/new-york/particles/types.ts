export type ParticlesShape = 'circle' | 'square' | 'ring' | 'sparkle';
export type ParticlesHoverEffect = 'parallax' | 'repel' | 'attract';
export type ParticlesDrift = 'none' | 'up' | 'down' | 'forward';
export type ParticlesPreset =
  | 'classic'
  | 'constellation'
  | 'bokeh'
  | 'fireflies'
  | 'snow'
  | 'warp'
  | 'stardust';

export interface ParticlesProps {
  /** How many particles there are. */
  particleCount?: number;
  /** How far the particles spread out from the center. */
  particleSpread?: number;
  /** Speed of the floating motion, twinkle and rotation. */
  speed?: number;
  /** Colors the particles are picked from. */
  particleColors?: string[];
  /** Lets the cursor move the particles. */
  moveParticlesOnHover?: boolean;
  /** Strength of the hover effect. */
  particleHoverFactor?: number;
  /** Draws softer, slightly see-through particles. */
  alphaParticles?: boolean;
  /** Base size of the particles. Nearer particles are drawn larger. */
  particleBaseSize?: number;
  /** How much particle sizes vary. 0 draws every particle at the base size in px. */
  sizeRandomness?: number;
  /** Distance from the camera to the particles. Lower values feel closer and deeper. */
  cameraDistance?: number;
  /** Stops the slow rotation of the whole field. */
  disableRotation?: boolean;
  /** Maximum device pixel ratio. Defaults to the screen's, capped at 2. */
  pixelRatio?: number;
  /** Shape of each particle. */
  shape?: ParticlesShape;
  /** Soft glow around each particle. */
  glow?: number;
  /** How much the particles flicker, from 0 to 1. */
  twinkle?: number;
  /** Blurs the nearest particles into soft bokeh, like a camera lens. */
  depthOfField?: number;
  /** Joins nearby particles with thin lines, like a constellation. */
  connections?: boolean;
  /** How close particles need to be to connect, in px. */
  connectionDistance?: number;
  /** What the cursor does to the particles. */
  hoverEffect?: ParticlesHoverEffect;
  /** Radius around the cursor that repel and attract reach, in px. */
  hoverRadius?: number;
  /** Clicking sends a burst of light rippling through the particles. */
  clickBurst?: boolean;
  /** Sends the particles drifting up like embers, down like snow, or toward you like a starfield. */
  drift?: ParticlesDrift;
  /** How fast the particles drift. */
  driftSpeed?: number;
  /** Picks a different particle layout. */
  variation?: number;
  /** Flies the particles in from the distance on mount. */
  intro?: boolean;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Draws the particles as ink for light backgrounds. */
  lightMode?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  class?: string;
}

export interface ParticlesSettings {
  count: number;
  spread: number;
  speed: number;
  colors: string[];
  mouse: boolean;
  hoverFactor: number;
  soft: boolean;
  size: number;
  randomness: number;
  camera: number;
  rotate: boolean;
  dpr: number | undefined;
  shape: number;
  glow: number;
  twinkle: number;
  depthOfField: number;
  connections: boolean;
  connectionDistance: number;
  hoverEffect: number;
  hoverRadius: number;
  clickBurst: boolean;
  drift: number;
  driftSpeed: number;
  variation: number;
  intro: boolean;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
}

/** The props a demo preset sets. */
export interface ParticlesLook {
  particleColors: string[];
  particleCount: number;
  particleSpread: number;
  particleBaseSize: number;
  sizeRandomness: number;
  speed: number;
  shape: ParticlesShape;
  glow: number;
  twinkle: number;
  depthOfField: number;
  connections: boolean;
  connectionDistance: number;
  hoverEffect: ParticlesHoverEffect;
  particleHoverFactor: number;
  hoverRadius: number;
  drift: ParticlesDrift;
  driftSpeed: number;
  alphaParticles: boolean;
  disableRotation: boolean;
}

/** Flat, tweakable state behind the docs demo panel. */
export interface ParticlesDemoParams extends Omit<
  ParticlesLook,
  'particleColors'
> {
  preset: ParticlesPreset;
  color1: string;
  color2: string;
  color3: string;
  cameraDistance: number;
  variation: number;
  opacity: number;
  moveParticlesOnHover: boolean;
  clickBurst: boolean;
  intro: boolean;
  lightMode: boolean;
  paused: boolean;
}

export interface ParticlesEngine {
  /** Advances one frame. Returns false when the loop should stop. */
  frame: (now: number) => boolean;
  /** Applies new settings: resizes on a pixel-ratio change, otherwise redraws when the loop is idle. */
  update: (idle: boolean) => void;
  resize: (width: number, height: number) => void;
  setVisible: (visible: boolean) => void;
  /** Pointer position relative to the container, in CSS px from the top-left. */
  pointerMove: (x: number, y: number, inside: boolean) => void;
  pointerDown: (x: number, y: number, inside: boolean) => void;
  pointerUp: (isMouse: boolean) => void;
  pointerLeave: () => void;
  resetClock: () => void;
  dispose: () => void;
}
