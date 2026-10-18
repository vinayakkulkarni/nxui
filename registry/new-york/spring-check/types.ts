/** Side the strike-through wipes in from, or `none` for no rule. */
export type SpringCheckStrike = 'left' | 'center' | 'right' | 'none';

/**
 * Props for the SpringCheck registry component.
 */
export interface SpringCheckProps {
  /** Words beside the box. The strike-through matches their width. Overridden by the default slot. */
  label?: string;
  /** Checked state (`v-model`). Leave undefined for uncontrolled use. */
  modelValue?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  /** Dims the row and ignores input. */
  disabled?: boolean;
  /** Ink: the label, the ring, the rule and the focus outline. */
  color?: string;
  /** Fill that swells out of the box center. */
  fillColor?: string;
  /** Stroke of the tick drawn over the fill. */
  checkColor?: string;
  /** Box side in px. Ring, gap and row height derive from it. */
  boxSize?: number;
  /** Box corner radius in px. Half the size makes a circle. */
  boxRadius?: number;
  /** Label size in px. The rule thickness derives from it. */
  fontSize?: number;
  /** How far the fill swells past full. 0 arrives dead, 0.5 rebounds twice. */
  bounce?: number;
  /** Where on the spring the rule starts. 0 wipes with the fill, 0.4 waits for the tick. */
  strikeLag?: number;
  /** How much ink the words keep once checked. */
  doneOpacity?: number;
  /** Where the strike-through wipes from, or no rule at all. */
  strike?: SpringCheckStrike;
  /** Accessible name when the label is not text. */
  ariaLabel?: string;
  /** Extra classes for the row. */
  class?: string;
}

/** Visual readings derived from the spring value. */
export interface SpringCheckReadings {
  fill: string;
  box: string;
  tick: number;
  word: number;
  rule: string;
}
