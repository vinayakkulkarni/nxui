export type ElasticMeshMaterial = 'balloon' | 'chrome' | 'jelly' | 'clay';

export type ElasticMeshTheme = 'dark' | 'light';

export interface ElasticMeshProps {
  /** Text to inflate. Use \n for more lines. */
  text?: string;
  /** URL of an SVG or PNG to inflate instead of text. Its transparent pixels define the shape. */
  src?: string;
  /** Font used for the text. Heavy, rounded faces inflate best. */
  fontFamily?: string;
  /** Weight of the text. */
  fontWeight?: number | string;
  /** Base color of the material. */
  color?: string;
  /** Keeps the colors of the image passed to `src` instead of using `color`. */
  imageColors?: boolean;
  /** Surface finish. */
  material?: ElasticMeshMaterial;
  /** How puffy the shape is. 1 gives round tubes. */
  inflate?: number;
  /** 0 = soft and stretchy, 1 = firm and quick. */
  stiffness?: number;
  /** How long it jiggles after a poke or a pull, 0–1. */
  wobble?: number;
  /** Size of the area the cursor grabs and presses, in pixels. */
  grabRadius?: number;
  /** How far the material can be pulled, 0–1. */
  stretch?: number;
  /** Depth of the dent under the cursor and of a poke. */
  press?: number;
  /** Strength of the soft drop shadow. */
  shadow?: number;
  /** Inflates the shape letter by letter on mount. */
  intro?: boolean;
  /** Lighting setup for dark or light pages. */
  theme?: ElasticMeshTheme;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

export interface ElasticMeshSettings {
  text: string;
  src: string;
  fontFamily: string;
  fontWeight: number | string;
  color: string;
  imageColors: boolean;
  material: number;
  inflate: number;
  stiffness: number;
  wobble: number;
  grabRadius: number;
  stretch: number;
  press: number;
  shadow: number;
  intro: boolean;
  light: boolean;
  reduce: boolean;
  dpr: number | undefined;
}

export interface ElasticMeshPart {
  x: number;
  y: number;
  left: number;
  size: number;
  delay: number;
}

export interface ElasticMeshPointerInput {
  clientX: number;
  clientY: number;
  pointerId?: number;
}

export interface ElasticMeshEngine {
  resize: () => void;
  rebuild: () => void;
  wake: () => void;
  setVisible: (value: boolean) => void;
  resume: () => void;
  pointerMove: (event: ElasticMeshPointerInput) => void;
  pointerDown: (event: ElasticMeshPointerInput) => boolean;
  pointerUp: (event: ElasticMeshPointerInput) => void;
  pointerLeave: () => void;
  pokePart: (index: number) => number;
  destroy: () => void;
}
