export type BallpitMaterial = 'satin' | 'matte' | 'gloss' | 'frosted' | 'metal';

export type BallpitClickEffect = 'burst' | 'none';

export type BallpitColor = string | number;

export interface BallpitProps {
  /** Number of balls in the pit (1–4000). */
  count?: number;
  /** Ball colors, handed out in turn. Hex strings or numbers such as 0x5227ff. */
  colors?: BallpitColor[];
  /** Surface finish of the balls. */
  material?: BallpitMaterial;
  /** Smallest ball radius. The view is about 18 units tall. */
  minSize?: number;
  /** Largest ball radius. */
  maxSize?: number;
  /** Pull toward the floor. 0 lets the balls float, around 0.5 piles them up. */
  gravity?: number;
  /** How much speed the balls keep each frame. 1 never slows them down. */
  friction?: number;
  /** How much speed the balls keep when they hit the edges, from 0 to 1. */
  wallBounce?: number;
  /** How bouncy the balls are against each other, from 0 to 1. */
  bounce?: number;
  /** How deep the pit is, so balls can sit in front of and behind each other. */
  depth?: number;
  /** Gentle wandering that keeps floating balls moving on their own. */
  drift?: number;
  /** A ball follows the cursor and shoves the others out of the way. */
  followCursor?: boolean;
  /** Radius of the cursor ball. */
  cursorSize?: number;
  /** Press on a ball to pick it up, drag it around and throw it. */
  grab?: boolean;
  /** Clicking an empty spot blasts the nearby balls away with a flash of light. */
  clickEffect?: BallpitClickEffect;
  /** Color of the light that follows the cursor. */
  lightColor?: string;
  /** Brightness of the cursor light. */
  lightIntensity?: number;
  /** Overall brightness of the balls. */
  exposure?: number;
  /** Strength of the soft shadows where balls touch each other and the floor. */
  shadows?: number;
  /** Balls pour in from the top on mount, or burst out from the center when gravity is near zero. */
  intro?: boolean;
  /** Maximum device pixel ratio, capped at 2. Defaults to the screen's ratio. */
  dpr?: number;
  class?: string;
}

export interface BallpitSettings {
  count: number;
  colors: BallpitColor[];
  material: BallpitMaterial;
  minSize: number;
  maxSize: number;
  gravity: number;
  friction: number;
  wallBounce: number;
  bounce: number;
  depth: number;
  drift: number;
  followCursor: boolean;
  cursorSize: number;
  grab: boolean;
  clickEffect: BallpitClickEffect;
  lightColor: string;
  lightIntensity: number;
  exposure: number;
  shadows: number;
  intro: boolean;
  dpr: number | undefined;
  reduce: boolean;
}

export interface BallpitMaterialSpec {
  roughness: number;
  metalness: number;
  coat: number;
  coatRoughness: number;
  scatter: number;
  frost: number;
}

export interface BallpitEngine {
  resize: () => void;
  wake: () => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  pointerCancel: () => void;
  pointerLeave: () => void;
  destroy: () => void;
}
