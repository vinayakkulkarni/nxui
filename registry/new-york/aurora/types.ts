export type AuroraDirection = 'top' | 'bottom';

export interface AuroraProps {
  /** Two to five colors that blend across the aurora from left to right. */
  colorStops?: string[];
  /** How tall the waves along the edge are. */
  amplitude?: number;
  /** How softly the edge fades out, from 0 to 1. */
  blend?: number;
  /** Speed of the flowing motion. */
  speed?: number;
  /** Drives the animation from your own clock instead of real time. */
  time?: number;
  /** How far the aurora reaches into the container, from 0 to 1. */
  height?: number;
  /** Size of the waves. Lower values make broader, calmer shapes. */
  scale?: number;
  /** How far the light spills softly past the edge. */
  glow?: number;
  /** Overall brightness of the light. */
  brightness?: number;
  /** Number of curtains, from 1 to 3. */
  layers?: number;
  /** Whether the aurora hangs from the top or rises from the bottom. */
  direction?: AuroraDirection;
  /** The light gently reaches toward the cursor. */
  mouseInteraction?: boolean;
  /** Fades the aurora in as it unfurls on mount. */
  intro?: boolean;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Draws the aurora as soft pastel light for white backgrounds. */
  lightMode?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

export interface AuroraSettings {
  stops: string[];
  amplitude: number;
  blend: number;
  speed: number;
  time: number | undefined;
  height: number;
  scale: number;
  glow: number;
  brightness: number;
  layers: number;
  flip: number;
  mouseInteraction: boolean;
  intro: boolean;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr: number | undefined;
  reduce: boolean;
}

export interface AuroraEngine {
  resize: () => void;
  wake: () => void;
  setVisible: (visible: boolean) => void;
  visibilityChange: () => void;
  pointerMove: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  pointerLeave: () => void;
  destroy: () => void;
}
