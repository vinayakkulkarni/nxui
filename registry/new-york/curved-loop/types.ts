export type CurvedLoopShape = 'arc' | 'wave' | 'circle' | 'line';

export type CurvedLoopDirection = 'left' | 'right';

export interface CurvedLoopProps {
  /** The text that loops along the path. Repeats are joined with a space. */
  marqueeText?: string;
  /** How fast the text travels along the path. 0 keeps it still until dragged or scrolled. */
  speed?: number;
  /** How far the path bends. On the arc it is the dip at the middle (negative arches up), on the wave it sets the wave height. */
  curveAmount?: number;
  /** Which way the text travels. On a circle, right turns clockwise. */
  direction?: CurvedLoopDirection;
  /** Lets people drag the text and fling it. */
  interactive?: boolean;
  /** Eases the text to a stop while the pointer is over it. */
  pauseOnHover?: boolean;
  /** Color of the text, or of its outline when outline is on. */
  color?: string;
  /** How much of each side fades out, from 0 to 1. */
  edgeFade?: number;
  /** The path the text travels on. */
  shape?: CurvedLoopShape;
  /** Letter size in px for a 1440px wide loop. */
  fontSize?: number;
  /** Weight of the letters. */
  fontWeight?: number | string;
  /** Extra space between letters in px, measured like fontSize. */
  letterSpacing?: number;
  /** Draws the letters as outlines instead of solid text. */
  outline?: boolean;
  /** A mark placed between repeats, such as ✦ or /. */
  separator?: string;
  /** Paints the separator in its own solid color. */
  separatorColor?: string;
  /** How much page scrolling speeds the loop up for a moment. 0 turns it off. */
  scrollBoost?: number;
  /** Classes merged onto the wrapper, for example to change the font. */
  class?: string;
}

export interface CurvedLoopGeometry {
  d: string;
  viewBox: string;
  radius: number;
  repeats: number;
  span: number;
}
