export type PixelSnowVariant = 'snowflake' | 'square' | 'round';

export interface PixelSnowProps {
  /** Color of the snow. Any CSS color. */
  color?: string;
  /** Shape of the flakes: pixel crystals, square pixels or round pixels. */
  variant?: PixelSnowVariant;
  /** How much snow is falling, from 0 to 1. */
  density?: number;
  /** How fast the snow falls. Negative values make it rise. */
  speed?: number;
  /** Sideways drift, from -2 to 2. Negative values blow to the left. */
  wind?: number;
  /** How much each flake swings as it falls. */
  sway?: number;
  /** Size of the flakes, from 0 for mostly tiny specks to 2 for mostly large crystals. */
  flakeSize?: number;
  /** Size of one snow pixel in px, from 1 to 12. */
  pixelSize?: number;
  /** How strongly far flakes fall slower and dimmer than near ones, from 0 to 1. */
  depth?: number;
  /** Overall brightness of the snow. */
  brightness?: number;
  /** Strength of the soft light around each flake. */
  glow?: number;
  /** How often flakes catch the light and sparkle, from 0 to 1. */
  twinkle?: number;
  /** Lets the snow pile up in soft drifts along the bottom edge. */
  accumulate?: boolean;
  /** Lets the cursor brush the snow aside and stir it as it moves. */
  mouseInteraction?: boolean;
  /** Lets the snow drift in from the top on mount. */
  intro?: boolean;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Opacity of the whole effect, from 0 to 1. */
  opacity?: number;
  /** Draws the snow as colored pixels for light backgrounds. */
  lightMode?: boolean;
  /** Freezes the snow in place. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  /** Extra classes for the container. */
  class?: string;
}

export interface PixelSnowSettings {
  color: string;
  variant: number;
  density: number;
  speed: number;
  wind: number;
  sway: number;
  flakeSize: number;
  pixelSize: number;
  depth: number;
  brightness: number;
  glow: number;
  twinkle: number;
  accumulate: boolean;
  mouseInteraction: boolean;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr: number | undefined;
  reduce: boolean;
}

export interface PixelSnowEngine {
  resize: () => void;
  wake: () => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerLeave: () => void;
  visibilityChange: () => void;
  destroy: () => void;
}
