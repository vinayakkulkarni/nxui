import type { Mesh, PlaneGeometry, ShaderMaterial } from 'three';

export interface Spiral3dSlide {
  /** Image source rendered inside the slide. */
  src: string;
  /** Accessible description for the image. */
  alt: string;
}

export interface Spiral3dSliderProps {
  /** Images arranged along the spiral. */
  items: Spiral3dSlide[];
  /** Maximum horizontal radius of the spiral in pixels. */
  radius?: number;
  /** Vertical distance between neighboring images in pixels. */
  verticalGap?: number;
  /** Maximum width of every image plane in pixels. */
  cardWidth?: number;
  /** Width divided by height for every image plane. */
  cardAspectRatio?: number;
  /** Whether the spiral advances automatically while idle. */
  autoRotate?: boolean;
  /** Automatic movement in slides per second. */
  autoSpeed?: number;
  /** Amount of scroll required to move along the spiral. */
  scrollSensitivity?: number;
  /** Motion smoothing between 0 and 1. */
  smoothing?: number;
  /** Maximum blur applied to distant images. */
  blurStrength?: number;
  /** Amount each image plane bends into the spiral. */
  bend?: number;
  /** Perspective camera field of view in degrees. */
  fov?: number;
  /** Accessible name for the gallery region. */
  ariaLabel?: string;
  /** Additional classes for the WebGL stage. */
  class?: string;
}

export type Spiral3dPlane = Mesh<PlaneGeometry, ShaderMaterial>;
