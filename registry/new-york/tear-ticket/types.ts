export type TearTicketOrientation = 'horizontal' | 'vertical';

export interface TearTicketProps {
  /** Artwork behind the body. It shifts against the tilt for parallax and turns grey once used. */
  image?: string;
  /** Alt text for the artwork. */
  imageAlt?: string;
  /** A fade from the paper colour up over the artwork, so text stays readable on busy images. */
  scrim?: boolean;
  /** Corner radius of the artwork panel, in px. */
  imageRadius?: number;
  /** Horizontal puts the stub on the right. Vertical puts the artwork on top and the stub at the bottom. */
  orientation?: TearTicketOrientation;
  /** Controlled state. Set it back to `false` to restore the stub. Leave undefined for uncontrolled. */
  torn?: boolean;
  /** Start already used (uncontrolled). */
  defaultTorn?: boolean;
  /** Ticket width in px. It scales down to fit a narrower parent. */
  width?: number;
  /** Ticket height in px. */
  height?: number;
  /** Size of the stub along the ticket, in px. */
  stubSize?: number;
  /** Outer corner radius in px. */
  radius?: number;
  /** Perforation holes along the tear line. */
  holes?: number;
  /** Hole diameter in px. */
  holeSize?: number;
  /** Radius of the notches at both ends of the tear line. */
  notch?: number;
  /** Jitter of the torn line between holes, in px. */
  roughness?: number;
  /** Degrees of pull at which the last bridge gives way. */
  tearAngle?: number;
  /** How far a paper bridge stretches before it snaps, in px. */
  stretch?: number;
  /** How much the intact fibres hold the stub back, 0 to 1. */
  resistance?: number;
  /** Resting tilt of the whole ticket in the page plane, in degrees. */
  rotate?: number;
  /** The ticket leans toward the cursor in 3D. */
  tilt?: boolean;
  /** Largest tilt angle in degrees. */
  tiltMax?: number;
  /** How far beyond the ticket the pointer still steers the tilt, in px. */
  tiltReach?: number;
  /** How far the artwork travels against the tilt, in px. */
  parallax?: number;
  /** Viewing distance in px. */
  perspective?: number;
  /** Paper colour, also used by the fibres. */
  background?: string;
  /** Text colour. */
  color?: string;
  /** Hairline along the cut edge of each piece. */
  border?: boolean;
  /** Hairline colour. Empty derives a faint tint of the text colour. */
  borderColor?: string;
  /** Hairline thickness in px. */
  borderWidth?: number;
  /** Stub paper colour. Empty follows `background`. */
  stubBackground?: string;
  /** Once the stub is gone, the remaining ticket glides over to sit centred. */
  recenter?: boolean;
  /** Dimmed and inert. */
  disabled?: boolean;
  /** Accessible name of the stub. Enter or Space tears it. */
  ariaLabel?: string;
  class?: string;
}

export interface TearTicketPoint {
  x: number;
  y: number;
}

export interface TearTicketBridge extends TearTicketPoint {
  y0: number;
  y1: number;
  mid: number;
  pts: [number, number][];
}

export interface TearTicketEnd extends TearTicketPoint {
  v: number;
}

export interface TearTicketGeometry {
  vertical: boolean;
  cross: number;
  body: string;
  stub: string;
  bridges: TearTicketBridge[];
  ends: [TearTicketEnd, TearTicketEnd];
  bodyOutline: string;
  stubOutline: string;
}

export type TearTicketPhase = 'idle' | 'held' | 'free' | 'drop' | 'return';

export interface TearTicketSim {
  raf: number;
  last: number;
  phase: TearTicketPhase;
  id: number | null;
  sign: number;
  hinge: TearTicketPoint;
  hingeV: number;
  grab: TearTicketPoint;
  start: TearTicketPoint;
  point: TearTicketPoint;
  a0: number;
  theta: number;
  thetaV: number;
  sx: number;
  sy: number;
  vx: number;
  vy: number;
  spin: number;
  pvx: number;
  pvy: number;
  pt: number;
  fade: number;
  age: number;
  bx: number;
  bv: number;
  snapped: boolean[];
  snapAt: number[];
  span: number[];
}
