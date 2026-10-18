import type { CSSProperties } from 'vue';

export interface WheelCarouselItem {
  label: string;
  image: string;
  imageAlt?: string;
}

export type WheelCarouselMode = 'system' | 'light' | 'dark' | 'custom';

export type WheelCarouselPhotoSide = 'left' | 'right';

export type WheelCarouselPhotoAspect = '3/4' | '1/1' | '4/3' | '3/2';

export interface WheelCarouselPalette {
  background: string;
  text: string;
  selected: string;
  marker: string;
  panel: string;
}

/** A positioned label on the wheel, derived per frame from the rotation. */
export interface WheelCarouselLabel {
  key: string;
  index: number;
  label: string;
  selected: boolean;
  style: CSSProperties;
}

export interface WheelCarouselProps {
  items?: WheelCarouselItem[];
  mode?: WheelCarouselMode;
  photoSide?: WheelCarouselPhotoSide;
  photoWidth?: number;
  photoAspect?: WheelCarouselPhotoAspect;
  contentWidth?: number;
  gap?: number;
  photoRadius?: number;
  crossfadeDuration?: number;
  radius?: number;
  spacing?: number;
  visibleItems?: number;
  apexInset?: number;
  textColor?: string;
  selectedColor?: string;
  showMarker?: boolean;
  markerColor?: string;
  markerSize?: number;
  markerGap?: number;
  background?: string;
  panelColor?: string;
  scrollSpeed?: number;
  dragSpeed?: number;
  snap?: boolean;
  momentum?: boolean;
  appear?: boolean;
  edgeFade?: boolean;
  edgeFadeSize?: number;
  initialIndex?: number;
  activeIndex?: number;
  class?: string;
  photoClass?: string;
  itemClass?: string;
}
