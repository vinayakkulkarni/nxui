export interface FolderItem {
  title?: string;
  description?: string;
  image?: string;
  alt?: string;
  /** Set to 'anonymous' for remote images so the glass variant can refract them. */
  crossOrigin?: '' | 'anonymous' | 'use-credentials';
}

export type FolderEntry = FolderItem | string | number;

export type FolderMode = 'flap' | 'book';
export type FolderVariant = 'solid' | 'glass' | 'matte';
export type FolderTabPosition = 'left' | 'center' | 'right';
export type FolderLayout = 'spread' | 'stack' | 'row';
export type FolderOpenOn = 'click' | 'hover';
export type FolderTheme = 'dark' | 'light';

export interface FolderProps {
  items?: FolderEntry[];
  label?: string;
  mode?: FolderMode;
  variant?: FolderVariant;
  color?: string;
  paperColor?: string;
  tabPosition?: FolderTabPosition;
  layout?: FolderLayout;
  size?: number;
  openOn?: FolderOpenOn;
  open?: boolean;
  defaultOpen?: boolean;
  draggable?: boolean;
  zoomOnClick?: boolean;
  peek?: boolean;
  intro?: boolean;
  tilt?: number;
  bounce?: number;
  speed?: number;
  frost?: number;
  closeOnOutsideClick?: boolean;
  theme?: FolderTheme;
  class?: string;
}

export interface FolderItemSlotProps {
  item: FolderEntry;
  index: number;
}

export interface FolderEmits {
  'update:open': [open: boolean];
  itemClick: [item: FolderEntry, index: number];
  itemDrop: [item: FolderEntry, index: number, inside: boolean];
}

export interface FolderSlots {
  item?: (props: FolderItemSlotProps) => unknown;
}

export interface FolderItemMatrix {
  index: number;
  matrix: FolderMatrix;
  layer: number;
  alpha: number;
  inside: boolean;
}

export type FolderMatrix = number[];
export type FolderRgb = number[];
export type FolderPhase = 'open' | 'receive' | 'peek' | 'rest';

export interface FolderGeometry {
  book: boolean;
  scale: number;
  w: number;
  h: number;
  tabH: number;
  r: number;
  shoulder: number;
  corners: number[];
  tabW: number;
  tabX: number;
  frontTop: number;
  frontH: number;
  docW: number;
  docH: number;
}

export interface FolderSlot {
  x: number;
  y: number;
  z: number;
  r: number;
  ry: number;
  s: number;
}

