export interface GalleryImage {
  src: string;
  alt?: string;
}

export interface TileItem {
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
  src: string;
  alt: string;
}

export type DomeGalleryFitBasis = 'auto' | 'min' | 'max' | 'width' | 'height';

export interface DomeGalleryProps {
  images?: (string | GalleryImage)[];
  fit?: number;
  fitBasis?: DomeGalleryFitBasis;
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  enlargeTransitionMs?: number;
  segments?: number;
  dragDampening?: number;
  openedImageWidth?: string;
  openedImageHeight?: string;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  grayscale?: boolean;
  class?: string;
}

export interface DomeGalleryRotation {
  x: number;
  y: number;
}

export interface DomeGalleryRect {
  left: number;
  top: number;
  width: number;
  height: number;
}
