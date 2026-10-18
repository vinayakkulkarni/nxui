export type SideRaysOrigin =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'right'
  | 'left';

export interface SideRaysProps {
  /** Color of the first layer of rays, on the upper side of the fan. */
  rayColor1?: string;
  /** Color of the second layer of rays, on the lower side of the fan. */
  rayColor2?: string;
  /** Balance between the two layers, from 0 to 1. */
  blend?: number;
  /** Corner or side the light shines in from. */
  origin?: SideRaysOrigin;
  /** How fast the rays shimmer and sway. 0 freezes them. */
  speed?: number;
  /** Brightness of the light. */
  intensity?: number;
  /** How wide the rays fan out. */
  spread?: number;
  /** How many separate rays the light breaks into. */
  density?: number;
  /** How crisp the edges of the rays are, from 0 to 1. */
  sharpness?: number;
  /** Rotates the rays, in degrees. */
  tilt?: number;
  /** How quickly the light fades with distance. */
  falloff?: number;
  /** Brightness of the glow where the light enters. */
  glow?: number;
  /** Color saturation of the light. 0 is grayscale. */
  saturation?: number;
  /** Amount of dust drifting in the light, from 0 to 1. */
  dust?: number;
  /** The rays lean toward the cursor and the ray under it brightens. */
  followMouse?: boolean;
  /** How strongly the rays follow the cursor, from 0 to 1. */
  mouseInfluence?: number;
  /** The rays grow out from their source on mount. */
  intro?: boolean;
  /** Renders the rays as soft tinted light for light backgrounds. */
  lightMode?: boolean;
  /** Overall opacity, from 0 to 1. */
  opacity?: number;
  /** Highest pixel ratio the canvas renders at. */
  maxDevicePixelRatio?: number;
  class?: string;
}

export interface SideRaysFrame {
  flipX: number;
  flipY: number;
  side: number;
}

export interface SideRaysSettings {
  colorA: [number, number, number];
  colorB: [number, number, number];
  blend: number;
  frame: SideRaysFrame;
  speed: number;
  intensity: number;
  spread: number;
  density: number;
  sharpness: number;
  tilt: number;
  falloff: number;
  glow: number;
  saturation: number;
  dust: number;
  followMouse: boolean;
  mouseInfluence: number;
  intro: boolean;
  light: boolean;
  opacity: number;
  maxRatio: number;
  reduce: boolean;
}

export interface SideRaysEngine {
  resize: () => void;
  wake: () => void;
  setVisible: (visible: boolean) => void;
  setPageVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  pointerLeave: () => void;
  contextLost: () => void;
  destroy: () => void;
}
