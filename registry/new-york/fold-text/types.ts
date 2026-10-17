export type FoldTextSplitBy = 'char' | 'word' | 'line';

export type FoldTextHinge = 'top' | 'bottom' | 'left' | 'right';

export type FoldTextTrigger = 'mount' | 'hover' | 'scroll' | 'loop';

export type FoldTextStaggerFrom =
  | 'start'
  | 'center'
  | 'end'
  | 'edges'
  | 'random';

export type FoldTextStyle = 'paper' | 'blinds' | 'flip';

export type FoldTextAxis = 'rotateX' | 'rotateY';

export interface FoldTextProps {
  /** The text to unfold. Use `\n` for line breaks. */
  text?: string;
  /** Fold each character, each word, or each line. */
  splitBy?: FoldTextSplitBy;
  /** The edge each piece hinges on. */
  hinge?: FoldTextHinge;
  /** Paper folds from one edge, blinds open as two slats, flip turns a full half-turn. */
  foldStyle?: FoldTextStyle;
  /** Seconds each piece takes to unfold. */
  duration?: number;
  /** Seconds between pieces starting. */
  stagger?: number;
  /** Where the stagger starts. */
  staggerFrom?: FoldTextStaggerFrom;
  /** Angle, in degrees, a piece starts folded at (0–180). */
  foldAngle?: number;
  /** GSAP-style ease name, e.g. `power3.out`, `expo.out`, `back.out(1.2)`, `circ.out`. */
  ease?: string;
  /** Perspective distance in pixels. */
  perspective?: number;
  /** Strength (0–1) of the shadow along the crease while a piece is folded. */
  creaseShading?: number;
  /** When the text unfolds. */
  trigger?: FoldTextTrigger;
  /** Seconds the unfolded text holds before folding back up. Only for `loop`. */
  loopDelay?: number;
  /** Pieces near the pointer fold partly back. */
  hoverRefold?: boolean;
  /** Pointer reach, in pixels, of the refold. */
  refoldRadius?: number;
  /** Largest refold angle, in degrees. */
  refoldAngle?: number;
  /** Font size. Numbers are pixels. */
  fontSize?: string | number;
  /** Font weight. */
  fontWeight?: string | number;
  /** Text color. */
  color?: string;
  class?: string;
}

export interface FoldTextHingeConfig {
  origin: string;
  axis: FoldTextAxis;
  sign: number;
}

export type FoldTextSegment =
  | { kind: 'break'; key: string }
  | { kind: 'space'; key: string; text: string }
  | { kind: 'piece'; key: string; content: string; line: boolean }
  | { kind: 'word'; key: string; chars: { key: string; content: string }[] };

export interface FoldTextPiece {
  element: HTMLElement;
  parts: HTMLElement[];
  t: number;
  f: number;
  r: number;
  aim: number;
}

export interface FoldTextPoint {
  x: number;
  y: number;
}

export interface FoldTextSegmentProps {
  content: string;
  hinge: FoldTextHinge;
  foldStyle: FoldTextStyle;
  folded: boolean;
  line?: boolean;
}
