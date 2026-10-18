export type GalaxyDirection = 'forward' | 'backward';
export type GalaxyPalette = 'none' | 'stardust' | 'ice' | 'gold' | 'rose';
export type GalaxyPreset =
  | 'classic'
  | 'stardust'
  | 'hyperdrive'
  | 'sparkle'
  | 'drift'
  | 'cluster';

export interface GalaxyProps {
  /** Center of the starfield, from 0 to 1. */
  focal?: [number, number];
  /** Fixed rotation of the starfield as a [cos, sin] pair. */
  rotation?: [number, number];
  /** How fast you travel through the stars. */
  starSpeed?: number;
  /** How densely the stars are packed. */
  density?: number;
  /** Shifts the hue of the stars, in degrees. */
  hueShift?: number;
  /** Freezes the animation. */
  disableAnimation?: boolean;
  /** Overall speed of the animation. */
  speed?: number;
  /** Lets the cursor interact with the stars. */
  mouseInteraction?: boolean;
  /** Brightness of the glow around each star. */
  glowIntensity?: number;
  /** Color saturation of the stars, from 0 to 1. */
  saturation?: number;
  /** Pushes the stars away from the cursor. When off, the field shifts with the cursor instead. */
  mouseRepulsion?: boolean;
  /** Strength of the push away from the cursor. */
  repulsionStrength?: number;
  /** How much the stars twinkle, from 0 to 1. */
  twinkleIntensity?: number;
  /** How fast the starfield rotates. */
  rotationSpeed?: number;
  /** Pushes the stars away from the center without the cursor. 0 turns it off. */
  autoCenterRepulsion?: number;
  /** Shows the page behind the stars. When off, the stars sit on the background color. */
  transparent?: boolean;
  /** Draws the stars as ink for light backgrounds. */
  lightMode?: boolean;
  /** Up to four colors the stars are picked from. Replaces the hue shift and saturation coloring. */
  starColors?: string[];
  /** Size of each star glow. */
  starSize?: number;
  /** Strength of the cross flares on the brightest stars. */
  flareIntensity?: number;
  /** Number of star layers, from 2 to 8. */
  layers?: number;
  /** Whether you fly into the stars or drift back out of them. */
  direction?: GalaxyDirection;
  /** Clicking jumps forward at warp speed. */
  clickWarp?: boolean;
  /** Drops out of warp speed on mount. */
  intro?: boolean;
  /** Background behind the stars when transparent is off, or the paper color in light mode. */
  backgroundColor?: string;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

/** The tunable look shared by the demo presets. */
export interface GalaxyLook {
  starColors: string[];
  hueShift: number;
  saturation: number;
  density: number;
  glowIntensity: number;
  starSize: number;
  flareIntensity: number;
  twinkleIntensity: number;
  starSpeed: number;
  speed: number;
  rotationSpeed: number;
  layers: number;
  direction: GalaxyDirection;
  mouseRepulsion: boolean;
  repulsionStrength: number;
}

export interface GalaxyDemoParams extends Omit<GalaxyLook, 'starColors'> {
  preset: GalaxyPreset;
  palette: GalaxyPalette;
  mouseInteraction: boolean;
  clickWarp: boolean;
  intro: boolean;
  lightMode: boolean;
}

export interface GalaxySettings {
  focal: [number, number];
  rotation: [number, number];
  starSpeed: number;
  density: number;
  hueShift: number;
  disableAnimation: boolean;
  speed: number;
  mouseInteraction: boolean;
  glowIntensity: number;
  saturation: number;
  mouseRepulsion: boolean;
  repulsionStrength: number;
  twinkleIntensity: number;
  rotationSpeed: number;
  autoCenterRepulsion: number;
  transparent: boolean;
  lightMode: boolean;
  palette: string[];
  starSize: number;
  flareIntensity: number;
  layers: number;
  reverse: boolean;
  clickWarp: boolean;
  intro: boolean;
  backgroundColor?: string;
  opacity: number;
  dpr?: number;
}

export interface GalaxyEngine {
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
