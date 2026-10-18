export type CountUpDirection = 'up' | 'down';
export type CountUpMode = 'count' | 'roll';
export type CountUpEasing = 'linear' | 'easeOut' | 'expo' | 'spring';
export type CountUpFormat = 'standard' | 'compact';
export type CountUpTrigger = 'view' | 'load';

export interface CountUpProps {
  /** The target number to count to. */
  to: number;
  /** The number the count starts from. */
  from?: number;
  /** `down` swaps `from` and `to` to count down. */
  direction?: CountUpDirection;
  /** Delay in seconds before the count starts. */
  delay?: number;
  /** How long the count takes, in seconds. */
  duration?: number;
  /** Gate the start: the count only begins while this is true. */
  startWhen?: boolean;
  /** Thousands separator. */
  separator?: string;
  /** Text before the number, like a currency sign. */
  prefix?: string;
  /** Text after the number, like a percent sign or a unit. */
  suffix?: string;
  /** `count` swaps digits; `roll` spins each digit like an odometer. */
  mode?: CountUpMode;
  /** Pace of the count. `spring` overshoots slightly and settles. */
  easing?: CountUpEasing;
  /** Fixed decimals. When unset it follows the decimals in `from` and `to`. */
  decimals?: number;
  /** `compact` shortens large numbers to 1.2K, 3.4M or 5.6B. */
  format?: CountUpFormat;
  /** `view` starts when scrolled into view, `load` starts right away. */
  trigger?: CountUpTrigger;
  /** Replay on hover. In roll mode every column spins once more. */
  replayOnHover?: boolean;
  class?: string;
}

export interface CountUpEmits {
  start: [];
  end: [];
}

export interface CountUpPlay {
  id: number;
  from: number;
  to: number;
  spin: boolean;
  wait: boolean;
}

export interface CountUpFormatOptions {
  compact: boolean;
  decimals: number | undefined;
  places: number;
  separator: string;
}

export interface CountUpScale {
  size: number;
  label: string;
  digits: number;
}

export interface CountUpColumn {
  slot: number;
  index: number;
  place: number;
  from: number;
  to: number;
  enter: boolean;
  leave: boolean;
  delta: number;
}

export interface CountUpCharSlot {
  char: string;
  enter?: boolean;
  leave?: boolean;
  follow?: number;
}

export type CountUpSlot = CountUpColumn | CountUpCharSlot;

export interface CountUpRollModel {
  slots: CountUpSlot[];
  columns: CountUpColumn[];
  label: string;
}

export type CountUpEase = (t: number) => number;

export interface CountUpLiveColumn extends CountUpColumn {
  box: HTMLElement | null;
  strip: HTMLElement | null;
  blur: SVGElement | null;
  cells: (ChildNode | null)[];
  width: number;
  ease: CountUpEase;
  base: number;
  sigma: number;
  presence: number;
}

export interface CountUpMark extends CountUpCharSlot {
  node: HTMLElement;
  width: number;
}

export type CountUpPresetName = 'classic' | 'odometer' | 'revenue' | 'compact';

/** Demo look. `from`/`to`/`decimals` stay strings so they bind to text inputs. */
export interface CountUpPresetValues {
  mode: CountUpMode;
  easing: CountUpEasing;
  format: CountUpFormat;
  decimals: 'auto' | '0' | '1' | '2' | '3';
  from: string;
  to: string;
  duration: number;
  direction: CountUpDirection;
  separator: string;
  prefix: string;
  suffix: string;
  replayOnHover: boolean;
  /** Font size in rem. */
  size: number;
  weight: number;
}
