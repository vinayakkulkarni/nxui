export interface ChromaGridItem {
  image: string;
  title?: string;
  subtitle?: string;
  /** Accent for the glow and the lit border. */
  accent?: string;
  /** Fallback accent, kept for older item data. */
  borderColor?: string;
  /** Alt text for the image. Falls back to the title. */
  alt?: string;
  /** Makes the whole card a link (opens in a new tab). */
  url?: string;
}

export type ChromaGridReveal = 'spotlight' | 'card';
export type ChromaGridTheme = 'dark' | 'light';

export interface ChromaGridProps {
  items?: ChromaGridItem[];
  /** The most columns the grid shows. */
  columns?: number;
  /** Narrowest a card can get, in px. */
  minCardWidth?: number;
  /** Space between cards, in px. */
  gap?: number;
  /** Size of the color spotlight, in px. */
  radius?: number;
  /** Spotlight edge softness, 0 crisp – 1 soft. */
  softness?: number;
  /** How smoothly the spotlight trails the cursor. 0 follows exactly. */
  damping?: number;
  /** Seconds for colors to fade back after the cursor leaves. */
  fadeOut?: number;
  grayscale?: number;
  dim?: number;
  glow?: number;
  borderGlow?: number;
  reveal?: ChromaGridReveal;
  /** CSS aspect-ratio value for the images. */
  aspectRatio?: string;
  cardRadius?: number;
  showInfo?: boolean;
  frame?: boolean;
  theme?: ChromaGridTheme;
  class?: string;
}
