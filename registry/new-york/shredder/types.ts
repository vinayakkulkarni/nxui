export type ShredderKey = string | number;

export interface ShredderItem {
  id: ShredderKey;
}

export interface ShredderProps<T extends ShredderItem> {
  /** Rows to render, top to bottom. Each item needs a unique id. */
  items?: T[];
  /** Width of the whole machine in pixels. */
  width?: number;
  /** Total height in pixels. */
  height?: number;
  /** Horizontal inset of the rows from the edges. */
  inset?: number;
  /** Space between rows in pixels. */
  gap?: number;
  /** Thickness of the slit. */
  slitHeight?: number;
  /** Height of the zone under the slit where strips fall and fade. */
  fallHeight?: number;
  /** Roller speed in pixels per second. */
  feedSpeed?: number;
  /** How far a row must be pushed into the slit before the rollers grab it. */
  bite?: number;
  /** Grab a row as soon as it is pushed in far enough, even while held. */
  autoFeed?: boolean;
  /** Target width of each strip in pixels. */
  stripWidth?: number;
  /** How much the strips curl and wave. 0 keeps them straight. */
  curl?: number;
  /** Shred the rows on its own, bottom to top, then bring them back. */
  autoAnimate?: boolean;
  /** Bring every row back once the last one is shredded. */
  loop?: boolean;
  /** Bring a shredded row back at a random spot a moment later. */
  loopAfterDelete?: boolean;
  /** Maximum lean in degrees while a row is dragged sideways. */
  dragTilt?: number;
  /** Scale of a row while it is held. */
  lift?: number;
  /** Colour of the slit. */
  slitColor?: string;
  /** Text colour inherited by the rows. */
  color?: string;
  /** Rows cannot be dragged or shredded. */
  disabled?: boolean;
  class?: string;
}

export interface ShredderEmits<T extends ShredderItem> {
  shred: [item: T];
  reorder: [items: T[]];
}

export interface ShredderSlots<T extends ShredderItem> {
  default?: (props: { item: T; index: number }) => unknown;
}

export interface ShredderMetrics {
  left: number;
  top: number;
  k: number;
  rw: number;
  lip: number;
  exit: number;
}

export interface ShredderPoint {
  x: number;
  y: number;
}

export interface ShredderTexture {
  tex: HTMLCanvasElement;
  scale: number;
}

export type ShredderDragPhase = 'drag' | 'carry' | 'return';

export interface ShredderDrag<T extends ShredderItem> {
  key: ShredderKey;
  item: T;
  el: HTMLDivElement;
  slot: HTMLLIElement;
  W: number;
  H: number;
  rx: number;
  ry: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  tilt: number;
  lift: number;
  gx: number;
  gy: number;
  px: number;
  py: number;
  ox: number;
  oy: number;
  moved: boolean;
  from: number;
  j: number;
  phase: ShredderDragPhase;
  id: number | null;
  snap: Promise<ShredderTexture>;
  fill: string;
}

export interface ShredderFeed<T extends ShredderItem> {
  key: ShredderKey;
  item: T;
  el: HTMLDivElement;
  slot: HTMLLIElement;
  W: number;
  H: number;
  rx: number;
  ry: number;
  tx: number;
  tilt: number;
  lift: number;
  v: number;
  age: number;
  tex: HTMLCanvasElement | null;
  ts: number;
  consumed: boolean;
  strips: number;
}

export interface ShredderStrip {
  feed: { tex: HTMLCanvasElement | null; ts: number };
  x: number;
  w: number;
  H: number;
  phase: 'attached' | 'free';
  curl: number;
  amp: number;
  freq: number;
  wave: number;
  rA: number;
  rB: number;
  speed: number;
  splay: number;
  core: number;
  rest: number;
  alpha: number;
  th: number;
  ax: number;
  ay: number;
  vx: number;
  vy: number;
  hang: number;
  pts: number[];
}

export interface ShredderStripOf<T extends ShredderItem> extends ShredderStrip {
  feed: ShredderFeed<T>;
}

export interface ShredderShift {
  el: HTMLLIElement;
  y: number;
  v: number;
  target: number;
  delay: number;
  item: HTMLDivElement | null;
}

export interface ShredderSim<T extends ShredderItem> {
  raf: number;
  last: number;
  t: number;
  drag: ShredderDrag<T> | null;
  feeds: ShredderFeed<T>[];
  strips: ShredderStripOf<T>[];
  shifts: Map<HTMLLIElement, ShredderShift>;
  tops: Map<HTMLLIElement, number>;
  timers: Set<ReturnType<typeof setTimeout>>;
  dpr: number;
  cw: number;
  ch: number;
}
