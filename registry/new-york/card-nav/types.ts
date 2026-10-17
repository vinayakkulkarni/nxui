import type { Component } from 'vue';

export type CardNavTheme = 'dark' | 'light';
export type CardNavSurface = 'glass' | 'solid';
export type CardNavOpenOn = 'click' | 'hover';
export type CardNavCardEffect = 'rise' | 'unfold' | 'fade';

export interface CardNavLink {
  label: string;
  /** Links without an href render as buttons. */
  href?: string;
  ariaLabel?: string;
}

export interface CardNavItem {
  label: string;
  description?: string;
  /** Tints the card. */
  bgColor?: string;
  textColor?: string;
  links?: CardNavLink[];
}

export interface CardNavCta {
  label: string;
  href?: string;
  onClick?: (event: MouseEvent) => void;
}

export interface CardNavProps {
  /** Image URL shown in the middle of the bar. Use the `logo` slot for markup. */
  logo?: string;
  logoAlt?: string;
  logoHref?: string;
  items?: CardNavItem[];
  cta?: CardNavCta;
  theme?: CardNavTheme;
  surface?: CardNavSurface;
  openOn?: CardNavOpenOn;
  cardEffect?: CardNavCardEffect;
  stagger?: number;
  bounce?: number;
  speed?: number;
  cardHeight?: number;
  maxWidth?: number;
  accentColor?: string;
  menuLabel?: boolean;
  intro?: boolean;
  defaultOpen?: boolean;
  /** Controlled open state. Pair with `update:open`. */
  open?: boolean;
  /** Renders the links, e.g. `NuxtLink` or `RouterLink`. */
  linkComponent?: string | Component;
  ariaLabel?: string;
  class?: string;
}
