/**
 * Props for the SilkAurora registry component.
 */
export interface SilkAuroraProps {
  /** Headline rendered over the aurora. */
  title?: string;
  /** Small uppercase kicker above the title. */
  subtitle?: string;
  /** Supporting paragraph below the title. */
  description?: string;
  /** Deep background color (hex). */
  baseColor?: string;
  /** Upper-atmosphere blend color (hex). */
  midColor?: string;
  /** Pearlescent sheen color (hex). */
  sheenColor?: string;
  /** Aurora ribbon accent color (hex). */
  accentColor?: string;
  /** Animation speed multiplier. */
  speed?: number;
  /** Ribbon/sheen intensity multiplier. */
  intensity?: number;
  /** Film grain amount (0–1). */
  grain?: number;
  /** Vignette strength (0–1). */
  vignette?: number;
  /** Cursor depth influence multiplier. */
  mouseInfluence?: number;
  /** React to pointer movement. */
  interactive?: boolean;
  /** Additional classes on the root element. */
  class?: string;
}
