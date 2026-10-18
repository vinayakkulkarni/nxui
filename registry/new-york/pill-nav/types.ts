import type { Component } from 'vue';

export type PillNavTheme = 'dark' | 'light';
export type PillNavLayout = 'split' | 'joined';
export type PillNavSize = 'sm' | 'md' | 'lg';
export type PillNavSurface = 'glass' | 'solid' | 'none';
export type PillNavItemStyle = 'pill' | 'plain';
export type PillNavHoverEffect = 'fill' | 'glide' | 'none';
export type PillNavIndicator = 'dot' | 'pill' | 'none';
export type PillNavCollapse = 'auto' | 'always' | 'never';

export interface PillNavItem {
  label: string;
  /** Items without an href render as buttons. */
  href?: string;
  /** Iconify name, e.g. `lucide:house`. */
  icon?: string;
  ariaLabel?: string;
}

export interface PillNavProps {
  /** Image URL for the round logo button. Use the `logo` slot for custom markup. */
  logo?: string;
  logoAlt?: string;
  logoHref?: string;
  items?: PillNavItem[];
  activeHref?: string;
  defaultActiveIndex?: number;
  /** Renders the links (e.g. `NuxtLink`). Receives href, class and children. */
  linkComponent?: string | Component;
  theme?: PillNavTheme;
  layout?: PillNavLayout;
  size?: PillNavSize;
  surface?: PillNavSurface;
  itemStyle?: PillNavItemStyle;
  hoverEffect?: PillNavHoverEffect;
  indicator?: PillNavIndicator;
  highlightColor?: string;
  highlightTextColor?: string;
  barColor?: string;
  textColor?: string;
  bounce?: number;
  stretch?: number;
  intro?: boolean;
  collapse?: PillNavCollapse;
  ariaLabel?: string;
  class?: string;
}

export type PillNavVars = Record<string, string>;

export interface PillNavVarInput {
  theme: PillNavTheme;
  size: PillNavSize;
  surface: PillNavSurface;
  barColor?: string;
  textColor?: string;
  highlightColor?: string;
  highlightTextColor?: string;
}

export interface PillNavRect {
  left: number;
  width: number;
}

export interface PillNavEngineSettings {
  hoverEffect: PillNavHoverEffect;
  indicator: PillNavIndicator;
  activeIndex: number;
  bounce: number;
  stretch: number;
}

export interface PillNavEngineOptions {
  root: HTMLElement;
  getTrack: () => HTMLElement | null;
  getGlide: () => HTMLElement | null;
  getInk: () => HTMLElement | null;
  getDot: () => HTMLElement | null;
  getSlots: () => (HTMLElement | null)[];
  getSettings: () => PillNavEngineSettings;
  reduce: boolean;
  waiting: boolean;
}

export interface PillNavEngine {
  enter: (index: number, event?: PointerEvent) => void;
  leave: () => void;
  focus: (index: number, event?: FocusEvent) => void;
  blur: () => void;
  press: (event?: PointerEvent) => void;
  release: () => void;
  refresh: () => void;
  destroy: () => void;
}