export interface FolderView {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FolderBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface FolderGlProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface FolderGlTarget {
  texture: WebGLTexture | null;
  frame: WebGLFramebuffer | null;
}

export interface FolderGlassPane {
  matrix: FolderMatrix;
  width: number;
  height: number;
  radii: number[];
  spine: number;
  bleed: number;
  morph: number;
  insideTop: number[];
  insideBottom: number[];
  tabRatio: number;
  gutter: number[];
  bevel: number;
  strength: number;
  split: number;
  lens: number;
  frost: number;
  tint: number[];
  haze: number;
  dim: number;
  glint: number;
  shine: number;
  light: number[];
}

export interface FolderSceneLayer {
  key: string;
  matrix: FolderMatrix;
  width: number;
  height: number;
  alpha: number;
}

export interface FolderScene {
  dpr: number;
  depth: number;
  origin: number[];
  view: FolderView;
  layers: FolderSceneLayer[];
  glass: FolderGlassPane;
}

export interface FolderGlassRenderer {
  upload: (key: string, source: HTMLCanvasElement) => void;
  prune: (keys: Set<string>) => void;
  render: (scene: FolderScene) => void;
  dispose: () => void;
}

export interface FolderRaster {
  canvas: HTMLCanvasElement;
  pending: HTMLImageElement[];
}

export interface FolderSpring {
  value: number;
  velocity: number;
}

export interface FolderItemState {
  x: FolderSpring;
  y: FolderSpring;
  z: FolderSpring;
  r: FolderSpring;
  ry: FolderSpring;
  s: FolderSpring;
  hover: FolderSpring;
  mx: FolderSpring;
  my: FolderSpring;
  alpha: FolderSpring;
  place: 'inside' | 'out';
  rank: number;
  layer: 'inside' | 'out' | 'drag' | 'focus';
  elevated: boolean;
  insertUntil: number;
  insertFrom: 'side' | 'top' | null;
  outX: number;
  outY: number;
  outR: number;
  outS: number;
  outOrder: number;
  localX: number;
  localY: number;
  fresh: boolean;
}

export interface FolderDragState {
  index: number;
  id: number;
  clientX: number;
  clientY: number;
  downX: number;
  downY: number;
  grabX: number;
  grabY: number;
  scale: number;
  clip: FolderBounds | null;
  active: boolean;
  samples: number[][];
}

export interface FolderIntroState {
  phase: 'wait' | 'run' | 'done';
  start: number;
  opening: boolean;
}

export interface FolderContentState {
  key: string;
  entries: FolderEntry[] | null;
  renderer: FolderGlassRenderer | null;
}

export interface FolderEngineState {
  raf: number;
  last: number;
  ready: boolean;
  hovered: boolean;
  pressed: boolean;
  pointerX: number;
  pointerY: number;
  deskX: number;
  deskY: number;
  hoveredItem: number;
  phase: FolderPhase;
  previous: FolderPhase;
  changedAt: number;
  front: FolderSpring;
  rx: FolderSpring;
  ry: FolderSpring;
  lift: FolderSpring;
  squash: FolderSpring;
  items: FolderItemState[];
  focus: number;
  drag: FolderDragState | null;
  receiving: boolean;
  receiveUntil: number;
  suppressClick: boolean;
  dropCount: number;
  intro: FolderIntroState;
  anchor: FolderSpring;
  appear: number;
  content: FolderContentState;
}

export interface FolderSettings {
  open: boolean;
  layout: FolderLayout;
  openOn: FolderOpenOn;
  peek: boolean;
  draggable: boolean;
  zoomOnClick: boolean;
  closeOnOutsideClick: boolean;
  tilt: number;
  bounce: number;
  speed: number;
  frost: number;
  count: number;
  entries: FolderEntry[];
  glass: boolean;
  light: boolean;
  tint: FolderRgb;
  insideTop: string;
  insideBottom: string;
  insideTone: number[][];
  content: string;
  depth: number;
  view: FolderView;
  g: FolderGeometry;
}

export interface FolderEngineElements {
  root: HTMLElement;
  back: () => HTMLElement | null;
  front: () => HTMLElement | null;
  ground: () => HTMLElement | null;
  cast: () => HTMLElement | null;
  shade: () => HTMLElement | null;
  canvas: () => HTMLCanvasElement | null;
  item: (index: number) => HTMLElement | null;
  renderer: () => FolderGlassRenderer | null;
}

export interface FolderEngineOptions {
  elements: FolderEngineElements;
  settings: () => FolderSettings;
  reduce: () => boolean;
  setOpen: (open: boolean) => void;
  setOutside: (indices: number[]) => void;
  onItemClick: (item: FolderEntry, index: number) => void;
  onItemDrop: (item: FolderEntry, index: number, inside: boolean) => void;
}

export interface FolderEngine {
  wake: () => void;
  invalidate: () => void;
  consumeClick: () => boolean;
  interactive: (index: number) => boolean;
  select: (index: number) => void;
  blur: () => boolean;
  waitForIntro: () => void;
  beginIntro: () => void;
  onMove: (event: PointerEvent) => void;
  onLeave: (event: PointerEvent) => void;
  onDown: (event: PointerEvent) => void;
  onUp: (event: PointerEvent) => void;
  onDocumentDown: (event: PointerEvent) => void;
  onKey: (event: KeyboardEvent) => void;
  dispose: () => void;
}
