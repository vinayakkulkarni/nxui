export type LetterGlitchClickEffect = 'tear' | 'burst' | 'none';

export type LetterGlitchPreset =
  | 'signature'
  | 'classic'
  | 'terminal'
  | 'binary'
  | 'hex'
  | 'sparse'
  | 'storm'
  | 'pixel';

export type LetterGlitchFont = 'system' | 'geist' | 'code' | 'pixel';

export type LetterGlitchCharset =
  | 'classic'
  | 'letters'
  | 'binary'
  | 'hex'
  | 'symbols'
  | 'braille';

export interface LetterGlitchProps {
  /** Up to 8 colors that glitching letters light up in. Light mode defaults to dark ink tones. */
  glitchColors?: string[];
  /** Color of the letters at rest. Light mode defaults to near black. */
  baseColor?: string;
  /** Characters to draw. Repeat a character to make it appear more often. */
  characters?: string;
  /** CSS font family for the letters. Web fonts are drawn once they have loaded. */
  fontFamily?: string;
  /** Size of the letters in pixels (6–96). */
  fontSize?: number;
  /** Room around each letter relative to the font size (0–2). */
  spacing?: number;
  /** Share of the grid that shows a letter at rest, from 0 to 1. */
  density?: number;
  /** Opacity of the letters at rest, from 0 to 1. */
  baseOpacity?: number;
  /** How often letters glitch, from 0 (never) to 1 (constantly). */
  glitchAmount?: number;
  /** Tempo of the scrambling and glitches. 0 freezes the letters. */
  speed?: number;
  /** Fades glitching letters in and out. When off, they flicker on and off instantly. */
  smooth?: boolean;
  /** Lights up and scrambles the letters near the cursor. */
  interactive?: boolean;
  /** Radius of the area around the cursor that reacts, in pixels. */
  cursorRadius?: number;
  /** What a click does: tear rips through the rows, burst sends glitches outward. */
  clickEffect?: LetterGlitchClickEffect;
  /** Strength of the soft waves of light that drift across the letters, from 0 to 1. */
  flow?: number;
  /** Fades the letters out toward the edges, from 0 to 0.5. */
  edgeFade?: number;
  /** Clears the letters behind the middle of the container, from 0 to 1. */
  centerFade?: number;
  /** Boots the letters in with a flicker on mount. */
  intro?: boolean;
  /** Switches the default colors to dark ink for light backgrounds. */
  lightMode?: boolean;
  /** Paints an opaque background behind the letters. Unset keeps the canvas transparent. */
  backgroundColor?: string;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  /** Extra classes merged on the container. */
  class?: string;
}

export interface LetterGlitchSettings {
  colors: string[];
  baseColor: string;
  characters: string;
  fontFamily: string;
  fontSize: number;
  spacing: number;
  density: number;
  baseOpacity: number;
  glitchAmount: number;
  speed: number;
  smooth: boolean;
  interactive: boolean;
  cursorRadius: number;
  clickEffect: LetterGlitchClickEffect;
  flow: number;
  edgeFade: number;
  centerFade: number;
  intro: boolean;
  backgroundColor: string | undefined;
}

export interface LetterGlitchLook {
  glitchColors: string[];
  baseColor: string;
  font: LetterGlitchFont;
  charset: LetterGlitchCharset;
  fontSize: number;
  spacing: number;
  density: number;
  baseOpacity: number;
  glitchAmount: number;
  speed: number;
  flow: number;
  smooth: boolean;
  edgeFade: number;
  centerFade: number;
}

export interface LetterGlitchEngine {
  /** Draws one frame. Returns true while the loop must keep running. */
  frame: (now: number) => boolean;
  resize: (width: number, height: number, ratio: number) => void;
  pointer: (x: number, y: number, inside: boolean) => void;
  click: (x: number, y: number, inside: boolean) => void;
  leave: () => void;
  setVisible: (visible: boolean) => void;
  resetClock: () => void;
  refont: () => void;
  destroy: () => void;
}

export interface LetterGlitchWalker {
  x: number;
  y: number;
  angle: number;
  life: number;
  span: number;
  speed: number;
  color: number;
  carry: number;
  after: number;
  wiggle: number;
  branch: number;
}

export type LetterGlitchWalkerInit = Omit<
  LetterGlitchWalker,
  'carry' | 'after' | 'wiggle' | 'branch'
> &
  Partial<Pick<LetterGlitchWalker, 'after' | 'wiggle' | 'branch'>>;
