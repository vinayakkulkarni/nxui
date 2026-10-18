export type AntigravityShape = 'capsule' | 'sphere' | 'box' | 'tetrahedron';

export type AntigravityColorMode = 'conic' | 'radial' | 'random';

export interface AntigravityProps {
  /** Number of particles in the field. */
  count?: number;
  /** Size of the area around the cursor whose particles get pulled into the ring. */
  magnetRadius?: number;
  /** Radius of the ring the particles form. */
  ringRadius?: number;
  /** How fast the ripples travel around the ring. */
  waveSpeed?: number;
  /** How much the ring ripples. 0 gives a clean circle. */
  waveAmplitude?: number;
  /** Number of ripples around the ring. Pair with a high waveAmplitude for a flower shape. */
  waveCount?: number;
  /** Size of the particles. */
  particleSize?: number;
  /** How quickly the particles follow the cursor. Lower values leave longer trails. */
  lerpSpeed?: number;
  /** A single color for every particle. Overrides colors when set. */
  color?: string;
  /** Palette the particles are colored from. How it is spread depends on colorMode. */
  colors?: string[];
  /** Spreads the palette around the cursor, outward from the ring, or gives each particle a random color from it. */
  colorMode?: AntigravityColorMode;
  /** How fast the conic palette turns around the cursor. 0 keeps it still. */
  colorSpeed?: number;
  /** The ring drifts around on its own after a couple of seconds without cursor movement. */
  autoAnimate?: boolean;
  /** How much each particle pulses in size, from 0 to 1. */
  particleVariance?: number;
  /** How fast the particles orbit the cursor. Negative values orbit the other way. */
  rotationSpeed?: number;
  /** Strength of the 3D depth. Particles in front grow, particles behind shrink and soften. */
  depthFactor?: number;
  /** How fast the particles pulse in size. */
  pulseSpeed?: number;
  /** Shape of the particles. Capsules stretch into dashes that point at the cursor. */
  particleShape?: AntigravityShape;
  /** How tightly the particles line up on the ring. Lower values spread them into a wider band. */
  fieldStrength?: number;
  /** How visible the particles away from the ring are, from 0 to 1. */
  ambient?: number;
  /** The ring follows the cursor or finger. Turn off for a purely ambient background. */
  interactive?: boolean;
  /** Pressing pulls the ring in and spins it faster. Releasing blasts the particles outward. */
  clickBurst?: boolean;
  /** The particles float up into place on mount. */
  intro?: boolean;
  /** Deepens pale colors so the particles stay visible on light backgrounds. */
  lightMode?: boolean;
  /** Overall opacity, from 0 to 1. */
  opacity?: number;
  /** Highest pixel ratio the canvas renders at. */
  maxDevicePixelRatio?: number;
  /** Extra classes for the container. */
  class?: string;
}

export interface AntigravitySettings {
  count: number;
  magnet: number;
  ring: number;
  waveSpeed: number;
  waveAmplitude: number;
  waveCount: number;
  size: number;
  follow: number;
  palette: string[];
  paletteKey: string;
  colorMode: number;
  colorSpeed: number;
  autoAnimate: boolean;
  variance: number;
  rotation: number;
  depth: number;
  pulse: number;
  shape: number;
  tightness: number;
  ambient: number;
  interactive: boolean;
  clickBurst: boolean;
  intro: boolean;
  light: boolean;
  opacity: number;
  maxRatio: number;
  reduced: boolean;
}

export interface AntigravityEngine {
  resize: () => void;
  wake: () => void;
  setVisible: (visible: boolean) => void;
  setPageVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  pointerLeave: () => void;
  contextLost: (event: Event) => void;
  destroy: () => void;
}
