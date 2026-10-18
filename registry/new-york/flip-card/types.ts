export type FlipCardAxis = 'x' | 'y';

export interface FlipCardProps {
  /** Controlled state: true shows the back. Omit it to let the card manage itself. */
  flipped?: boolean;
  /** Start on the back face. */
  defaultFlipped?: boolean;
  /** `y` turns the card sideways, `x` turns it over the top. */
  axis?: FlipCardAxis;
  /** A press without movement flips the card. */
  flipOnClick?: boolean;
  /** Drag to turn the card by hand. */
  draggable?: boolean;
  /** Pixels of drag for a half turn. 0 uses the card width (or height on x). */
  dragDistance?: number;
  /** The card leans toward the cursor on hover. */
  tilt?: boolean;
  /** Largest tilt angle in degrees. */
  tiltMax?: number;
  /** A soft sheen that follows the cursor. */
  glare?: boolean;
  /** Strength of the sheen at its centre. */
  glareOpacity?: number;
  /** Lift while hovered or held. */
  hoverScale?: number;
  /** Viewing distance in px. Smaller is more dramatic. */
  perspective?: number;
  /** Stiffness of the flip spring. */
  stiffness?: number;
  /** Damping of the flip spring. */
  damping?: number;
  /** Card width in px, capped at the parent. */
  width?: number;
  /** Card height in px. */
  height?: number;
  /** Corner radius in px. */
  radius?: number;
  /** Surface of both faces. */
  background?: string;
  /** Text colour of both faces. */
  color?: string;
  /** Soft shadow beneath the card that narrows as it turns edge on. */
  shadow?: boolean;
  shadowColor?: string;
  shadowOpacity?: number;
  /** Dimmed, flat and inert. */
  disabled?: boolean;
  /** Accessible name. The face is carried by aria-pressed. */
  ariaLabel?: string;
  class?: string;
}

export interface FlipCardEmits {
  'update:flipped': [flipped: boolean];
  flipChange: [flipped: boolean];
}

export interface FlipCardSlots {
  front?: () => unknown;
  back?: () => unknown;
}

export interface FlipCardSample {
  t: number;
  v: number;
}

export interface FlipCardGrip {
  id: number;
  x: number;
  y: number;
  base: number;
  moved: boolean;
  slop: number;
  hist: FlipCardSample[];
}
