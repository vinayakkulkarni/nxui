import type { HTMLAttributes } from 'vue';
import type { MotionValue } from 'motion-v';

export type JellyRadioSize = 'sm' | 'md' | 'lg';

export interface JellyRadioOption {
  value: string;
  label: string;
  /** Iconify name rendered before the label, e.g. `lucide:sun`. */
  icon?: string;
  disabled?: boolean;
}

/** A string is both value and label. */
export type JellyRadioItem = string | JellyRadioOption;

export interface JellyRadioProps {
  /** The chips. */
  items?: JellyRadioItem[];
  /** Controlled value (`v-model`). Outside changes jump. */
  modelValue?: string;
  /** Initial value when uncontrolled. Defaults to the first item. */
  defaultValue?: string;
  /** Surface of an unchosen chip. */
  chipColor?: string;
  /** Surface of the chosen chip. */
  activeColor?: string;
  /** Label of an unchosen chip, and the hover tone. */
  textColor?: string;
  /** Label of the chosen chip. */
  activeTextColor?: string;
  /** Chip height 28, 36 or 44 pixels. */
  size?: JellyRadioSize;
  /** Rest spacing between chips in pixels. */
  gap?: number;
  /** Corner radius in pixels. */
  radius?: number;
  /** How much the chosen chip grows. */
  swell?: number;
  /** Extra pixels every neighbour is shoved beyond the room it makes. */
  barge?: number;
  /** How much every unchosen chip gives up. */
  shrink?: number;
  /** The wide-before-tall split. 0 swells uniformly. */
  jelly?: number;
  /** One minus the damping ratio. */
  bounce?: number;
  /** Milliseconds per row step before a neighbour moves. */
  stagger?: number;
  /** Spring stiffness of the chosen chip. */
  stiffness?: number;
  /** Fades the group and ignores input. */
  disabled?: boolean;
  /** Accessible name of the group. */
  ariaLabel?: string;
  class?: HTMLAttributes['class'];
}

/** Internal: the motion values that drive one chip. */
export interface JellyRadioChipValues {
  x: MotionValue<number>;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  off: () => void;
}
