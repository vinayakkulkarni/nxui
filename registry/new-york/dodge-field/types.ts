import type { HTMLAttributes } from 'vue';

export type DodgeFieldAxis = 'both' | 'x' | 'y';

export type DodgeFieldWall = 'clamp' | 'bounce';

export interface DodgeFieldState {
  /** Counted dodges since the last catch. */
  dodges: number;
  /** True once `patience` dodges have been counted and it sits still. */
  gave: boolean;
  /** True for a moment after the child is clicked. */
  caught: boolean;
  /** True while the pointer is inside the radius and it is running. */
  fleeing: boolean;
}

export interface DodgeFieldProps {
  /** Labels for the built-in pill: the first at rest, one per dodge, the last once it relents. */
  taunts?: string[];
  /** One line shown under the child on touch devices, where nothing dodges. */
  notice?: string;
  /** Pill tint, text, caught fill and focus ring all derive from it. */
  inkColor?: string;
  /** Text colour while the pill is caught. */
  contrastColor?: string;
  /** Height of the invisible field in pixels; its width is the container. */
  fieldHeight?: number;
  /** How far it bolts, in pixels, with the pointer on its home. */
  reach?: number;
  /** Distance from home at which it starts to react, in pixels. */
  radius?: number;
  /** Exponent of the reaction curve. */
  falloff?: number;
  /** Settle time of the dart, in milliseconds. */
  fleeDuration?: number;
  /** Settle time of the glide home, in milliseconds. */
  returnDuration?: number;
  /** Overshoot on the way home. */
  returnBounce?: number;
  /** Which way it may flee. */
  axis?: DodgeFieldAxis;
  /** At the edge of the field: stop dead, or fold the overflow back. */
  wall?: DodgeFieldWall;
  /** Dodges before it gives in and sits still, at least 1. */
  patience?: number;
  /** Sits still and stops counting; the child stays clickable. */
  disabled?: boolean;
  class?: HTMLAttributes['class'];
}
