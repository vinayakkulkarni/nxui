/**
 * Props for the CometDial registry component.
 */
export interface CometDialProps {
  /** Controlled value (v-model). A change from outside launches the reading on the tap spring. */
  modelValue?: number;
  /** Initial value when uncontrolled. */
  defaultValue?: number;
  /** Lowest value. */
  min?: number;
  /** Highest value. */
  max?: number;
  /** Snapping grid, and the keyboard nudge. */
  step?: number;
  /** Suffix after the figure. Empty hides it. */
  unit?: string;
  /** Accessible name of the slider. */
  label?: string;
  /** The lit arc, the bead and the comet. */
  accent?: string;
  /** The track and the readout. */
  ink?: string;
  /** Diameter in pixels. Everything inside scales with it. */
  size?: number;
  /** Degrees the arc covers, with the gap centred at the bottom. */
  sweep?: number;
  /** Stroke width of the track and the arc. The bead follows it. */
  thickness?: number;
  /** How quickly the reading arrives, 0 to 100. */
  speed?: number;
  /** Ring-down after a tap. 0 stops dead. */
  tapBounce?: number;
  /** Ring-down after a full-speed flick. */
  flickBounce?: number;
  /** How far a flick carries the reading past where you let go. */
  momentum?: number;
  /** Degrees of trail behind the bead at full speed. */
  cometReach?: number;
  /** Extra stroke width at the head of the trail at full speed. */
  cometWidth?: number;
  /** Dims the dial and ignores input. */
  disabled?: boolean;
  /** Additional classes on the root element. */
  class?: string;
}

/** Detail passed with `change-end`. */
export interface CometDialChangeEndDetail {
  /** Release velocity in value units per second. */
  velocity: number;
  /** Bounce the release earned. */
  bounce: number;
}

/** Internal drag state while the ring is held. */
export interface CometDialGrip {
  id: number;
  at: number | null;
  hist: Array<[number, number]>;
  side: 'lo' | 'hi' | null;
  moved: boolean;
  x0: number;
  y0: number;
}
