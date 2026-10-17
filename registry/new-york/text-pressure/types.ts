export type TextPressureIdle = 'none' | 'wave' | 'pulse';

export interface TextPressurePoint {
  x: number;
  y: number;
}

export interface TextPressureRipple extends TextPressurePoint {
  start: number;
}

export interface TextPressureApplied {
  span: HTMLSpanElement;
  settings: string;
  alphaVal: string;
  color: string;
}

export interface TextPressureProps {
  /** Text content that will be displayed and animated. */
  text?: string;
  /** Name of the variable font family. */
  fontFamily?: string;
  /** Stylesheet URL that loads the variable font. Needs width, weight and italic axes. */
  fontUrl?: string;
  /** Varies the width axis of the font with pressure. */
  width?: boolean;
  /** Varies the weight axis of the font with pressure. */
  weight?: boolean;
  /** Varies the italic axis of the font with pressure. */
  italic?: boolean;
  /** Fades letters out the further they are from the cursor. */
  alpha?: boolean;
  /** Spreads the letters across the full width. */
  flex?: boolean;
  /** Draws an outline behind each letter. */
  stroke?: boolean;
  /** Stretches the text vertically to fill the height of its container. */
  scale?: boolean;
  /** How far the cursor's pull reaches, as a fraction of the text width. */
  radius?: number;
  /** How softly the letters follow the cursor, from 0 (instant) to 1 (floaty). */
  smoothing?: number;
  /** What the letters do while the pointer is away. */
  idle?: TextPressureIdle;
  /** Speed of the idle wave or pulse. */
  idleSpeed?: number;
  /** Clicking sends a wave of pressure rippling outward through the letters. */
  clickRipple?: boolean;
  /** Fill color of the text. */
  textColor?: string;
  /** Letters blend toward this color as they swell. Empty keeps one color. */
  pressureColor?: string;
  /** Color of the outline when stroke is on. */
  strokeColor?: string;
  /** Width of the outline when stroke is on, in px. */
  strokeWidth?: number;
  /** Minimum font size in px. */
  minFontSize?: number;
  /** Classes merged onto the heading. */
  class?: string;
}
