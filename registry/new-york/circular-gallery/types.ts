export interface GalleryItem {
  image: string;
  text?: string;
  description?: string;
  alt?: string;
}

export interface CircularGalleryProps {
  items?: GalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  fontUrl?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  itemSize?: number;
  itemAspect?: number;
  gap?: number;
  wave?: number;
  fadeEdges?: number;
  shadow?: number;
  grayscale?: boolean;
  showTitles?: boolean;
  snap?: boolean;
  autoScroll?: number;
  openOnClick?: boolean;
  intro?: boolean;
  dpr?: number;
  class?: string;
}

export interface GallerySettings {
  items: GalleryItem[];
  bend: number;
  textColor: string;
  borderRadius: number;
  scrollSpeed: number;
  scrollEase: number;
  itemSize: number;
  itemAspect: number;
  gap: number;
  wave: number;
  fadeEdges: number;
  shadow: number;
  grayscale: boolean;
  showTitles: boolean;
  snap: boolean;
  autoScroll: number;
  openOnClick: boolean;
  intro: boolean;
  dpr?: number;
}

export interface TextureEntry {
  texture: WebGLTexture | null;
  aspect: number;
  ready: number;
  loaded: boolean;
}

export interface GalleryPoint {
  x: number;
  y: number;
}

export interface GalleryFrame {
  width: number;
  height: number;
  y: number;
  titleSpace: number;
}

export interface GalleryCard {
  slot: number;
  index: number;
  item: GalleryItem;
  entry: TextureEntry;
  x: number;
  y: number;
  angle: number;
  w: number;
  h: number;
  radius: number;
  alpha: number;
  dim: number;
  gray: number;
  focus: number;
  labelAlpha: number;
  labelSize: number;
  frame: GalleryFrame;
}

export interface GalleryMetrics {
  w: number;
  h: number;
  spacing: number;
  openH: number;
  openY: number;
  titleSpace: number;
}

export interface GalleryDrag {
  id: number;
  x0: number;
  y0: number;
  start: number;
  moved: boolean;
  samples: { x: number; t: number }[];
  p: GalleryPoint;
}

export interface GalleryState {
  scroll: number;
  target: number;
  velocity: number;
  open: number;
  openTarget: number;
  intro: number;
  waveTime: number;
  ring: number;
  keyboard: boolean;
  hovered: number | null;
  hover: Map<number, number>;
  focus: Map<number, number>;
  drag: GalleryDrag | null;
  lastInput: number;
  active: number;
  spacing: number;
}

export interface LabelSlot {
  el: HTMLSpanElement;
  slot: number | null;
  font: string;
  text: string;
}

export interface GalleryProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface GalleryEngineOptions {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  labelLayer: HTMLDivElement;
  caption: HTMLDivElement;
  reduce: boolean;
  getSettings: () => GallerySettings;
  getFont: () => string;
  focusButton: (index: number) => void;
  onActive: (index: number) => void;
  onOpen: (open: boolean) => void;
  onItemClick: (item: GalleryItem, index: number) => void;
}

export interface GalleryEngine {
  wake: () => void;
  open: (index: number) => void;
  focus: (index: number) => void;
  close: () => void;
  resize: () => void;
  setVisible: (visible: boolean) => void;
  onVisibility: () => void;
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: (event: PointerEvent) => void;
  onPointerCancel: (event: PointerEvent) => void;
  onPointerLeave: () => void;
  onWheel: (event: WheelEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onFocusIn: (event: FocusEvent) => void;
  onFocusOut: (event: FocusEvent) => void;
  onAnyKey: (event: KeyboardEvent) => void;
  onAnyPointer: () => void;
  destroy: () => void;
}
