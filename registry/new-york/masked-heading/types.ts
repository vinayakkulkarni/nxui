export type MaskedHeadingReveal =
  | 'rise'
  | 'scale'
  | 'blur'
  | 'wipe'
  | 'fade'
  | 'none';

export type MaskedHeadingTrigger = 'view' | 'mount' | 'hover';

export type MaskedHeadingMediaType = 'image' | 'video';

export type MaskedHeadingAlign = 'left' | 'center' | 'right';

export interface MaskedHeadingProps {
  /** Heading copy. */
  text?: string;
  /** Element the heading renders as. */
  tag?: string;
  /** Whether the source behind the letters is an image or a muted looping video. */
  mediaType?: MaskedHeadingMediaType;
  /** Image or video URL. */
  src?: string;
  /** Poster frame used while a video loads. */
  poster?: string;
  /** How far the media is zoomed past the heading (overscan for parallax). */
  fillScale?: number;
  /** How far the media slides under the letters with the pointer, in px. */
  parallax?: number;
  /** Amplitude of the slow idle motion, in px. */
  drift?: number;
  /** Extra zoom the media eases into while hovered (0.1 = 10%). */
  hoverZoom?: number;
  /** Brightness of the media. */
  brightness?: number;
  /** Saturation of the media. */
  saturation?: number;
  /** Render the media in black and white. */
  grayscale?: boolean;
  /** Colorizes the media in one color, like a duotone print. */
  tint?: string;
  /** Dims the media except for a soft pool of light following the pointer. */
  spotlight?: boolean;
  /** Radius of the spotlight, in px. */
  spotlightRadius?: number;
  /** Draws a thin stroke around every letter. */
  outline?: boolean;
  /** Outline color. Empty follows the surrounding text color. */
  outlineColor?: string;
  /** Outline thickness, in px. */
  outlineWidth?: number;
  /** Entrance style. */
  reveal?: MaskedHeadingReveal;
  /** Entrance duration, in seconds. */
  duration?: number;
  /** Delay between words (rise) — letters step at about a third of it (scale). */
  stagger?: number;
  /** When the entrance runs. */
  trigger?: MaskedHeadingTrigger;
  /** Text alignment. */
  align?: MaskedHeadingAlign;
  /** Font weight. */
  weight?: number;
  /** Letter spacing, in em. */
  tracking?: number;
  /** Line height. */
  lineHeight?: number;
  /** Type size as a fraction of the container width. */
  textScale?: number;
  /** Additional classes on the root element. */
  class?: string;
}

export interface MaskedHeadingGlyph {
  char: string;
  /** Index of the word the glyph belongs to. */
  w: number;
}

export interface MaskedHeadingGlyphBox {
  x: number;
  y: number;
  w: number;
  cx: number;
  cy: number;
  /** Horizontal center of the glyph's line. */
  lc: number;
}

export interface MaskedHeadingGlyphState {
  x: number;
  y: number;
  s: number;
}

export interface MaskedHeadingOffset {
  x: number;
  y: number;
  tx: number;
  ty: number;
  zoom: number;
  px: number;
  py: number;
  sx: number;
  sy: number;
  lit: boolean;
}

/** One running entrance: `step` receives elapsed ms until `total`. */
export interface MaskedHeadingTimeline {
  start: number;
  total: number;
  step: (elapsed: number) => void;
}
