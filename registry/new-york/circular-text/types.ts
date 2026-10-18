export type CircularTextHover = 'slowDown' | 'speedUp' | 'pause' | 'goBonkers';
export type CircularTextDirection = 'clockwise' | 'counterclockwise';

export interface CircularTextProps {
  /** Text laid out around the ring. End it with a separator for a seamless loop. */
  text: string;
  /** Seconds for one full turn. 0 keeps the ring still until it is dragged. */
  spinDuration?: number;
  /** What happens while the pointer is over the ring. `null` does nothing. */
  onHover?: CircularTextHover | null;
  /** Which way the ring turns. */
  direction?: CircularTextDirection;
  /** Diameter in px. */
  size?: number;
  /** Letter size in px. */
  fontSize?: number;
  /** Letter weight. */
  fontWeight?: number;
  /** Extra space between letters in em. Applies when `fill` is off. */
  letterSpacing?: number;
  /** Letter and center color. Empty follows the surrounding text color. */
  color?: string;
  /** Where the first letter sits, in degrees clockwise from the top. */
  startAngle?: number;
  /** Spread the letters evenly around the whole ring. */
  fill?: boolean;
  /** How many times the text repeats around the ring. */
  repeat?: number;
  /** Draw a thin circle just inside the letters. */
  ring?: boolean;
  /** Inner circle color. Empty matches the letters. */
  ringColor?: string;
  /** Lean the ring back in perspective, in degrees. */
  tilt?: number;
  /** How far the ring tilts toward the pointer, in degrees. */
  hoverTilt?: number;
  /** Grab the ring and fling it. */
  draggable?: boolean;
  class?: string;
}
