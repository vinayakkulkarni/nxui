export interface MenuItem {
  image: string;
  link?: string;
  title?: string;
  description?: string;
}

export type InfiniteMenuTheme = 'dark' | 'light';

export type InfiniteMenuLayout = 'side' | 'stacked';

export interface InfiniteMenuProps {
  items?: MenuItem[];
  count?: number;
  tileSize?: number;
  roundness?: number;
  zoom?: number;
  pullBack?: number;
  stretch?: number;
  inertia?: number;
  autoplay?: number;
  grayscale?: boolean;
  dim?: number;
  intro?: boolean;
  showInfo?: boolean;
  theme?: InfiniteMenuTheme;
  accentColor?: string;
  backgroundColor?: string;
  onItemClick?: (item: MenuItem, index: number) => void;
  class?: string;
}

export interface InfiniteMenuSlotProps {
  item: MenuItem;
  index: number;
  moving: boolean;
}

export interface InfiniteMenuSettings {
  count: number;
  tileSize: number;
  roundness: number;
  zoom: number;
  pullBack: number;
  stretch: number;
  inertia: number;
  autoplay: number;
  grayscale: boolean;
  dim: number;
  intro: boolean;
  theme: InfiniteMenuTheme;
  reduce: boolean;
}

export interface InfiniteMenuCallbacks {
  onActive: (index: number) => void;
  onMoving: (moving: boolean) => void;
  onLayout: (layout: InfiniteMenuLayout) => void;
  onActivate: (tile: number) => void;
}

export interface InfiniteMenuEngine {
  loadItems: (items: MenuItem[]) => void;
  wake: () => void;
  resize: () => void;
  setVisible: (visible: boolean) => void;
  setHovered: (hovered: boolean) => void;
  setFocused: (focused: boolean) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  step: (direction: Vec2) => void;
  itemForTile: (tile: number) => number;
  frontTile: () => number;
  destroy: () => void;
}

export interface InfiniteMenuState {
  width: number;
  height: number;
  tiles: Vec3[];
  assign: number[];
  count: number;
  orientation: Quat;
  axis: Vec3;
  speed: number;
  camera: number;
  target: number;
  front: number;
  moving: boolean;
  reveal: number;
  hovered: boolean;
  focused: boolean;
  idle: number;
  settle: number;
  tilePx: number;
  layout: InfiniteMenuLayout;
  shift: number;
  started: boolean;
}

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];

export interface InfiniteMenuSlots {
  info?: (props: InfiniteMenuSlotProps) => unknown;
}

export interface InfiniteMenuEmits {
  'active-change': [item: MenuItem, index: number];
}
