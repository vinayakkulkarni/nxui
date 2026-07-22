export interface CircleInputProps {
  /** Number of character cells. */
  length?: number;
  /** Two-way bound value (uppercased, clamped to `length`). */
  modelValue?: string;
  /**
   * Words the autoplay demo types in a loop. When empty, autoplay is off and
   * the field waits for real keyboard input.
   */
  words?: string[];
  /** Auto-type the `words` in a loop when true. */
  autoplay?: boolean;
  /** Per-character type delay, in ms. */
  typeSpeed?: number;
  /** How long a completed word rests before the collapse, in ms. */
  holdDuration?: number;
  /** Accent color for the active ring + caret (any CSS color). */
  accent?: string;
  /** Diameter of each circular cell, in px. */
  size?: number;
  /** Gap between cells, in px. */
  gap?: number;
  class?: string;
}
