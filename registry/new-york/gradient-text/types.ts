export type GradientTextVariant = 'linear' | 'flow' | 'conic';
export type GradientTextDirection = 'horizontal' | 'vertical' | 'diagonal';

export interface GradientTextProps {
  /** Gradient colors. One color is repeated. */
  colors?: string[];
  /** Seconds for one sweep of the gradient. */
  animationSpeed?: number;
  /** How the colors move: a sliding sweep, a drifting mesh or a swinging conic fan. */
  variant?: GradientTextVariant;
  /** Gradient angle in degrees. */
  angle?: number;
  /** Shortcut for `angle` (horizontal 90, vertical 180, diagonal 135). Wins when set. */
  direction?: GradientTextDirection;
  /** How stretched the gradient is, 1 to 6. */
  scale?: number;
  /** Swing back and forth instead of looping in one direction. */
  yoyo?: boolean;
  /** Strength of a soft glow behind the text, 0 to 1. */
  glow?: number;
  /** Draw a pill border with the same gradient. */
  showBorder?: boolean;
  /** Border width in px. */
  borderWidth?: number;
  /** Freeze the colors while hovered. */
  pauseOnHover?: boolean;
  /** Pull the colors toward the cursor. */
  followPointer?: boolean;
  class?: string;
}

export interface GradientPaintSettings {
  colors: string[];
  speed: number;
  variant: GradientTextVariant;
  angle: number;
  scale: number;
  yoyo: boolean;
}

export interface GradientPointerState {
  time: number;
  inside: boolean;
  visible: boolean;
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  pull: number;
}
