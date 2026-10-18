import type { Texture } from 'ogl';

export type FlexCarouselPreset = 'liquid' | 'ribbon' | 'vortex' | 'arch';
export type FlexCarouselCurl = 'twist' | 'rise' | 'fall';
export type FlexCarouselIntro = 'rise' | 'bloom' | 'spin' | 'deal' | 'none';
export type FlexCarouselFit = 'natural' | 'portrait' | 'square' | 'landscape';

export interface FlexCarouselItem {
  /** Image URL. Remote hosts must send CORS headers. */
  src: string;
  /** Text announced to screen readers. */
  alt?: string;
  /** Caption shown under the row while the card is centered. */
  title?: string;
  /** Second caption line. */
  subtitle?: string;
}

/** Lens values every preset defines. Each one can be overridden by a prop. */
export interface FlexCarouselLensValues {
  lensWidth: number;
  lensHeight: number;
  tilt: number;
  roundness: number;
  bend: number;
  reach: number;
  curl: FlexCarouselCurl;
  dispersion: number;
  liquid: number;
  followCursor: boolean;
}

export interface FlexCarouselProps {
  items?: FlexCarouselItem[];
  preset?: FlexCarouselPreset;
  intro?: FlexCarouselIntro;
  cardHeight?: number;
  gap?: number;
  radius?: number;
  fit?: FlexCarouselFit;
  lensWidth?: number;
  lensHeight?: number;
  tilt?: number;
  roundness?: number;
  bend?: number;
  reach?: number;
  curl?: FlexCarouselCurl;
  dispersion?: number;
  liquid?: number;
  followCursor?: boolean;
  squeeze?: number;
  focusOnClick?: boolean;
  autoplay?: boolean;
  interval?: number;
  captions?: boolean;
  captureWheel?: boolean;
  class?: string;
}

export interface FlexCarouselSettings extends FlexCarouselLensValues {
  intro: FlexCarouselIntro;
  cardHeight: number;
  gap: number;
  radius: number;
  fit: FlexCarouselFit;
  squeeze: number;
  focusOnClick: boolean;
  autoplay: boolean;
  interval: number;
  captureWheel: boolean;
}

export interface FlexCarouselHooks {
  getSettings: () => FlexCarouselSettings;
  getItems: () => FlexCarouselItem[];
  onActive: (index: number) => void;
  onReveal: () => void;
  onFocusOpen: (open: boolean) => void;
  onSelect: (index: number) => void;
}

export interface FlexCarouselEngine {
  wake: () => void;
  setItems: (items: FlexCarouselItem[]) => void;
  destroy: () => void;
}

export interface FlexCarouselSlot {
  item: FlexCarouselItem;
  index: number;
  texture: Texture;
  aspect: number;
  loaded: boolean;
  failed: boolean;
  ready: number;
  color: number[];
  image: number[];
  dispose: () => void;
}

export interface FlexCarouselMetrics {
  cardH: number;
  widths: number[];
  centers: number[];
  gap: number;
  loop: number;
}

export interface FlexCarouselInstance {
  index: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface FlexCarouselCardEffect {
  alpha: number;
  x: number;
  y: number;
  scale: number;
}

export interface FlexCarouselIntroEffects {
  sceneAlpha: number;
  strength: number;
  card: ((rel: number) => FlexCarouselCardEffect) | null;
}

export interface FlexCarouselDraw {
  i: number;
  rel: number;
  x: number;
  y: number;
  cw: number;
  ch: number;
  alpha: number;
}
