export interface MenuItem {
  label: string;
  link: string;
  ariaLabel?: string;
}

export interface SocialItem {
  label: string;
  link: string;
}

export type StaggeredMenuPosition = 'left' | 'right';

export interface StaggeredMenuProps {
  position?: StaggeredMenuPosition;
  /** Underlay layer colors (up to 4; with 3+ the middle one is dropped). */
  colors?: string[];
  items?: MenuItem[];
  socialItems?: SocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  /** Logo image. Use the `logo` slot for custom markup. */
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  isFixed?: boolean;
  closeOnClickAway?: boolean;
  class?: string;
}

export type StaggeredMenuEase = [number, number, number, number];
