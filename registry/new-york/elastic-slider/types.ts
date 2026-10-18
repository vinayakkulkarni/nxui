import type { HTMLAttributes } from 'vue';

export type ElasticSliderOrientation = 'horizontal' | 'vertical';

export type ElasticSliderIconPlacement = 'outside' | 'inside';

export type ElasticSliderValuePosition = 'top' | 'bubble' | 'inside' | 'none';

export interface ElasticSliderProps {
  /** Controlled value (`v-model`). Leave unset for an uncontrolled slider. */
  modelValue?: number;
  /** Starting value when uncontrolled. */
  defaultValue?: number;
  /** Lowest value of the range. */
  startingValue?: number;
  /** Highest value of the range. */
  maxValue?: number;
  /** Snaps the value to `stepSize` increments. */
  isStepped?: boolean;
  /** Size of each step when `isStepped` is on. */
  stepSize?: number;
  /** Direction of the track. Vertical sliders fill from the bottom. */
  orientation?: ElasticSliderOrientation;
  /** Iconify name for the start icon. `null` or `''` hides it. The `left-icon` slot overrides it. */
  leftIcon?: string | null;
  /** Iconify name for the end icon. `null` or `''` hides it. The `right-icon` slot overrides it. */
  rightIcon?: string | null;
  /** Icons beside the track, or inside it once the track is thick enough. */
  iconPlacement?: ElasticSliderIconPlacement;
  /** Where the value shows. */
  valuePosition?: ElasticSliderValuePosition;
  /** Formats the shown value and the screen-reader value text. */
  formatValue?: (value: number) => string;
  /** Marks along the track: `true` = every step (or every tenth), or an array of values. */
  ticks?: boolean | number[];
  /** Shows a round handle at the end of the fill. */
  thumb?: boolean;
  /** Value the fill grows from. Defaults to `startingValue`. */
  fillFrom?: number;
  /** Track thickness in px at rest. */
  thickness?: number;
  /** Track thickness in px while hovered, focused or dragged. */
  activeThickness?: number;
  /** Corner radius of the track in px. Fully round when unset. */
  radius?: number;
  /** Opacity while idle. */
  restOpacity?: number;
  /** Hovering activates the slider. */
  growOnHover?: boolean;
  /** Furthest the track stretches in px when pulled past an end. 0 = off. */
  maxStretch?: number;
  /** Wobble when springing back, 0–0.95. */
  bounce?: number;
  /** Pressing the track jumps to the pointer. */
  jumpToClick?: boolean;
  /** Lets the scroll wheel change the value. */
  wheel?: boolean;
  /** Color of the empty track. */
  trackColor?: string;
  /** Color of the fill. */
  rangeColor?: string;
  /** Color of the outside icons. */
  iconColor?: string;
  /** Color of icons, values and ticks over the empty track. */
  contentColor?: string;
  /** Color of icons, values and ticks over the fill. `'auto'` picks light or dark. */
  fillContentColor?: string;
  /** Color of the handle. */
  thumbColor?: string;
  /** Turns off interaction and dims the slider. */
  disabled?: boolean;
  /** Accessible name of the slider. */
  ariaLabel?: string;
  class?: HTMLAttributes['class'];
}

export interface ElasticSliderMotion {
  p: number;
  vp: number;
  target: number;
  s: number;
  vs: number;
  side: number;
  held: boolean;
  a: number;
  va: number;
  goal: number;
  length: number;
  dragging: boolean;
  hovered: boolean;
  focused: boolean;
  raf: number;
  last: number;
  ready: boolean;
}

export interface ElasticSliderDrag {
  id: number;
  origin: number;
  from: number | null;
}
