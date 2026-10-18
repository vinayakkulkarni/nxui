import type { HTMLAttributes } from 'vue';

/** Displacement-map channel used by `feDisplacementMap` and the WebGL shader. */
export type GlassSurfaceChannel = 'R' | 'G' | 'B' | 'A';

/** How the glass bends light. */
export type GlassSurfaceRenderer = 'auto' | 'svg' | 'webgl';

/** Media the WebGL renderer samples to fake refraction outside Chromium. */
export type GlassSurfaceBackdrop =
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement;

export type GlassSurfaceBlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface GlassSurfaceProps {
  /** Width in px, or any CSS value like `'100%'`. */
  width?: number | string;
  /** Height in px, or any CSS value like `'100vh'`. */
  height?: number | string;
  /** Corner radius in px. Not used with a shape. */
  borderRadius?: number;
  /** Width of the bending edge, as a fraction of the shorter side. */
  borderWidth?: number;
  /** Brightness of the calm center, in %. 50 leaves it undistorted. */
  brightness?: number;
  /** How strongly the calm center holds the view still, 0–1. */
  opacity?: number;
  /** Softness of the edge-to-center transition, in px. */
  blur?: number;
  /** Blurs the light coming through the glass. */
  displace?: number;
  /** Opacity of a soft frosted tint over the glass, 0–1. */
  backgroundOpacity?: number;
  /** Saturation of what is seen through the glass. */
  saturation?: number;
  /** How strongly the edge bends what is behind it. */
  distortionScale?: number;
  /** Extra bending for the red channel. */
  redOffset?: number;
  /** Extra bending for the green channel. */
  greenOffset?: number;
  /** Extra bending for the blue channel. */
  blueOffset?: number;
  /** Map channel that moves pixels sideways. */
  xChannel?: GlassSurfaceChannel;
  /** Map channel that moves pixels up and down. */
  yChannel?: GlassSurfaceChannel;
  /** How the two edge gradients of the displacement map combine. */
  mixBlendMode?: GlassSurfaceBlendMode;
  /** Bend what is behind the glass. `false` = frosted look everywhere. */
  refraction?: boolean;
  /** Renderer choice. */
  renderer?: GlassSurfaceRenderer;
  /** Image, video or canvas behind the glass (needed for WebGL refraction). */
  backdrop?: GlassSurfaceBackdrop | null;
  /** URL of an SVG or transparent PNG that gives the glass its outline. */
  shape?: string;
  class?: HTMLAttributes['class'];
}

export interface GlassShapeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GlassShapeTrace {
  image: HTMLImageElement;
  width: number;
  height: number;
  box: GlassShapeBox;
  depth: Float32Array;
  w: number;
  h: number;
  ratio: number;
  line: string;
  glow: string;
}

export interface GlassShapeArt {
  src: string;
  failed: boolean;
  box: GlassShapeBox;
  line: string;
  glow: string;
}

export interface GlassSettings {
  backdrop: GlassSurfaceBackdrop | null | undefined;
  displace: number;
  saturation: number;
  distortionScale: number;
  redOffset: number;
  greenOffset: number;
  blueOffset: number;
  xChannel: GlassSurfaceChannel;
  yChannel: GlassSurfaceChannel;
}
