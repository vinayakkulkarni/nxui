export type RubberSegmentSize = 'sm' | 'md' | 'lg';

export interface RubberSegmentOption {
  value: string;
  label: string;
  /** Iconify name rendered before the label, e.g. `lucide:list`. */
  icon?: string;
}

export type RubberSegmentItem = string | RubberSegmentOption;

export interface RubberSegmentProps {
  items: RubberSegmentItem[];
  /** Controlled value (v-model). A change from outside jumps the thumb. */
  modelValue?: string;
  /** Initial value when uncontrolled; the first item if omitted. */
  defaultValue?: string;
  trackColor?: string;
  thumbColor?: string;
  textColor?: string;
  activeTextColor?: string;
  size?: RubberSegmentSize;
  radius?: number;
  inset?: number;
  equalSlots?: boolean;
  stretch?: number;
  squash?: number;
  speed?: number;
  glide?: number;
  draggable?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  class?: string;
}

export interface RubberSegmentSlot {
  l: number;
  r: number;
}

export type RubberSegmentSample = [number, number];

export interface RubberSegmentDrag {
  id: number;
  x0: number;
  slot: number;
  onThumb: boolean;
  live: boolean;
  offset: number;
  w: number;
  hist: RubberSegmentSample[];
}

export interface RubberSegmentSizePreset {
  height: number;
  font: number;
  pad: number;
  min: number;
}
