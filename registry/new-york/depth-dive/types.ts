export interface DepthDiveProps {
  /**
   * Markdown-ish text: `# Heading` lines start a section, blank lines split
   * paragraphs. Each section becomes one plane in the dive.
   */
  text?: string;
  /** Uppercase the body text. */
  uppercase?: boolean;
  /** Canvas-rendered font stack (loaded via document.fonts when available). */
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  headingSize?: number;
  lineHeight?: number;
  /** Letter spacing in em. */
  letterSpacing?: number;
  /** Horizontal margin as a fraction of the layout width. */
  sideMargin?: number;
  /** Camera field of view; velocity warps it up to `fov + warp`. */
  fov?: number;
  /** Z distance between consecutive sections. */
  layerGap?: number;
  /** Fraction of the frustum a plane fills. */
  fill?: number;
  /** Random XY scatter of planes. */
  scatter?: number;
  /** Random Z-rotation of planes, degrees. */
  tilt?: number;
  /** Camera sway following the pointer. */
  sway?: number;
  /** Extra fov degrees at max scroll velocity. */
  warp?: number;
  scrollSpeed?: number;
  /** Scroll smoothing, 0–1 (higher = snappier). */
  damping?: number;
  /** Sections per second of idle drift. */
  autoScroll?: number;
  /** Wrap sections infinitely. */
  infinite?: boolean;
  /** Fog fade range, in sections ahead. */
  fogFar?: number;
  fogNear?: number;
  /** Where the pass-through dissolve begins, in sections ahead. */
  dissolveStart?: number;
  /** Distant planes tint toward accentColor2. */
  depthTint?: number;
  /** Static chromatic aberration. */
  rgbShift?: number;
  /** Velocity-driven chromatic aberration. */
  rgbShiftVel?: number;
  rgbShiftWarmth?: number;
  /** UV wobble amount. */
  wobble?: number;
  /** Psychedelic tunnel intensity (0 = off, matching the reference default). */
  tunnel?: number;
  tunnelTwist?: number;
  tunnelSpeed?: number;
  /** 0 = two-accent palette, 1 = full rainbow. */
  psychedelia?: number;
  hueDrift?: number;
  /** Radial star streaks intensity. */
  stars?: number;
  streaks?: number;
  grain?: number;
  vignette?: number;
  scanlines?: number;
  textColor?: string;
  headingColor?: string;
  bgColor?: string;
  /** Progress-bar fill + dissolve edge glow tint. */
  accentColor?: string;
  /** Depth tint + palette second stop. */
  accentColor2?: string;
  /** Show the HUD (title, counter, hint, progress bar). */
  showHud?: boolean;
  hudTitle?: string;
  /** Device-pixel-ratio cap. */
  renderScale?: number;
  class?: string;
}

export interface DepthDiveSection {
  heading: string;
  body: string[];
}

export type DepthDiveConfig = Required<
  Omit<DepthDiveProps, 'class' | 'showHud' | 'hudTitle'>
>;

export interface DepthDiveHudRefs {
  counter: HTMLElement | null;
  hint: HTMLElement | null;
  bar: HTMLElement | null;
}

export interface DepthDiveHandle {
  sync: (config: DepthDiveConfig) => void;
  dispose: () => void;
}
