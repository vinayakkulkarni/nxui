export interface ArtGalleryPanel {
  /** 'image' = full-bleed painting; 'lines' = big melting list; 'paragraph' = melting prose. */
  type: 'image' | 'lines' | 'paragraph';
  /** Image URL (type 'image'). */
  src?: string;
  /** Alt text (type 'image'). */
  alt?: string;
  /** Lines of display text (type 'lines'). */
  lines?: string[];
  /** Prose text (type 'paragraph'). */
  text?: string;
}

export interface ArtGalleryProps {
  panels?: ArtGalleryPanel[];
  class?: string;
}
