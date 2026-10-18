export type LaserFlowTheme = 'dark' | 'light';

export interface LaserFlowProps {
  /** Element the beam lands on. The light spreads along its top edge and spills over its corners. */
  surfaceRef?: HTMLElement | null;
  /** Horizontal position of the beam, from 0 (left) to 1 (right). */
  beamPosition?: number;
  /** Where the beam lands when no surface element is given, from 0 (top) to 1 (bottom). */
  surfaceLevel?: number;
  /** Color of the light. Every other tone is derived from it. */
  color?: string;
  /** Overall brightness of the light. */
  intensity?: number;
  /** Thickness of the beam and its glow. */
  beamWidth?: number;
  /** Size of the splash where the beam meets the surface. */
  flare?: number;
  /** How far the light travels along the surface. */
  spread?: number;
  /** How much light pours over the corners of the surface. */
  spill?: number;
  /** Amount of smoke lit up by the beam. 0 turns it off. */
  fog?: number;
  /** Amount of glittering dust flowing with the light. */
  dust?: number;
  /** Brightness of the fine lines flowing along the splash. */
  streaks?: number;
  /** Strength of the fine dot texture in the glow. */
  dots?: number;
  /** How much the splash breathes over time. */
  pulse?: number;
  /** Animation speed. 0 holds the light still. */
  speed?: number;
  /** Changes the shape of the smoke. */
  seed?: number;
  /** Brightens the light, smoke and dust softly around the cursor. */
  mouseInteraction?: boolean;
  /** Image revealed through the light around the cursor, such as a screenshot of your UI. */
  revealImage?: string;
  /** Radius of the reveal around the cursor, in pixels. */
  revealRadius?: number;
  /** Strength of the revealed image. 0 hides it. */
  revealOpacity?: number;
  /** Drops the beam in and lets the light run along the surface on mount. */
  intro?: boolean;
  /** Use `light` on light page backgrounds. */
  theme?: LaserFlowTheme;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. Defaults to the screen's ratio. */
  dpr?: number;
  class?: string;
}

export interface LaserFlowSurface {
  left: number;
  top: number;
  right: number;
  bottom: number;
  radius: number;
  real: boolean;
}
