export type SoftAuroraPreset =
  | 'classic'
  | 'borealis'
  | 'dusk'
  | 'mono'
  | 'ribbon'
  | 'halo'
  | 'calm';

export interface SoftAuroraProps {
  /** Overall animation speed. */
  speed?: number;
  /** Scale of the noise that shapes the band. */
  scale?: number;
  /** Overall brightness. */
  brightness?: number;
  /** Tint of the first aurora layer. Hex or rgb() color. */
  color1?: string;
  /** Tint of the second aurora layer. Hex or rgb() color. */
  color2?: string;
  /** How tightly the band ripples. */
  noiseFrequency?: number;
  /** How far the band waves up and down. */
  noiseAmplitude?: number;
  /** Vertical position of the band, from 0 at the bottom to 1 at the top. */
  bandHeight?: number;
  /** How tight and bright the band is. Lower values spread it into a wide, soft glow. */
  bandSpread?: number;
  /** How much fine ripple sits on top of the large waves. */
  octaveDecay?: number;
  /** Shifts the second layer in time so the two separate. */
  layerOffset?: number;
  /** How fast the colors drift along the band. */
  colorSpeed?: number;
  /** How much of the shifting rainbow shows through the tints, from 0 to 1. */
  spectrum?: number;
  /** Tilts the band by this many degrees, from -90 to 90. */
  tilt?: number;
  /** The aurora drifts with the cursor and reaches toward it when it comes close. */
  enableMouseInteraction?: boolean;
  /** Strength of the cursor drift and reach. */
  mouseInfluence?: number;
  /** Clicking sends a soft pulse of light along the band. */
  clickPulse?: boolean;
  /** The band starts as a thin line and blooms in on mount. */
  intro?: boolean;
  /** Prints the aurora as soft colored ink so it sits on light pages. */
  lightMode?: boolean;
  /** Overall opacity, from 0 to 1. */
  opacity?: number;
  class?: string;
}

export interface SoftAuroraSettings {
  speed: number;
  scale: number;
  brightness: number;
  color1: [number, number, number];
  color2: [number, number, number];
  noiseFrequency: number;
  noiseAmplitude: number;
  bandHeight: number;
  bandSpread: number;
  octaveDecay: number;
  layerOffset: number;
  colorSpeed: number;
  spectrum: number;
  tilt: number;
  mouse: boolean;
  influence: number;
  clickPulse: boolean;
  intro: boolean;
  light: boolean;
  opacity: number;
}

/** The props a demo preset sets. */
export interface SoftAuroraLook {
  color1: string;
  color2: string;
  spectrum: number;
  speed: number;
  colorSpeed: number;
  scale: number;
  brightness: number;
  noiseFrequency: number;
  noiseAmplitude: number;
  bandHeight: number;
  bandSpread: number;
  tilt: number;
  octaveDecay: number;
  layerOffset: number;
}

export interface SoftAuroraEngine {
  /** Advances one frame. Returns false once nothing is moving, so the loop can stop. */
  frame: (now: number) => boolean;
  /** Resizes the canvas to the container (the resolution follows the noise detail). */
  resize: (width: number, height: number) => void;
  /** Pointer position in px relative to the container. */
  pointerMove: (x: number, y: number, inside: boolean) => void;
  /** Sends a pulse from a point in px relative to the container. Returns true if one was sent. */
  pulse: (x: number, y: number) => boolean;
  pointerLeave: () => void;
  resetClock: () => void;
  dispose: () => void;
}
