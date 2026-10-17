export type RaysOrigin =
  | 'top-center'
  | 'top-left'
  | 'top-right'
  | 'left'
  | 'right'
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right';

export interface LightRaysProps {
  /** Where the light comes from. */
  raysOrigin?: RaysOrigin;
  /** Color of the light. */
  raysColor?: string;
  /** Animation speed. 0 freezes the rays. */
  raysSpeed?: number;
  /** How wide the beam opens. Lower values give a tight spotlight. */
  lightSpread?: number;
  /** How far the rays reach, in container widths. */
  rayLength?: number;
  /** How many separate shafts the beam splits into. */
  rayDensity?: number;
  /** Turns the beam by this many degrees. */
  tilt?: number;
  /** How crisp the edges of the shafts are, from 0 to 1. */
  raySharpness?: number;
  /** Brightness of the glow around the light source. */
  glow?: number;
  /** Drifting haze that breaks the shafts up, from 0 to 1. */
  haze?: number;
  /** How much the light cools toward blue as it travels, from 0 to 1. */
  atmosphere?: number;
  /** Overall brightness of the light. */
  intensity?: number;
  /** The rays slowly breathe brighter and dimmer. */
  pulsating?: boolean;
  /** How far the rays travel before they dim, in container widths. */
  fadeDistance?: number;
  /** Color saturation of the light. */
  saturation?: number;
  /** The beam turns toward the cursor. */
  followMouse?: boolean;
  /** How far the beam turns toward the cursor, from 0 to 1. */
  mouseInfluence?: number;
  /** The cursor blocks the light and casts a soft shadow down the rays. */
  cursorShadow?: boolean;
  /** Clicking sends a wave of light down the rays. */
  clickPulse?: boolean;
  /** Film grain over the rays, from 0 to 1. */
  noiseAmount?: number;
  /** Makes the rays waver as if seen through heat. */
  distortion?: number;
  /** The rays grow out from the source on mount. */
  intro?: boolean;
  /** Prints the light as soft colored ink so it sits on light pages. */
  lightMode?: boolean;
  /** Overall opacity, from 0 to 1. */
  opacity?: number;
  /** Highest pixel ratio the canvas renders at. */
  maxDevicePixelRatio?: number;
  class?: string;
}

export type LightRaysVec2 = [number, number];
export type LightRaysVec3 = [number, number, number];

export interface LightRaysOriginSpec {
  anchor: LightRaysVec2;
  dir: LightRaysVec2;
}

export interface LightRaysSettings {
  origin: LightRaysOriginSpec;
  color: LightRaysVec3;
  speed: number;
  spread: number;
  length: number;
  density: number;
  tilt: number;
  sharpness: number;
  glow: number;
  haze: number;
  atmosphere: number;
  intensity: number;
  pulsating: boolean;
  fade: number;
  saturation: number;
  follow: boolean;
  influence: number;
  cursorShadow: boolean;
  clickPulse: boolean;
  noise: number;
  distortion: number;
  intro: boolean;
  light: boolean;
  opacity: number;
  maxRatio: number;
}

export interface LightRaysEngineOptions {
  getSettings: () => LightRaysSettings;
  reducedMotion: boolean;
  /** Play the grow-in intro (false after a context restore). */
  playIntro: boolean;
}

export interface LightRaysEngine {
  refresh: () => void;
  setVisible: (visible: boolean) => void;
  setPageVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  leave: () => void;
  dispose: () => void;
}
