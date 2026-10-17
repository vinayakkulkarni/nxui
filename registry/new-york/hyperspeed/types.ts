export type HyperspeedCurve =
  | 'straight'
  | 'gentle'
  | 'winding'
  | 'hills'
  | 'racing'
  | 'deep';

export type HyperspeedTheme = 'dark' | 'light';

export type HyperspeedVec3 = [number, number, number];

export interface HyperspeedProps {
  /** Shape of the road. Switching between curves morphs the road smoothly. */
  curve?: HyperspeedCurve;
  /** How strongly the road bends. 0 is straight. */
  curvature?: number;
  /** Cruising speed of the traffic, poles and road markings. */
  speed?: number;
  /** Speed multiplier while the pointer is held down. */
  boost?: number;
  /** Camera field of view in degrees. */
  fov?: number;
  /** Field of view while boosting. */
  boostFov?: number;
  /** Lanes on each side of the road. */
  lanes?: number;
  /** Width of each side of the road. */
  roadWidth?: number;
  /** Width of the strip between the two sides. */
  medianWidth?: number;
  /** Cars on each side of the road, up to 160. */
  density?: number;
  /** Length of the light trails. */
  trailLength?: number;
  /** Thickness of the light trails. */
  lightSize?: number;
  /** Light poles on each shoulder, up to 80. 0 removes them. */
  poles?: number;
  /** Height of the light poles. */
  poleHeight?: number;
  /** Speed streaks flying past in the air, up to 1500. */
  dust?: number;
  /** Soft bloom around every light. 0 turns it off. */
  glow?: number;
  /** How much the lights reflect on the road. */
  reflections?: number;
  /** How far the camera drifts and turns toward the pointer. */
  steer?: number;
  /** Colors of the lights moving away on the left road. */
  tailColors?: string[];
  /** Colors of the oncoming lights on the right road. */
  headColors?: string[];
  /** Colors of the light poles along both shoulders. */
  poleColors?: string[];
  /** Color of the asphalt. Follows the theme when not set. */
  roadColor?: string;
  /** Opacity of the road and its markings. */
  roadOpacity?: number;
  /** Color of the lane markings. Follows the theme when not set. */
  lineColor?: string;
  /** Color behind the road. Unset keeps the canvas transparent. */
  background?: string;
  /** Dark renders glowing trails, light renders crisp trails on a pale road. */
  theme?: HyperspeedTheme;
  /** Click and hold to boost, and let the camera follow the pointer. */
  interactive?: boolean;
  /** Turns the boost on from your own code. */
  boosting?: boolean;
  class?: string;
}

export interface HyperspeedPalette {
  background: string;
  road: string;
  lines: string;
  tail: string[];
  head: string[];
  poles: string[];
  dust: string;
}

export interface HyperspeedSettings {
  light: boolean;
  curve: HyperspeedCurve;
  curvature: number;
  speed: number;
  boost: number;
  fov: number;
  boostFov: number;
  lanes: number;
  roadWidth: number;
  medianWidth: number;
  density: number;
  trailLength: number;
  lightSize: number;
  poles: number;
  poleHeight: number;
  dust: number;
  glow: number;
  reflections: number;
  steer: number;
  tailColors: string[];
  headColors: string[];
  poleColors: string[];
  roadColor: string;
  roadOpacity: number;
  lineColor: string;
  background: string;
  dustColor: string;
  interactive: boolean;
  boosting: boolean;
}

export interface HyperspeedEngine {
  resize: () => void;
  setVisible: (visible: boolean) => void;
  setHeld: (held: boolean) => void;
  setPointer: (x: number, y: number) => void;
  dispose: () => void;
}

export interface HyperspeedEngineOptions {
  getSettings: () => HyperspeedSettings;
  reducedMotion: () => boolean;
}
