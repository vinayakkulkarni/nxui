export interface ScrollTiltedGridImage {
  src: string;
  alt: string;
}

export interface ScrollTiltedGridProps {
  /** Images to render. Each item needs a src and descriptive alt text. */
  images: readonly ScrollTiltedGridImage[];
  /** Append more image cycles as the end of the gallery comes near. */
  loop?: boolean;
  /** Cycles rendered at first when `loop` is on. */
  initialCycles?: number;
  /** Most cycles the gallery will grow to. */
  maxCycles?: number;
  /** Ease wheel scrolling (Lenis-style lerp) on the scroll target. */
  smoothScroll?: boolean;
  /** CSS aspect ratio of every frame. */
  aspectRatio?: string;
  /** Perspective depth in pixels for every frame. */
  perspective?: number;
  /** Largest rotateX angle at the entry and exit edges. */
  maxTilt?: number;
  /** Largest blur in pixels away from the viewport focus point. */
  maxBlur?: number;
  /** CSS border radius of every frame. */
  rounded?: string;
  /** Top and bottom padding around the grid. */
  sectionPadding?: string;
  /** Scrolling element to track. Omit to track the window. */
  scrollContainer?: HTMLElement | null;
  class?: string;
}

export interface ScrollTiltedGridTile {
  key: string;
  image: ScrollTiltedGridImage;
  index: number;
  side: -1 | 1;
}

export interface ScrollTiltedGridViewport {
  top: number;
  height: number;
}

export interface SmoothWheelOptions {
  lerp: number;
  wheelMultiplier: number;
}
