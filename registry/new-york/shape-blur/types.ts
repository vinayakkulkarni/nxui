export type ShapeBlurShape = 'rect' | 'circle' | 'polygon' | 'star';

export interface ShapeBlurProps {
  /** Shape to draw. A rectangle follows the container so it works as a frame. */
  shape?: ShapeBlurShape;
  /** URL of an SVG or transparent PNG to use as the shape instead. Its silhouette is traced. */
  src?: string;
  /** Sides of the polygon or points of the star. */
  sides?: number;
  /** How much of the container the shape fills, from 0 to 1. */
  size?: number;
  /** Rounds the corners, from 0 to 1. */
  roundness?: number;
  /** Line width in pixels. */
  thickness?: number;
  /** Fills the shape instead of drawing its outline. */
  fill?: boolean;
  /** Number of lines. Outlines nest inward and filled shapes ripple outward. */
  echoes?: number;
  /** Distance between echoes in pixels. */
  spacing?: number;
  /** Line color, any CSS color. Dark colors are drawn for light backgrounds. */
  color?: string;
  /** How far out of focus the lens pushes the shape, in pixels. */
  blur?: number;
  /** Radius of the lens around the pointer, relative to the shorter side of the container. */
  lensSize?: number;
  /** How gradually the blur fades toward the edge of the lens, from 0 to 1. */
  lensSoftness?: number;
  /** Inverts the lens: the shape stays blurred and the pointer brings it into focus. */
  focus?: boolean;
  /** Color fringing in the blurred parts, from 0 to 1. */
  chroma?: number;
  /** Rotation of the shape in degrees. */
  rotation?: number;
  /** Rotation speed in degrees per second. */
  spin?: number;
  /** Lets the lens drift on its own while the pointer is away. */
  idle?: boolean;
  class?: string;
}

export interface ShapeBlurSettings {
  shape: number;
  src: string;
  sides: number;
  size: number;
  roundness: number;
  thickness: number;
  fill: boolean;
  echoes: number;
  spacing: number;
  color: string;
  blur: number;
  lensSize: number;
  lensSoftness: number;
  focus: boolean;
  chroma: number;
  rotation: number;
  spin: number;
  idle: boolean;
}

export interface ShapeBlurRenderer {
  load: (src: string) => void;
  wake: () => void;
  resize: () => void;
  setVisible: (visible: boolean) => void;
  setReduced: (reduced: boolean) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerLeave: () => void;
  destroy: () => void;
}
