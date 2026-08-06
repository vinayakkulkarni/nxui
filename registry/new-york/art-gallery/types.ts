export interface Artwork {
  /** Painting title. */
  title: string;
  /** Poetic one-liner shown under the title. */
  caption: string;
  /** Image URL. */
  image: string;
}

export interface ArtGalleryProps {
  artworks?: Artwork[];
  /** Seconds before the featured artwork auto-advances; 0 disables. */
  autoplayInterval?: number;
  class?: string;
}
