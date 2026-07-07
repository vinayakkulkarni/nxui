export interface TyperTextProps {
  /** Text to type out. */
  text: string;
  /** Accent color for the sweeping cursor block and word outlines. */
  accent?: string;
  /** Reveal speed in characters per second. */
  speed?: number;
  /** Scramble cycles each character runs through before settling. */
  cycles?: number;
  /** Seconds between each word's outline box appearing. */
  stagger?: number;
  /** Start typing as soon as the component mounts. */
  autoplay?: boolean;
  /** Loop the animation after a pause. */
  loop?: boolean;
  /** Milliseconds to hold the finished text before looping. */
  holdDuration?: number;
  class?: string;
}
