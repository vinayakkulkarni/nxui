/** Edge of the container the wheel curves around. */
export type OptionWheelSide = 'left' | 'right';

/**
 * Props for the OptionWheel registry component.
 */
export interface OptionWheelProps {
  /** Labels rendered as the wheel options. */
  items?: string[];
  /** Index of the option selected on mount. */
  defaultSelected?: number;
  /** Resting color of the option labels. */
  textColor?: string;
  /** Color an option blends toward as it reaches the middle. */
  activeColor?: string;
  /** Edge of the container the wheel curves around. */
  side?: OptionWheelSide;
  /** Font size of the option labels in rem. */
  fontSize?: number;
  /** Distance between options as a multiple of the font size. */
  spacing?: number;
  /** Depth of the curve; 0 flattens the wheel into a straight list. */
  curve?: number;
  /** Angle in degrees between neighbouring options. */
  tilt?: number;
  /** Blur in px added per step away from the middle. */
  blur?: number;
  /** Opacity lost per step away from the middle. */
  fade?: number;
  /** Opacity floor for the furthest options. */
  minOpacity?: number;
  /** Easing time constant in ms. */
  smoothing?: number;
  /** Padding in px between the anchored edge and the options. */
  inset?: number;
  /** Wrap around instead of stopping at the ends. */
  loop?: boolean;
  /** Allow dragging the wheel with a pointer. */
  draggable?: boolean;
  /** URL of a short tick played when the selection changes. Empty disables it. */
  soundUrl?: string;
  /** Playback volume of the tick, from 0 to 1. */
  soundVolume?: number;
  /** Extra classes on the root. */
  class?: string;
}

/** Active pointer drag. */
export interface OptionWheelDrag {
  y: number;
  start: number;
  id: number;
}
