export interface PlasmaWaveProps {
  /** Colors of the two waves of plasma. */
  colors?: string[];
  /** Overall speed of the animation. */
  speed?: number;
  /** How fast the first wave travels. */
  speed1?: number;
  /** How fast the second wave travels. */
  speed2?: number;
  /** Direction of the second wave. Use -1 to make it travel against the first. */
  dir2?: number;
  /** How far the first wave curls around its path. */
  bend1?: number;
  /** How far the second wave curls around its path. */
  bend2?: number;
  /** Thickness of the plasma ribbons. */
  thickness?: number;
  /** Camera lens. Lower values give a wider, deeper view. */
  focalLength?: number;
  /** Rotation of the whole effect, in degrees. */
  rotationDeg?: number;
  /** Horizontal shift of the view, in px. */
  xOffset?: number;
  /** Vertical shift of the view, in px. */
  yOffset?: number;
  /** Brightness of the plasma. */
  brightness?: number;
  /** Strength of the soft light spilling around the plasma. */
  glow?: number;
  /** How white-hot the brightest parts of the plasma get, from 0 to 1. */
  core?: number;
  /** Strength of the film grain. */
  grain?: number;
  /** Detail of the plasma, from 0.25 to 1. Lower values render faster. */
  quality?: number;
  /** Swells and brightens the plasma near the cursor. */
  mouseInteraction?: boolean;
  /** Unfolds the plasma and fades it in on mount. */
  intro?: boolean;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Draws the plasma as glowing glass with white cores for light backgrounds. */
  lightMode?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

export interface PlasmaWaveSettings {
  color1: string;
  color2: string;
  speed: number;
  speed1: number;
  speed2: number;
  dir2: number;
  bend1: number;
  bend2: number;
  thickness: number;
  focalLength: number;
  rotation: number;
  xOffset: number;
  yOffset: number;
  brightness: number;
  glow: number;
  core: number;
  grain: number;
  quality: number;
  mouseInteraction: boolean;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr: number | undefined;
  reduce: boolean;
}

export interface PlasmaWaveEngine {
  resize: () => void;
  wake: () => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerLeave: () => void;
  visibilityChange: () => void;
  destroy: () => void;
}
