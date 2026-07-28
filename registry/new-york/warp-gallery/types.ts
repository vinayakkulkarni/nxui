export interface WarpGalleryItem {
  /** Image URL shown on the card. */
  image: string;
  /** Item title shown above the strip when settled. */
  title: string;
  /** Optional subtitle line under the title. */
  subtitle?: string;
}

export interface WarpGalleryProps {
  /** Gallery items — the strip wraps around infinitely. */
  items?: WarpGalleryItem[];
  /** Rest curl of off-center cards (0 = flat strip). */
  bend?: number;
  /** Chromatic-aberration strength for the prismatic edge fringes. */
  aberration?: number;
  /** Scroll speed multiplier for wheel and drag. */
  speed?: number;
  /** Hide the title / subtitle / counter overlay. */
  hideOverlay?: boolean;
  class?: string;
}
