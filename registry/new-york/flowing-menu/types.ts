export interface FlowingMenuItem {
  text: string;
  link?: string;
  image?: string;
  /** Text that scrolls in the band. Defaults to `text`. */
  marquee?: string;
  /** Short note shown at the end of the row. */
  meta?: string;
}

export type FlowingMenuDirection = 'left' | 'right' | 'alternate';
export type FlowingMenuAlign = 'center' | 'left';
export type FlowingMenuImageShape = 'pill' | 'rounded' | 'circle';
export type FlowingMenuEdge = 'top' | 'bottom' | 'center';

export interface FlowingMenuProps {
  items?: FlowingMenuItem[];
  speed?: number;
  direction?: FlowingMenuDirection;
  followCursor?: number;
  duration?: number;
  stretch?: number;
  magnet?: number;
  bandInset?: number;
  bandRadius?: number;
  carryContent?: boolean;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
  dividers?: boolean;
  dimInactive?: boolean;
  align?: FlowingMenuAlign;
  showIndex?: boolean;
  showArrow?: boolean;
  imageShape?: FlowingMenuImageShape;
  intro?: boolean;
  activeIndex?: number;
  ariaLabel?: string;
  class?: string;
}

export interface FlowingMenuColors {
  textColor: string;
  bgColor: string;
  marqueeBgColor: string;
  marqueeTextColor: string;
  borderColor: string;
}

export interface FlowingMenuPalette {
  dark: FlowingMenuColors;
  light: FlowingMenuColors;
}

export interface FlowingMenuEmits {
  'item-click': [item: FlowingMenuItem, index: number, event: MouseEvent];
}

export interface FlowingMenuSettings {
  speed: number;
  direction: FlowingMenuDirection;
  followCursor: number;
  duration: number;
  stretch: number;
  magnet: number;
  bandInset: number;
  bandRadius: number;
  carryContent: boolean;
  dimInactive: boolean;
  reduce: boolean;
}

export interface FlowingMenuRow {
  item: HTMLElement;
  band: HTMLElement | null;
  track: HTMLElement | null;
}

export interface FlowingMenuMarquee {
  x: number;
  part: number;
  spin: number;
  covered: boolean;
}

export interface FlowingMenuMetric {
  top: number;
  height: number;
}

export interface FlowingMenuBand {
  top: number;
  bottom: number;
  vTop: number;
  vBottom: number;
  toTop: number;
  toBottom: number;
  lead: number;
  shown: boolean;
  index: number;
  rest: number;
}

export interface FlowingMenuRoll {
  current: number;
  p: number;
  dir: number;
  slots: [number, number];
  fromOpacity: number;
  fromOffset: number;
}

export interface FlowingMenuCursor {
  x: number;
  y: number | null;
  t: number;
  vx: number;
}

export interface FlowingMenuLoop {
  raf: number;
  last: number;
  timers: ReturnType<typeof setTimeout>[];
  touched: boolean;
}

export interface FlowingMenuElements {
  root: () => HTMLElement | undefined;
  list: () => HTMLElement | undefined;
  float: () => HTMLElement | undefined;
}

export interface FlowingMenuEngineCallbacks {
  onCopies: (copies: number[]) => void;
  onSlots: (slots: [number, number]) => void;
}

export interface FlowingMenuEngine {
  collect: () => HTMLElement[];
  measure: () => void;
  paint: () => void;
  goTo: (index: number, from: FlowingMenuEdge) => void;
  release: (toward: FlowingMenuEdge) => void;
  halfOf: (clientY: number, index: number) => FlowingMenuEdge;
  pointerMove: (event: PointerEvent) => void;
  pointerLeave: (event: PointerEvent) => void;
  playIntro: () => void;
  stopIntro: () => void;
  destroy: () => void;
}
