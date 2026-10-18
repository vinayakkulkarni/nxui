export type ASCIITextTheme = 'dark' | 'light';

export interface ASCIITextProps {
  /** Text rendered in ASCII. */
  text?: string;
  /** Height of each character cell in px. Smaller cells give finer detail. */
  asciiFontSize?: number;
  /** Characters from darkest to brightest. Any string works, including Unicode blocks. */
  charset?: string;
  /** Font for the text and the characters. */
  fontFamily?: string;
  /** Weight of the rendered text. */
  fontWeight?: number;
  /** Color of the text behind the characters. */
  textColor?: string;
  /** Character gradient from the center outward. Up to three colors. */
  colors?: string[];
  /** Size of the text relative to the container. */
  textScale?: number;
  /** Opacity of the colored pixel blocks under the characters (0–1). */
  blocks?: number;
  /** Strength of the wavy motion. 0 keeps the text flat. */
  waves?: number;
  /** Speed of the wavy motion. */
  waveSpeed?: number;
  /** Amount of color fringing around the letters. */
  chroma?: number;
  /** How far the text turns toward the pointer. */
  tilt?: number;
  /** Hue rotation as the pointer circles the text. 0 keeps colors fixed. */
  hueShift?: number;
  /** Size and strength of the scramble under the pointer (0–1). */
  scramble?: number;
  /** Send a ring of characters across the canvas from each click. */
  clickRipple?: boolean;
  /** Decode the text out of random characters on load. */
  intro?: boolean;
  /** Sway the text gently when nobody interacts. */
  idle?: boolean;
  /** React to the pointer with tilt, hue, scramble and ripples. */
  interactive?: boolean;
  /** `light` inverts the colors so the effect works on white pages. */
  theme?: ASCIITextTheme;
  class?: string;
}

export interface ASCIITextSettings {
  cellSize: number;
  textScale: number;
  blocks: number;
  waves: number;
  waveSpeed: number;
  chroma: number;
  tilt: number;
  hueShift: number;
  scramble: number;
  clickRipple: boolean;
  intro: boolean;
  idle: boolean;
  interactive: boolean;
  light: boolean;
  colors: [string, string, string];
}

export interface ASCIITextRipple {
  x: number;
  y: number;
  age: number;
}

export type ASCIITextPresetName =
  | 'classic'
  | 'terminal'
  | 'blocks'
  | 'binary'
  | 'mono';

export type ASCIITextPresetValues = Pick<
  Required<ASCIITextProps>,
  | 'charset'
  | 'colors'
  | 'asciiFontSize'
  | 'textScale'
  | 'blocks'
  | 'waves'
  | 'waveSpeed'
  | 'chroma'
  | 'tilt'
  | 'hueShift'
  | 'scramble'
>;
