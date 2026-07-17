/** Built-in color themes for CurvedInput. */
export type CurvedInputTheme = 'dark' | 'light';

/** Drop-shadow presets. */
export type CurvedInputShadowSize = 'sm' | 'md' | 'lg';

/**
 * Props for the CurvedInput registry component.
 */
export interface CurvedInputProps {
  /** Placeholder shown while empty. */
  placeholder?: string;
  /** Submit button label. */
  buttonText?: string;
  /** Input type (email, text, search, tel, url, password, number). */
  type?: string;
  /** Form field name. */
  name?: string;
  /** Accessible label for the hidden input. */
  ariaLabel?: string;
  /** Built-in palette. */
  theme?: CurvedInputTheme;
  /** Rendered width in px (or any CSS width string). */
  width?: number | string;
  /** Arc sagitta in px — positive arches up, negative sags down, 0 is flat. */
  bend?: number;
  /** Bar thickness in px. */
  height?: number;
  /** Corner radius of the bar. */
  cornerRadius?: number;
  /** Border stroke width. */
  borderWidth?: number;
  /** Text size in px. */
  fontSize?: number;
  /** Palette overrides. */
  backgroundColor?: string;
  textColor?: string;
  placeholderColor?: string;
  borderColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  iconColor?: string;
  /** Drop-shadow preset (sm | md | lg). */
  shadowSize?: CurvedInputShadowSize;
  shadowColor?: string;
  /** Show the submit button. */
  showButton?: boolean;
  /** Show the mail chip icon. */
  showIcon?: boolean;
  /** Additional classes on the root form. */
  class?: string;
}

/** Bent coordinate-space geometry mapping flat (u, v) onto a circular arc. */
export interface CurvedInputGeometry {
  straight: boolean;
  W: number;
  T: number;
  svgH: number;
  R?: number;
  dir?: number;
  uPerLen: number;
  point: (u: number, v: number) => [number, number];
  angleAt: (u: number) => number;
  uFromPoint: (x: number, y: number) => number;
}
