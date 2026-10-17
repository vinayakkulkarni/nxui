/** Which hand-drawn mark to sketch around the text. */
export type AnnotationVariant =
  | 'wavy'
  | 'underline'
  | 'doubleUnderline'
  | 'dottedUnderline'
  | 'line'
  | 'arrow'
  | 'highlight'
  | 'circle'
  | 'box'
  | 'bracket'
  | 'strikethrough'
  | 'crossOut';

/**
 * Props for the AnnotatedText registry component.
 */
export interface AnnotatedTextProps {
  /** Which hand-drawn mark to draw. */
  variant?: AnnotationVariant;
  /** Tailwind text color class for the mark, e.g. "text-rose-400". Defaults per variant. */
  color?: string;
  /** Draw the annotation when it first enters the viewport. */
  animate?: boolean;
  /** Delay before drawing, in seconds. */
  delay?: number;
  /** Drawing duration of each stroke, in seconds. */
  duration?: number;
  /** Additional classes applied to the wrapper span. */
  class?: string;
}

/** A sampled point in a mark's viewBox space. */
export interface AnnotationPoint {
  x: number;
  y: number;
}

/** One SVG path of a mark. */
export interface AnnotationStroke {
  d: string;
  width?: number;
  opacity?: number;
  fill?: boolean;
}

/** Layout, color and geometry of one variant. */
export interface AnnotationMark {
  wrapper: string;
  decoration: string;
  color: string;
  viewBox?: string;
  strokes?: AnnotationStroke[];
  /** Marks that are plain CSS rather than a drawing. */
  css?: string;
  /** Filled marks sit behind the glyphs instead of on top of them. */
  behindText?: boolean;
}
