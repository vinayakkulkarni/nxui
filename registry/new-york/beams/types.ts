export interface BeamsProps {
  /** Color of the light that glints off the beams. */
  color?: string;
  /** Width of each beam, in px. */
  beamWidth?: number;
  /** Angle of the beams, in degrees. */
  rotation?: number;
  /** How fast the ripples move. */
  speed?: number;
  /** Length of the ripples along each beam, in px. */
  waveLength?: number;
  /** How deep the ripples are. Deeper ripples catch the light in more places. */
  depth?: number;
  /** How crisp the glints are, from 0 for soft satin to 1 for sharp, glossy streaks. */
  sharpness?: number;
  /** Turns each beam slightly on its own axis, so glints show up on more beams. */
  twist?: number;
  /** Strength of a dimmer second light from the other side. */
  fillLight?: number;
  /** Soft glow around the brightest glints. */
  glow?: number;
  /** Strength of the light. */
  brightness?: number;
  /** Picks a different ripple pattern. Any number works. */
  variation?: number;
  /** Strength of the film grain, from 0 to 1. */
  grain?: number;
  /** Render resolution, from 0.25 to 1. Lower values run faster. */
  quality?: number;
  /** The cursor moves the light along the beams and brightens the glints near it. */
  mouseInteraction?: boolean;
  /** How strongly the cursor moves the light. */
  mouseStrength?: number;
  /** Sweeps the light in on mount. */
  intro?: boolean;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Prints the glints as soft ink, for light backgrounds. */
  lightMode?: boolean;
  /** Optional solid background. By default the canvas is transparent. */
  backgroundColor?: string;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  /** Extra classes for the container. */
  class?: string;
}

export interface BeamsSettings {
  color: string;
  beamWidth: number;
  rotation: number;
  speed: number;
  waveLength: number;
  depth: number;
  sharpness: number;
  twist: number;
  fillLight: number;
  glow: number;
  brightness: number;
  variation: number;
  grain: number;
  quality: number;
  mouseInteraction: boolean;
  mouseStrength: number;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr: number | undefined;
  reduce: boolean;
}

export type BeamsPresetName =
  | 'studio'
  | 'ember'
  | 'glacier'
  | 'chrome'
  | 'dawn';

export interface BeamsLook {
  color: string;
  beamWidth: number;
  rotation: number;
  waveLength: number;
  depth: number;
  sharpness: number;
  twist: number;
  fillLight: number;
  glow: number;
}

export interface BeamsEngine {
  resize: () => void;
  refresh: () => void;
  setVisible: (visible: boolean) => void;
  visibilityChange: () => void;
  pointerMove: (event: PointerEvent) => void;
  pointerOut: (event: PointerEvent) => void;
  destroy: () => void;
}
