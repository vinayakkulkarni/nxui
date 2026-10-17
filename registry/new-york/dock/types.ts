export type DockSide = 'bottom' | 'top' | 'left' | 'right';

export type DockTheme = 'dark' | 'light';

export interface DockMenuItem {
  /** Row text. */
  label?: string;
  onClick?: () => void;
  /** Iconify name, e.g. `lucide:app-window`. */
  icon?: string;
  /** Shows a check column; `true` draws the check mark. */
  checked?: boolean;
  disabled?: boolean;
  /** Hint text shown at the end of the row, e.g. `⌘N`. */
  shortcut?: string;
  /** Rows of a submenu. */
  items?: DockMenuItem[];
  separator?: boolean;
}

export interface DockItemData {
  /** Iconify name, e.g. `lucide:house`. Use the `icon` slot for custom content. */
  icon?: string;
  label?: string;
  onClick?: () => void;
  class?: string;
  /** Marks an open app with a dot. */
  active?: boolean;
  /** A number or text badge, or `true` for a plain dot. */
  badge?: number | string | boolean;
  /** Rows of the context menu. */
  menu?: DockMenuItem[];
  /** Renders a divider instead of an icon. */
  separator?: boolean;
}

export interface DockSpring {
  mass?: number;
  stiffness?: number;
  damping?: number;
}

export interface DockProps {
  items?: DockItemData[];
  position?: DockSide;
  theme?: DockTheme;
  baseItemSize?: number;
  magnification?: number;
  distance?: number;
  panelHeight?: number;
  gap?: number;
  roundness?: number;
  spring?: DockSpring;
  bounce?: boolean;
  autoHide?: boolean;
  tiles?: boolean;
  showLabels?: boolean;
  showIndicators?: boolean;
  showBadges?: boolean;
  badgeColor?: string;
  accentColor?: string;
  class?: string;
}

export type DockTokens = Record<string, string>;

export interface DockPoint {
  x: number;
  y: number;
}

export interface DockEdge {
  left: number;
  right: number;
  top: number;
}

export interface DockFrame {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface DockSubMenu {
  index: number;
  keyboard: boolean;
  edge: DockEdge;
}

export interface DockMenuState {
  id: number;
  index: number;
  point: DockPoint;
  keyboard: boolean;
  closing: boolean;
  restore: boolean;
  rows?: DockMenuItem[];
}

export interface DockMenuProps {
  rows: DockMenuItem[];
  label?: string;
  side?: DockSide | null;
  point?: DockPoint;
  edge?: DockEdge;
  tokens: DockTokens;
  nested?: boolean;
  focusFirst?: boolean;
  closing?: boolean;
  /** True while a long press that opened the menu is still held. */
  pressing?: boolean;
}

export interface DockMotion {
  size: number;
  velocity: number;
  lift: number;
  rise: number;
  launch: number;
  gravity: number;
  hopping: boolean;
  drawn: string;
  node: HTMLButtonElement | null;
}

export interface DockPress {
  id: number;
  x: number;
  y: number;
  timer: number;
  cleanup: () => void;
}

export type DockOpenMode = 'pointer' | 'keyboard' | 'press';
