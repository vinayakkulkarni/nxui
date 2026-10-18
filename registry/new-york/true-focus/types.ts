export type TrueFocusStyle = 'brackets' | 'box' | 'underline' | 'highlight';

export type TrueFocusOrder = 'sequential' | 'random';

export type TrueFocusEasing = 'smooth' | 'spring';

export interface TrueFocusProps {
  sentence?: string;
  /** String used to split the sentence into focusable words. */
  separator?: string;
  /** Focus follows the hovered word instead of cycling on its own. */
  manualMode?: boolean;
  focusStyle?: TrueFocusStyle;
  order?: TrueFocusOrder;
  easing?: TrueFocusEasing;
  blurAmount?: number;
  /** Size the focused word grows to. 1 keeps it the same. */
  focusScale?: number;
  borderColor?: string;
  /** Fill of the `highlight` style. Falls back to `borderColor`. */
  highlightColor?: string;
  glowColor?: string;
  /** Seconds the focus takes to move. */
  animationDuration?: number;
  /** Seconds the focus rests on each word. */
  pauseBetweenAnimations?: number;
  cornerSize?: number;
  borderWidth?: number;
  unfocusedOpacity?: number;
  class?: string;
}

export interface TrueFocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TrueFocusCorner =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type TrueFocusPresetName = 'classic' | 'box' | 'underline' | 'marker';

export interface TrueFocusPresetValues {
  sentence: string;
  borderColor: string;
  highlightColor: string;
  easing: TrueFocusEasing;
  order: TrueFocusOrder;
  animationDuration: number;
  pauseBetweenAnimations: number;
  focusStyle: TrueFocusStyle;
  focusScale: number;
  blurAmount: number;
  unfocusedOpacity: number;
  cornerSize: number;
  borderWidth: number;
}
