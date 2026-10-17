export interface AnimatedListEntry {
  id?: string | number;
  /** Iconify name, e.g. `lucide:folder`. */
  icon?: string;
  /** Image URL shown as a thumbnail; wins over `icon`. */
  image?: string;
  title: string;
  description?: string;
  /** Short label on the right, e.g. a time or shortcut. */
  meta?: string;
}

export type AnimatedListItem = string | AnimatedListEntry;

export type AnimatedListAnimation = 'pop' | 'slide' | 'fade' | 'none';

export type AnimatedListTheme = 'dark' | 'light';

export type AnimatedListState = 'in' | 'above' | 'below';

export interface AnimatedListProps {
  items?: AnimatedListItem[];
  initialSelectedIndex?: number;
  selectOnHover?: boolean;
  enableArrowNavigation?: boolean;
  loop?: boolean;
  animation?: AnimatedListAnimation;
  animateOnce?: boolean;
  stagger?: number;
  showGradients?: boolean;
  fadeSize?: number;
  displayScrollbar?: boolean;
  frame?: boolean;
  theme?: AnimatedListTheme;
  accentColor?: string;
  radius?: number;
  gap?: number;
  width?: number | string;
  maxHeight?: number | string;
  class?: string;
  itemClass?: string;
}

export interface AnimatedListEngine {
  place: (snap: boolean) => void;
  syncRing: () => void;
  updateFades: () => void;
  sync: () => void;
  enter: () => void;
  resize: () => void;
  scroll: () => void;
  dispose: () => void;
}
