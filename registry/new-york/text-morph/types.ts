export interface TextMorphProps {
  /** Words, numbers, prices or short phrases shown by the morph sequence. */
  words?: string[];
  /** Time each value rests before the next morph begins, in milliseconds. */
  interval?: number;
  /** Duration of the fluid morph itself, in milliseconds. */
  morphDuration?: number;
  /** Additional classes on the root element. */
  class?: string;
}

export type TextMorphLayer = 'current' | 'next';
