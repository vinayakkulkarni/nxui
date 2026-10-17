export type PixelCardVariant = 'default' | 'blue' | 'yellow' | 'pink';

export type PixelCardShape = 'square' | 'circle' | 'diamond';

export type PixelCardOrigin = 'center' | 'pointer';

export type PixelCardTrigger = 'hover' | 'click' | 'always';

export type PixelCardTheme = 'dark' | 'light';

export interface PixelCardProps {
  /** Ready-made palette with its own gap and speed. Other props override it. */
  variant?: PixelCardVariant;
  /** Pixel colors, as an array or a comma-separated string. */
  colors?: string | string[];
  /** Distance between pixels in px. */
  gap?: number;
  /** Twinkle speed from 0 to 100. 0 holds the pixels still. */
  speed?: number;
  /** Largest size a pixel grows to, in px. */
  pixelSize?: number;
  shape?: PixelCardShape;
  /** Where the reveal wave starts. */
  origin?: PixelCardOrigin;
  /** Time for the wave to sweep across the card, in ms. */
  revealDuration?: number;
  /** How much pixels near the cursor swell and brighten, 0 to 1. */
  spotlight?: number;
  /** Strength of the soft light under the pixels, 0 to 1. */
  glow?: number;
  glowColor?: string;
  /** Opacity of pixels and glow, 0 to 1. */
  opacity?: number;
  /** Fades pixels out toward the middle, 0 to 1. */
  fade?: number;
  trigger?: PixelCardTrigger;
  /** Clicking sends a ripple out from the click. */
  clickPulse?: boolean;
  /** Plays the reveal once when the card first scrolls into view. */
  intro?: boolean;
  /** Wait before the intro, in ms. */
  introDelay?: number;
  /** Stops keyboard focus from triggering the effect. Defaults to the variant. */
  noFocus?: boolean;
  theme?: PixelCardTheme;
  /** Corner radius in px. */
  radius?: number;
  class?: string;
}

export interface PixelCardPreset {
  gap: number;
  speed: number;
  colors: Record<PixelCardTheme, string[]>;
  glow: Record<PixelCardTheme, string>;
  noFocus: boolean;
}

export interface PixelCardSettings {
  colors: string[];
  gap: number;
  speed: number;
  pixelSize: number;
  /** 0 square, 1 circle, 2 diamond. */
  shape: number;
  origin: PixelCardOrigin;
  revealDuration: number;
  spotlight: number;
  glow: number;
  glowColor: string;
  opacity: number;
  fade: number;
  trigger: PixelCardTrigger;
  clickPulse: boolean;
  intro: boolean;
  introDelay: number;
}

export interface PixelCardPulse {
  x: number;
  y: number;
  radius: number;
  power: number;
}

export interface PixelCardPointer {
  clientX: number;
  clientY: number;
  pointerType?: string;
}

export interface PixelCardEngineOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  getSettings: () => PixelCardSettings;
  reduce: () => boolean;
  /** Called when the card turns on or off. */
  onActive: (active: boolean) => void;
  /** Asks the host to schedule frames. */
  wake: () => void;
}

export interface PixelCardEngine {
  /** Advances one frame. Returns true while more frames are needed. */
  frame: (now: number) => boolean;
  build: () => void;
  sync: () => void;
  setVisible: (visible: boolean) => void;
  enter: (event: PixelCardPointer) => void;
  move: (event: PixelCardPointer) => void;
  leave: (event: PixelCardPointer) => void;
  down: (event: PixelCardPointer) => void;
  outside: (target: EventTarget | null) => void;
  toggle: () => void;
  focus: () => void;
  blur: () => void;
  reset: () => void;
}
