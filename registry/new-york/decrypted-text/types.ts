export type DecryptedTextEffect = 'scramble' | 'flip' | 'fade';

export type DecryptedTextAnimateOn = 'view' | 'hover' | 'inViewHover' | 'click';

export type DecryptedTextClickMode = 'once' | 'toggle';

export type DecryptedTextRevealDirection =
  | 'start'
  | 'end'
  | 'center'
  | 'random';

export interface DecryptedTextProps {
  /** The text to decrypt. */
  text: string;
  /** Time between steps, in ms. */
  speed?: number;
  /** Steps the letters scramble before settling when not sequential; also how long letters keep scrambling after the cursor passes with hoverRadius. */
  maxIterations?: number;
  /** Reveal one letter per step instead of all at once. */
  sequential?: boolean;
  /** Where the sequential reveal starts. */
  revealDirection?: DecryptedTextRevealDirection;
  /** Scramble using only the letters already in the text. */
  useOriginalCharsOnly?: boolean;
  /** The pool of characters used while scrambling. */
  characters?: string;
  /** Classes for revealed letters. */
  revealedClass?: string;
  /** Classes for letters that are still scrambled. */
  encryptedClass?: string;
  /** What starts the decryption. View and click start scrambled. */
  animateOn?: DecryptedTextAnimateOn;
  /** With click, decrypt once or toggle back and forth. */
  clickMode?: DecryptedTextClickMode;
  /** How letters decode: swap in place, roll in like a flip board, or brighten out of faint glyphs. */
  effect?: DecryptedTextEffect;
  /** Color of letters while scrambled; each eases back to the text color as it decodes. */
  scrambleColor?: string;
  /** After decrypting, hold, scramble again and repeat. Pauses while off screen. */
  loop?: boolean;
  /** How long the decrypted text holds before scrambling again when looping, in ms. */
  loopDelay?: number;
  /** With hover, only letters within this many px of the cursor scramble. 0 decrypts the whole text. */
  hoverRadius?: number;
  class?: string;
}

export interface DecryptedTextFrame {
  shown: string[];
  revealed: boolean[];
  tint: number[];
  dim: number[];
  squeeze: number[];
}

export interface DecryptedTextGroup {
  key: number;
  /** Whitespace run between words; empty for a word group. */
  space: string;
  letters: number[];
}

export interface DecryptedTextRun {
  forward: boolean;
  cycle: boolean;
  iteration: number;
  queue: (number | null)[];
}

export interface DecryptedTextRunOptions {
  from?: boolean[];
  cycle?: boolean;
  lead?: number;
}

export interface DecryptedTextFontMetrics {
  font: string;
  spacing: number;
}

export interface DecryptedTextPoint {
  x: number;
  y: number;
}
