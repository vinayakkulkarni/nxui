export type MagicBentoVisual =
  | 'analytics'
  | 'dashboard'
  | 'collaboration'
  | 'automation'
  | 'integration'
  | 'security';

export type MagicBentoTheme = 'dark' | 'light';

export interface MagicBentoItem {
  /** Stable key for the card. */
  id?: string | number;
  /** Small caption shown next to the icon at the top of the card. */
  label?: string;
  title?: string;
  description?: string;
  /** Iconify icon name, e.g. `lucide:chart-line`. */
  icon?: string;
  /** Photo that fills the card. */
  image?: string;
  /**
   * Artwork between the header and the text: a built-in visual name, or the
   * name of a slot you pass to MagicBento (scoped with `{ item, index }`).
   */
  visual?: MagicBentoVisual | string;
  /** Name of a slot that replaces the whole inside of the card. */
  content?: string;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (event: MouseEvent) => void;
  colSpan?: number;
  rowSpan?: number;
}

export interface MagicBentoProps {
  items?: MagicBentoItem[];
  columns?: number;
  rowHeight?: number;
  gap?: number;
  radius?: number;
  theme?: MagicBentoTheme;
  /** Hex (`#38bdf8`) or `r, g, b`. Defaults to the theme text color. */
  glowColor?: string;
  textAutoHide?: boolean;
  enableBorderGlow?: boolean;
  enableSpotlight?: boolean;
  spotlightRadius?: number;
  enableStars?: boolean;
  particleCount?: number;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  intro?: boolean;
  disableAnimations?: boolean;
  /** Bound with `@item-click`. Makes every card a focusable button. */
  onItemClick?: (item: MagicBentoItem, index: number) => void;
  class?: string;
}

export type MagicBentoRgb = [number, number, number];

export interface MagicBentoSettings {
  columns: number;
  gap: number;
  enableBorderGlow: boolean;
  enableSpotlight: boolean;
  spotlightRadius: number;
  enableStars: boolean;
  particleCount: number;
  enableTilt: boolean;
  enableMagnetism: boolean;
  clickEffect: boolean;
  intro: boolean;
  disableAnimations: boolean;
  glow: MagicBentoRgb;
}

export interface MagicBentoParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  rate: number;
}

export interface MagicBentoCardState {
  hot: number;
  rx: number;
  ry: number;
  tx: number;
  ty: number;
  vrx: number;
  vry: number;
  vtx: number;
  vty: number;
  press: number;
  vpress: number;
  stars: number;
  drawn: boolean;
  particles: MagicBentoParticle[] | null;
  active: boolean;
  written: Record<string, string>;
}

export type MagicBentoPoint = [number, number];

export interface MagicBentoCurve {
  line: string;
  area: string;
  samples: MagicBentoPoint[];
}

export interface MagicBentoApp {
  icon: string;
  x: number;
  y: number;
}

export interface MagicBentoStep {
  label: string;
  time: string;
}

export interface MagicBentoToggle {
  icon: string;
  label: string;
}
