/** Pull axis. `any` is free; the others keep a little rubber-banded give across the axis. */
export type SlingButtonAxis = 'any' | 'horizontal' | 'vertical';

/**
 * Props for the SlingButton registry component.
 */
export interface SlingButtonProps {
  /** The pad fill. */
  padColor?: string;
  /** The pad content colour. */
  iconColor?: string;
  /** The power arc, the loaded band and the particles. */
  accentColor?: string;
  /** The seat the pad rests in. */
  wellColor?: string;
  /** The band before it loads. */
  bandColor?: string;
  /** Pad diameter in pixels. Seat, hit area and particles follow. */
  size?: number;
  /** Arc and band thickness in pixels. */
  strokeWidth?: number;
  /** Pull distance in pixels that loads the send. */
  armAt?: number;
  /** How far the band can stretch before it stops giving. */
  maxPull?: number;
  /** Speed the band adds on release, in pixels per second. */
  launchSpeed?: number;
  /** Bounce of the return spring. 0 stops dead. */
  recoil?: number;
  /** How far the lead particle flies, in pixels. */
  flight?: number;
  /** How many particles a launch throws. 0 is none. */
  particles?: number;
  /** Cone the burst fans across, in degrees. */
  spread?: number;
  /** Free pull, or one axis with a little give across it. */
  axis?: SlingButtonAxis;
  /** Whether a plain tap sends. Enter always does. */
  tapSends?: boolean;
  /** Dims the pad and ignores input. */
  disabled?: boolean;
  /** Accessible name of the button. */
  ariaLabel?: string;
  /** Additional classes on the root element. */
  class?: string;
}

/** Internal drag state while the pad is held. */
export interface SlingButtonGrip {
  id: number;
  startX: number;
  startY: number;
  scale: number;
  moved: boolean;
  hist: SlingButtonSample[];
  rawOrigin: { x: number; y: number };
  slop: number;
}

/** One pointer sample used for release velocity. */
export interface SlingButtonSample {
  x: number;
  y: number;
  t: number;
}
