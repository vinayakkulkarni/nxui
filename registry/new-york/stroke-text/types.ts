export type StrokeTextTrigger = 'mount' | 'hover' | 'scroll' | 'loop';
export type StrokeTextFillMode = 'wipe' | 'fade' | 'none';
export type StrokeTextWipeFrom = 'left' | 'right' | 'top' | 'bottom';
export type StrokeTextStyle = 'solid' | 'dashed' | 'dotted';

export interface StrokeTextProps {
  /** The heading copy rendered as measured SVG glyphs. */
  text?: string;
  /** Color used for the drawing outline. */
  strokeColor?: string;
  /** Color that floods into the glyphs after the outline draw. */
  fillColor?: string;
  /** Outline thickness in SVG units. */
  strokeWidth?: number;
  /** Seconds each glyph outline takes to draw. */
  drawDuration?: number;
  /** Seconds between the outline finishing and the fill starting. */
  fillDelay?: number;
  /** Seconds between each glyph starting to draw. */
  stagger?: number;
  /** GSAP-style ease name for the outline draw, e.g. `power2.out`, `expo.out`, `sine.inOut`. */
  ease?: string;
  /** When the animation plays. */
  trigger?: StrokeTextTrigger;
  /** How the fill appears after the outline. */
  fillMode?: StrokeTextFillMode;
  /** Edge the wipe fill starts from. */
  wipeFrom?: StrokeTextWipeFrom;
  /** Font size in pixels. */
  fontSize?: number;
  /** Font weight. */
  fontWeight?: number | string;
  /** Font family. `inherit` uses the surrounding font. */
  fontFamily?: string;
  /** Letter spacing in pixels. */
  letterSpacing?: number;
  /** Stagger from the last glyph to the first. */
  reverse?: boolean;
  /** Solid, dashed or dotted outline. */
  strokeStyle?: StrokeTextStyle;
  /** Dash or dot spacing in SVG units for dashed and dotted outlines. */
  dashLength?: number;
  /** Dashed and dotted outlines keep flowing around the letters. */
  marching?: boolean;
  /** Redraws the outline when hovered after the first draw. */
  hoverRedraw?: boolean;
  /** Filled letters lift off the page with a soft offset shadow. */
  shadow?: boolean;
  /** Shadow color. Defaults to the stroke color. */
  shadowColor?: string;
  class?: string;
}

export interface StrokeTextBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StrokeTextDashPattern {
  array: string;
  period: number;
}

export type StrokeTextEase = (t: number) => number;

export interface StrokeTextAnimatorOptions {
  root: HTMLElement;
  strokes: SVGTSpanElement[];
  fills: SVGTSpanElement[];
  outline: SVGTextElement | null;
  wipe: SVGRectElement | null;
  drop: SVGFEDropShadowElement | null;
  box: StrokeTextBox;
  dash: number;
  dashPeriod: number;
  drawDuration: number;
  fillDelay: number;
  stagger: number;
  ease: string;
  trigger: StrokeTextTrigger;
  fillMode: StrokeTextFillMode;
  wipeFrom: StrokeTextWipeFrom;
  reverse: boolean;
  marching: boolean;
  hoverRedraw: boolean;
  lift: number;
  fontSize: number;
  reducedMotion: boolean;
}

export interface StrokeTextAnimator {
  pointerEnter: () => void;
  destroy: () => void;
}
