import type { HTMLAttributes, StyleValue } from 'vue';

export type HoverTransitionEffect =
  | 'wipe'
  | 'ripple'
  | 'parallax'
  | 'curtain'
  | 'diagonal'
  | 'morph'
  | 'strips'
  | 'slide';

export type HoverTransitionDirection =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-right'
  | 'bottom-left'
  | 'center';

export interface HoverTransitionProps {
  /** The transition style used to swap the two slots. */
  effect?: HoverTransitionEffect;
  /** The origin or travel direction used by the active effect. */
  direction?: HoverTransitionDirection;
  /** Animation duration in seconds. */
  duration?: number;
  /** Any valid CSS easing value. */
  easing?: string;
  /** Accessible label for the focusable wrapper. */
  label?: string;
  class?: HTMLAttributes['class'];
}

export interface HoverTransitionFallbackProps {
  hover?: boolean;
}

export interface HoverTransitionVector {
  x: number;
  y: number;
}

/** Which slot a layer paints: the resting content or the revealed content. */
export type HoverTransitionLayerContent = 'default' | 'hover';

export interface HoverTransitionLayer {
  key: string;
  content: HoverTransitionLayerContent;
  style: StyleValue;
  /** Optional wrapper style inside the layer (parallax counter-motion). */
  innerStyle?: StyleValue;
}

export interface HoverTransitionSlotProps {
  active: boolean;
}

/** Inputs the per-effect layer builder needs. */
export interface HoverTransitionLayerContext {
  effect: HoverTransitionEffect;
  direction: HoverTransitionDirection;
  active: boolean;
  seconds: number;
  transitionFor: (
    properties: string[],
    delay?: number,
    durationScale?: number,
  ) => string;
}
