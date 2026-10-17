import type { HTMLAttributes } from 'vue';

export interface PixelImageTrailProps {
  /** Image revealed by the pixel trail. */
  src: string;
  /** Accessible description for the image. */
  alt: string;
  /** Width and height of each square in pixels. */
  pixelSize?: number;
  /** Maximum distance for an occasional satellite pixel. */
  radius?: number;
  /** Time in milliseconds before a square completely fades. */
  fadeDuration?: number;
  /** Maximum number of squares kept in the trail. */
  maxPixels?: number;
  /** Number of image fragments visible before the first interaction. */
  initialPixels?: number;
  /** Additional classes for size, surface and shape. */
  class?: HTMLAttributes['class'];
}

export interface PixelImageTrailPixel {
  column: number;
  row: number;
  touchedAt: number;
  ambient: boolean;
}
