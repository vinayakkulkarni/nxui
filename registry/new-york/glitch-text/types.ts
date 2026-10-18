export type GlitchTextMode = 'slices' | 'rgb' | 'scan' | 'noise';

export type GlitchTextTrigger = 'always' | 'hover' | 'click';

export interface GlitchTextEvent {
  until: number;
  aTop: number;
  aHeight: number;
  bTop: number;
  bHeight: number;
  ax: number;
  bx: number;
  ay: number;
  by: number;
  skew: number;
  fresh: boolean;
}

export interface GlitchTextProps {
  /** The text that glitches. */
  text: string;
  /** Multiplier for the animation speed. Higher values slow the glitch down. */
  speed?: number;
  /** Toggle the glitch colors. Without them every mode stays in the text color. */
  enableShadows?: boolean;
  /** Same as trigger="hover": the glitch only runs while hovered. */
  enableOnHover?: boolean;
  /** How far the glitched slices shift sideways, in px. */
  offset?: number;
  /** The two glitch colors. */
  shadowColors?: [string, string];
  /** Style of glitch. */
  mode?: GlitchTextMode;
  /** How often and how far it glitches, from 0 (calm) to 1 (constant). */
  intensity?: number;
  /** How far the text shears sideways during a jolt, in degrees. */
  skew?: number;
  /** Adds quick, subtle dips in opacity while it glitches. */
  flicker?: boolean;
  /** When it glitches: all the time, while hovered, or in a burst on each click. */
  trigger?: GlitchTextTrigger;
  /** Length of the burst played on each click, in seconds. */
  burstDuration?: number;
  /** Color of the text. */
  color?: string;
  /** Font size. Numbers are in px. */
  fontSize?: number | string;
  /** Font weight. */
  fontWeight?: number | string;
  /** Classes merged onto the root. */
  class?: string;
}
