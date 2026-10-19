/** Where the pairing flow is. */
export type DevicePairingStatus = 'idle' | 'pairing' | 'paired' | 'error';

/** A point in scene units: x along the plate, y towards the viewer, z up. */
export type IsoPoint = [x: number, y: number, z: number];

/** Flat shapes of the illustration, ready for SVG. */
export interface DevicePairingGeometry {
  viewBox: string;
  /** Filled outlines drawn back to front. */
  faces: string[];
  /** Extra detail strokes. */
  lines: string[];
  /** Path of the cable between the boxes. */
  cable: string;
  /** Screen outline on the battery. */
  screen: string;
  /** Centre of the screen. */
  screenCenter: [number, number];
  /** Unit vector along the screen's long edge. */
  screenAxis: [number, number];
  /** Top of the battery, where the pairing rings start. */
  beacon: [number, number];
}

/** One step in the progress row. */
export interface DevicePairingStep {
  label: string;
}

export interface DevicePairingProps {
  /** Typed code, digits only. Use `v-model`. */
  modelValue?: string;
  /** Pairing state. Use `v-model:status`. */
  status?: DevicePairingStatus;
  /** Number of digits in the code. */
  length?: number;
  title?: string;
  /** Header subtitle before pairing. */
  subtitle?: string;
  /** Header subtitle after pairing. */
  pairedSubtitle?: string;
  /** Devices already paired. Shown in the header pill. */
  count?: number;
  /** Lucide icon name for the header chip. */
  icon?: string;
  /** Upper-left label in the stage. */
  stageLabel?: string;
  /** Upper-right label in the stage. */
  nearbyLabel?: string;
  /** Radio details in the lower-left corner of the stage. */
  channel?: string;
  heading?: string;
  /** Helper text under the heading. Use `\n` for a line break. */
  helper?: string;
  /** Seconds a code lives before the device shows a new one. */
  codeLifetime?: number;
  /** Seconds left on the current code when the component mounts. */
  codeRemaining?: number;
  /** Progress row labels. The second step is the code step. */
  steps?: DevicePairingStep[];
  /** Sets the status to `paired` on its own this many ms after Pair. `0` waits for you. */
  autoConfirm?: number;
  /** Colour of lit digits, the caret and the pairing state. */
  accent?: string;
  /** Colour of the paired state. */
  successColor?: string;
  scanLabel?: string;
  pairLabel?: string;
  class?: string;
}

/** Props of the isometric illustration. */
export interface DevicePairingSceneProps {
  status: DevicePairingStatus;
  accent: string;
  successColor: string;
  /** Lit dots on the device screen, 0 to 6. */
  progress: number;
  animate: boolean;
}

/** Props of the LCD code cells. */
export interface DevicePairingCodeProps {
  code: string;
  length: number;
  accent: string;
  focused: boolean;
  status: DevicePairingStatus;
}
