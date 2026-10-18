export type PixelTrailShape = 'square' | 'circle' | 'diamond';

export type PixelTrailDecay = 'fade' | 'shrink' | 'dither';

export interface PixelTrailGooeyFilter {
  strength?: number;
}

export interface PixelTrailProps {
  gridSize?: number;
  trailSize?: number;
  maxAge?: number;
  interpolate?: number;
  easingFunction?: (x: number) => number;
  gooeyFilter?: PixelTrailGooeyFilter | false;
  color?: string;
  trailColor?: string;
  shape?: PixelTrailShape;
  gap?: number;
  decay?: PixelTrailDecay;
  flow?: number;
  gravity?: number;
  sparkle?: number;
  clickBurst?: boolean;
  shine?: number;
  glow?: number;
  imageSrc?: string;
  dpr?: number;
  class?: string;
}

export type PixelTrailRgb = [number, number, number];

export interface PixelTrailSettings {
  gridSize: number;
  trailSize: number;
  maxAge: number;
  interpolate: number;
  ease: (x: number) => number;
  goo: number;
  color: PixelTrailRgb;
  trailColor: PixelTrailRgb | null;
  shape: number;
  gap: number;
  decay: number;
  flow: number;
  gravity: number;
  sparkle: number;
  clickBurst: boolean;
  shine: number;
  glow: number;
  dpr: number | undefined;
}

export interface PixelTrailPoint {
  x: number;
  y: number;
  age: number;
  force: number;
  vx: number;
  vy: number;
}

export interface PixelTrailPointerSample {
  clientX: number;
  clientY: number;
}

export interface PixelTrailEngineOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  getSettings: () => PixelTrailSettings;
}

export interface PixelTrailEngine {
  setImage: (image: HTMLImageElement | null) => void;
  redraw: () => void;
  setVisible: (visible: boolean) => void;
  onMove: (event: PixelTrailPointerSample) => void;
  onDown: (event: PixelTrailPointerSample) => void;
  onLeave: () => void;
  dispose: () => void;
}

/** Demo-only knobs mirrored from the upstream React Bits demo page. */
export interface PixelTrailDemoLook {
  gridSize: number;
  trailSize: number;
  maxAge: number;
  interpolate: number;
  color: string;
  colorShift: boolean;
  shiftColor: string;
  gooeyEnabled: boolean;
  gooStrength: number;
  shape: PixelTrailShape;
  gap: number;
  decay: PixelTrailDecay;
  flow: number;
  gravity: number;
  sparkle: number;
  shine: number;
  glow: number;
  clickBurst: boolean;
  reveal: boolean;
}

export type PixelTrailPreset =
  | 'classic'
  | 'comet'
  | 'gel'
  | 'drip'
  | 'led'
  | 'halftone'
  | 'dither'
  | 'sparkle'
  | 'reveal';
