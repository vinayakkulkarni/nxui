export interface ImageTrailConfig {
  /** How far the cursor travels, in px, before the next image appears. */
  threshold: number;
  /** Seconds an image stays before it fades out. */
  lifetime: number;
  /** Size an image starts at as it appears. 0 grows it from nothing. */
  appearScale: number;
  /** How far each photo starts zoomed in before settling in its frame. 1 turns it off. */
  zoom: number;
  /** Brightness flash as an image appears, from 0 to 1. */
  flash: number;
  /** Size an image shrinks or grows to while it fades out. 1 keeps its size. */
  exitScale: number;
  /** How far images keep flying in the direction of the cursor as they fade, from 0 to 1. */
  drift: number;
  /** Random tilt of each image, in degrees. */
  rotation: number;
  /** Random size variation between images, from 0 to 1. */
  sizeVariance: number;
  /** Turns each image to face the direction the cursor is moving. */
  alignToMotion: boolean;
  /** Keeps this many of the newest images on screen in a pile. 0 turns it off. */
  stack: number;
  /** Tilts images in 3D toward the edge where they appear, in degrees. */
  tilt: number;
}

export interface ImageTrailProps extends Partial<ImageTrailConfig> {
  /** Image URLs shown in the trail, in order. */
  items?: string[];
  /** Width of each image in px, or any CSS length. */
  size?: number | string;
  /** Width divided by height for each image. */
  aspectRatio?: number;
  /** Corner radius of the images, in px or any CSS length. */
  radius?: number | string;
  /** Extra classes for the container. */
  class?: string;
}

export type TrailEase = (t: number) => number;

export type TrailState = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  rotationX: number;
  rotationY: number;
  opacity: number;
  zIndex: number;
};

export type TrailInnerState = {
  scale: number;
  brightness: number;
};

export type TrailTarget = Record<string, number>;

export interface TrailTween {
  target: TrailTarget;
  owner: TrailImage;
  /** Explicit start values; missing keys are read when the tween starts. */
  from: TrailTarget;
  /** End values, or deltas when `relative` is set. */
  to: TrailTarget;
  relative: boolean;
  start: number;
  duration: number;
  ease: TrailEase;
  began: boolean;
  onComplete?: () => void;
}

export interface TrailTweenSpec {
  from?: TrailTarget;
  to: TrailTarget;
  relative?: boolean;
  /** Start offset in seconds from now. */
  at: number;
  duration: number;
  ease: TrailEase;
  onComplete?: () => void;
}

export interface TrailGroup {
  end: number;
  done: () => void;
}

export interface TrailImage {
  el: HTMLElement;
  inner: HTMLElement;
  state: TrailState;
  innerState: TrailInnerState;
}
