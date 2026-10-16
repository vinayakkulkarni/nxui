export type LogoLoopDirection = 'left' | 'right' | 'up' | 'down';

export type LogoLoopLayout = 'line' | 'wave' | 'arc' | 'orbit';

export type LogoLoopLabels = 'none' | 'inline' | 'below' | 'hover';

interface LogoItemBase {
  /** Link opened in a new tab when the logo is clicked. */
  href?: string;
  /** Logo name, used for labels and as the accessible name fallback. */
  title?: string;
  /** Brand color the logo takes on while hovered or centered. */
  hoverColor?: string;
}

export interface LogoIconItem extends LogoItemBase {
  /** Iconify icon name rendered with `<Icon>`, e.g. `simple-icons:vuedotjs`. */
  icon: string;
  /** Accessible name for the icon. Falls back to `title`. */
  ariaLabel?: string;
}

export interface LogoImageItem extends LogoItemBase {
  src: string;
  alt?: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

export type LogoItem = LogoIconItem | LogoImageItem;

export interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  direction?: LogoLoopDirection;
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutWidth?: number;
  scaleOnHover?: boolean;
  layout?: LogoLoopLayout;
  bend?: number;
  focus?: number;
  magnify?: number;
  tiltX?: number;
  tiltY?: number;
  step?: boolean;
  muted?: number;
  labels?: LogoLoopLabels;
  draggable?: boolean;
  scrollBoost?: number;
  intro?: boolean;
  ariaLabel?: string;
  class?: string;
}

export interface LogoLoopItemSlotProps {
  item: LogoItem;
  index: number;
  copy: number;
}

export interface LogoLoopConfig {
  speed: number;
  dirSign: number;
  hoverValue: number | undefined;
  vertical: boolean;
  layout: LogoLoopLayout;
  bend: number;
  focus: number;
  magnify: number;
  tiltX: number;
  tiltY: number;
  step: boolean;
  draggable: boolean;
  scrollBoost: number;
  intro: boolean;
  scaleOnHover: boolean;
  labels: LogoLoopLabels;
  links: boolean;
}

export interface LogoLoopCopies {
  copies: number;
  primary: number;
}

export interface LogoLoopEngineItem {
  el: HTMLElement;
  copy: number;
  index: number;
  content: HTMLElement | null;
  tip: HTMLElement | null;
  center: number;
  size: number;
  cross: number;
  t: string;
  o: string;
  v: string;
  z: string;
  s: string;
  p: string;
}

export type LogoLoopItemStyleKey = 't' | 'o' | 'v' | 'z' | 's' | 'p';

export type LogoLoopStyleProp =
  | 'transform'
  | 'opacity'
  | 'visibility'
  | 'zIndex';

export type LogoLoopMatrix = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface LogoLoopGeometry {
  mode: LogoLoopLayout;
  shift: number;
  uMin: number;
  uMax: number;
  lead: number;
  focus: number;
  focusSigma: number;
  magnify: number;
  magSigma: number;
  amp: number;
  k: number;
  R: number;
  sign: number;
  limit: number;
  C: number;
  alpha: number;
  depth: number;
  pf: number;
  tilted: boolean;
  tiltX: number;
  tiltY: number;
  m: LogoLoopMatrix;
  persp: number;
}

export interface LogoLoopDrag {
  id: number;
  x: number;
  y: number;
  active: boolean;
  samples: [number, number][];
  scale: number;
  anchor: number;
  offset: number;
}

export interface LogoLoopTween {
  from: number;
  delta: number;
  t: number;
  dur: number;
}

export interface LogoLoopEngine {
  refresh: () => void;
  resize: () => void;
  wake: () => void;
  destroy: () => void;
  setVisible: (visible: boolean) => void;
  setReduced: (reduced: boolean) => void;
  onEnter: (e: PointerEvent) => void;
  onLeave: () => void;
  onDown: (e: PointerEvent) => void;
  onMove: (e: PointerEvent) => void;
  onUp: (e: PointerEvent) => void;
  onCancel: (e: PointerEvent) => void;
  onClick: (e: MouseEvent) => void;
  onDragStart: (e: DragEvent) => void;
  onFocusIn: (e: FocusEvent) => void;
  onFocusOut: (e: FocusEvent) => void;
  onRootScroll: () => void;
  onWindowScroll: () => void;
}
