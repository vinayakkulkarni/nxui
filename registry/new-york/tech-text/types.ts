export type TechTextAlign = 'left' | 'center' | 'right';
export type TechTextLineStyle = 'dashed' | 'solid';
export type TechTextReveal = 'area' | 'letter' | 'off';
export type TechTextIntro = 'none' | 'type' | 'assemble' | 'metrics';

export interface TechTextProps {
  /** The wordmark to render. */
  text?: string;
  /** Any font family loaded on the page. Empty inherits the container font. */
  fontFamily?: string;
  fontWeight?: number;
  /** Largest font size in px. The wordmark shrinks to fit narrower containers. */
  fontSize?: number;
  /** Extra space between letters, in em. */
  letterSpacing?: number;
  /** Letter and outline colour. `currentColor` follows the surrounding text colour. */
  color?: string;
  /** Colour of the selection frame, connector, specks and labels. */
  accentColor?: string;
  align?: TechTextAlign;
  /** Radius of the area reveal, in px. */
  reach?: number;
  /** How gradually the fill hands over to the outlines. 0 is a hard edge. */
  softness?: number;
  dashLength?: number;
  dashGap?: number;
  strokeWidth?: number;
  lineStyle?: TechTextLineStyle;
  reveal?: TechTextReveal;
  /** Blinking squares around the active letter. 0 turns them off. */
  specks?: number;
  selection?: boolean;
  labels?: boolean;
  draggable?: boolean;
  /** Spring overshoot, 0 (none) to 1 (very springy). */
  bounce?: number;
  /** Sweep the reveal across the wordmark while the pointer is away. */
  sweep?: boolean;
  speed?: number;
  clickKick?: boolean;
  intro?: TechTextIntro;
  /** Intro length, in seconds. */
  introDuration?: number;
  /** Rule the font guide lines while a letter is active. */
  guides?: boolean;
  class?: string;
}

export type TechTextSettings = Required<Omit<TechTextProps, 'class'>>;

export interface TechTextBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TechTextArt {
  image: HTMLCanvasElement;
  left: number;
  top: number;
}

export interface TechTextShape {
  char: string;
  x: number;
  box: TechTextBox;
}

export interface TechTextCell {
  x: number;
  y: number;
  size: number;
  dx: number;
  dy: number;
  start: number;
  land: number;
}

export interface TechTextPoint {
  x: number;
  y: number;
}

export interface TechTextGlyph extends TechTextShape {
  offset: TechTextPoint;
  velocity: TechTextPoint;
  outline: number;
  shown: number;
  cells: TechTextCell[] | null;
  assembled: number;
  index: number;
  fill: TechTextArt;
  dashes: TechTextArt;
}

export interface TechTextLine {
  y: number;
  label: string;
}

export interface TechTextBand {
  y0: number;
  y1: number;
  up: boolean;
  order: number;
}

export interface TechTextWord {
  size: number;
  baseline: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  lines: TechTextLine[];
  bands: TechTextBand[];
}

export interface TechTextKick {
  index: number;
  at: number;
  velocity: number;
}

export interface TechTextEngineOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  settings: () => TechTextSettings;
  reducedMotion: () => boolean;
}

export interface TechTextEngine {
  wake: () => void;
  resize: () => void;
  setVisible: (value: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerLeave: () => void;
  pointerDown: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  destroy: () => void;
}
