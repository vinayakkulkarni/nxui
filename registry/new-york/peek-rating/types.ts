export type PeekRatingShape = 'star' | 'heart' | 'bolt';

export interface PeekRatingProps {
  /** Controlled rating, from 0 to count (v-model). */
  modelValue?: number;
  /** Initial rating when uncontrolled. */
  defaultValue?: number;
  /** Number of glyphs. */
  count?: number;
  /** Built-in glyph shape. */
  shape?: PeekRatingShape;
  /** Iconify name of a custom glyph that replaces the built-in shape. */
  icon?: string;
  /** One label per glyph, shown in the tip while previewing. */
  labels?: string[];
  /** Colour of lit glyphs and of the focus ring. */
  activeColor?: string;
  /** Colour of unlit glyphs. */
  idleColor?: string;
  /** Background of the tip that follows the pointer. */
  tipColor?: string;
  /** Text colour of the tip. */
  tipTextColor?: string;
  /** Glyph size in pixels; spacing and the tip scale with it. */
  size?: number;
  /** How far previewed glyphs rise, in pixels. */
  lift?: number;
  /** Scale of the glyph under the pointer. */
  magnify?: number;
  /** Duration in ms of each glyph's rise and fall, and of the tip's hop. */
  riseDuration?: number;
  /** Peak scale of the pop on the committed glyph. 1 disables it. */
  popScale?: number;
  /** Shows the tip above the pointer glyph while previewing. */
  showTip?: boolean;
  /** Clicking the current rating again, or Backspace, clears it to 0. */
  allowClear?: boolean;
  /** Display only: no preview, no pop, announced as an image. */
  readOnly?: boolean;
  /** Dims the control and ignores input. */
  disabled?: boolean;
  /** Accessible name of the radio group. */
  ariaLabel?: string;
  class?: string;
}

export interface PeekRatingState {
  hover: number | null;
  pressing: boolean;
  pointerId: number | null;
  settled: boolean;
  rect: DOMRect | null;
  rtl: boolean;
}
