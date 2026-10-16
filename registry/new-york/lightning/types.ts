export interface LightningProps {
  /** Color of the lightning. The hottest parts glow white. */
  color?: string;
  /** How many bolts to draw, from 1 to 4. */
  bolts?: number;
  /** Space between bolts when there is more than one. */
  spread?: number;
  /** How many side branches split off and flash along the bolts, from 0 to 1. */
  branches?: number;
  /** Moves the bolts sideways. */
  xOffset?: number;
  /** Tilts the bolts, in degrees. 90 runs them across. */
  angle?: number;
  /** Scale of the jagged path. Higher is more crooked. */
  size?: number;
  /** Thickness of the bright core. */
  thickness?: number;
  /** How far the glow spreads around the bolts. */
  glow?: number;
  /** Overall brightness. */
  intensity?: number;
  /** How fast the bolts crawl. The motion loops seamlessly every 10 seconds at 1. */
  speed?: number;
  /** Strength of the flicker and sudden flashes, from 0 to 1. */
  flicker?: number;
  /** Bolts bend toward the cursor, crackle and grow extra branches near it. */
  mouseInteraction?: boolean;
  /** How strongly the bolts bend toward the cursor. */
  mouseStrength?: number;
  /** Clicking calls down a bolt that strikes the spot and briefly flashes the others. */
  clickStrike?: boolean;
  /** Lets the bolts descend from the top on first load. */
  intro?: boolean;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Draws the lightning as crisp ink strokes for light backgrounds. */
  lightMode?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  /** Extra classes for the canvas. */
  class?: string;
}

export interface LightningSettings {
  color: string;
  bolts: number;
  spread: number;
  branches: number;
  xOffset: number;
  angle: number;
  size: number;
  thickness: number;
  glow: number;
  intensity: number;
  speed: number;
  flicker: number;
  mouseInteraction: boolean;
  mouseStrength: number;
  clickStrike: boolean;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr: number | undefined;
  reduce: boolean;
}

export interface LightningStrike {
  x: number;
  y: number;
  born: number;
  seed: number;
  reach: number;
}

export interface LightningEngine {
  refresh: () => void;
  setVisible: (visible: boolean) => void;
  visibilityChange: () => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerOut: (event: PointerEvent) => void;
  destroy: () => void;
}
