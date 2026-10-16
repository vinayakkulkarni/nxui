import type { ComputedRef } from 'vue';

export type WarmTooltipSide = 'top' | 'bottom' | 'left' | 'right';
export type WarmTooltipSize = 'sm' | 'md' | 'lg';
export type WarmTooltipMode = 'cold' | 'warm' | 'instant' | 'move';
export type WarmTooltipState = 'closed' | 'open' | 'closing';

export interface WarmTooltipProps {
  /** The label. Keep it to a few words. Use the `content` slot for rich content. */
  content?: string;
  /** Optional keyboard shortcut, drawn as a keycap beside the label. */
  shortcut?: string;
  /** The edge the label hangs from; also where the fuse runs and the pop originates. */
  side?: WarmTooltipSide;
  /** How long a cold open waits, in ms. Inherits the group value when omitted. */
  delay?: number;
  /** How long after this label closes the group stays warm, in ms. Inherits the group value when omitted. */
  warmWindow?: number;
  /** Label background, arrow and fuse. */
  surfaceColor?: string;
  /** Label text; the keycap is tinted from it. */
  inkColor?: string;
  /** Font size and padding of the label. */
  size?: WarmTooltipSize;
  /** Corner radius of the label in px. */
  radius?: number;
  /** Distance between the trigger edge and the label, in px. */
  gap?: number;
  /** Shows the pointer on the anchored edge. */
  arrow?: boolean;
  /** Cold pop-in time in ms; the exit takes 0.8 of it. */
  popDuration?: number;
  /** Scale the label pops from. 1 makes it a fade. */
  popScale?: number;
  /** Blur in px the label arrives through. */
  popBlur?: number;
  /** Thin line along the trigger edge that fills over the delay, or over the long press on touch. */
  showFuse?: boolean;
  /** Hold time in ms that opens the label on touch; the click that follows is swallowed. */
  longPress?: number;
  /** No open path; an open label closes. */
  disabled?: boolean;
  class?: string;
}

export interface WarmTooltipGroupProps {
  /** Cold-open delay in ms shared by the group's tooltips. */
  delay?: number;
  /** How long the group stays warm after a label closes, in ms. */
  warmWindow?: number;
  /** How long the label takes to glide to the next trigger, in ms. `0` hops. */
  travel?: number;
  /** Degrees of tilt while gliding. */
  lean?: number;
}

export interface WarmTooltipPayload {
  id: string;
  trigger: HTMLElement;
  content: string;
  shortcut: string;
  side: WarmTooltipSide;
  gap: number;
  arrow: boolean;
  surfaceColor: string;
  inkColor: string;
  radius: number;
  font: number;
  px: number;
  py: number;
  popDuration: number;
  popScale: number;
  popBlur: number;
  warmWindow: number;
}

export interface WarmTooltipSwap {
  dir: number;
  across: boolean;
}

export interface WarmTooltipGroupContext {
  id: string;
  delay: ComputedRef<number>;
  warmWindow: ComputedRef<number>;
  activeId: ComputedRef<string | null>;
  isWarm: () => boolean;
  show: (payload: WarmTooltipPayload, mode: WarmTooltipMode) => void;
  hide: (tooltipId: string, instant: boolean) => void;
  reset: () => void;
}

export interface WarmTooltipGroupExpose {
  /** Closes any open label and forgets the warm window. */
  reset: () => void;
}
