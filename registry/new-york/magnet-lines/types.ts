export type MagnetLinesMode = 'orbit' | 'attract' | 'spiral' | 'dipole';

export type MagnetLinesShape = 'line' | 'arrow' | 'needle';

export interface MagnetLinesProps {
  /** Distance between lines in px. The grid fills the area with as many lines as fit. */
  spacing?: number;
  /** Exact number of rows. Overrides spacing. */
  rows?: number;
  /** Exact number of columns. Overrides spacing. */
  columns?: number;
  /** Draws a square field of this width instead of filling the parent. Numbers are px; strings take any CSS length. */
  containerSize?: number | string;
  /** Color of the lines. */
  lineColor?: string;
  /** Color lines take on near the cursor. Compass needles use it for their north half. */
  accentColor?: string;
  /** Thickness of each line. Numbers are px; strings take any CSS length. */
  lineWidth?: number | string;
  /** Length of each line. Numbers are px; strings take any CSS length. */
  lineHeight?: number | string;
  /** Resting angle in degrees, used before the intro and outside the reach. */
  baseAngle?: number;
  /** Shape of the field around the cursor. */
  mode?: MagnetLinesMode;
  /** Rounded bar, arrow or two-tone compass needle. */
  shape?: MagnetLinesShape;
  /** Colors every line by the direction it points. */
  rainbow?: boolean;
  /** Size of the bright, stretched area around the cursor in px. */
  radius?: number;
  /** How much lines dim away from the cursor, 0 to 1. */
  fade?: number;
  /** Fades the edges into the page, 0 to 1. */
  edgeFade?: number;
  /** How much lines grow near the cursor, 0 to 2. */
  stretch?: number;
  /** Distance in px within which lines follow the cursor. 0 means every line follows. */
  reach?: number;
  /** Randomizes the resting angle of each line, 0 to 1. */
  scatter?: number;
  /** How slowly the lines swing into place, 0 to 1. 0 snaps them. */
  inertia?: number;
  /** How much the lines overshoot as they settle, 0 to 1. */
  bounce?: number;
  /** Delays lines by their distance from the cursor so movement ripples outward, 0 to 1. */
  ripple?: number;
  /** Clicking sends a ring that spins the lines as it travels outward. */
  clickPulse?: boolean;
  /** Lines fade in from the center and swing into place on mount. */
  intro?: boolean;
  /** Moves the field on its own when the cursor is away. */
  idle?: boolean;
  /** 3D tilt around the horizontal axis in degrees. */
  tiltX?: number;
  /** 3D tilt around the vertical axis in degrees. */
  tiltY?: number;
  /** Highest pixel ratio the canvas renders at. */
  maxDevicePixelRatio?: number;
  class?: string;
}

export type MagnetLinesRgb = [number, number, number];

export type MagnetLinesMat3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface MagnetLinesSettings {
  square: boolean;
  spacing: number;
  rows: number;
  columns: number;
  lineWidth: number | string;
  lineHeight: number | string;
  baseAngle: number;
  mode: MagnetLinesMode;
  shape: MagnetLinesShape;
  color: MagnetLinesRgb;
  accent: MagnetLinesRgb;
  accentMix: number;
  rainbow: boolean;
  tone: number;
  radius: number;
  fade: number;
  edgeFade: number;
  stretch: number;
  reach: number;
  scatter: number;
  inertia: number;
  bounce: number;
  ripple: number;
  clickPulse: boolean;
  idle: boolean;
  tiltX: number;
  tiltY: number;
  maxRatio: number;
}

export interface MagnetLinesView {
  forward: MagnetLinesMat3;
  inverse: MagnetLinesMat3;
  minScale: number;
  maxScale: number;
}

export interface MagnetLinesField {
  width: number;
  height: number;
  pad: number;
  ratio: number;
  view: MagnetLinesView | null;
  length: number;
  thickness: number;
  fill: boolean;
  edgePad: number;
  minScale: number;
  maxScale: number;
  introSpeed: number;
  bounds: [number, number, number, number];
  key: string;
}

export interface MagnetLinesRange {
  fromColumn: number;
  toColumn: number;
  fromRow: number;
  toRow: number;
}

export interface MagnetLinesCandidate {
  x: number;
  y: number;
  column: number;
  row: number;
  w: number;
  distance: number;
}

export interface MagnetLinesPulse {
  x: number;
  y: number;
  start: number;
  life: number;
}

export interface MagnetLinesEngineOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  probe: HTMLElement;
  getSettings: () => MagnetLinesSettings;
  intro: boolean;
  reduce: boolean;
  onRestored: () => void;
}

export interface MagnetLinesEngine {
  refresh: () => void;
  pointerMove: (clientX: number, clientY: number) => void;
  pointerDown: (clientX: number, clientY: number) => void;
  pointerLeave: () => void;
  setVisible: (visible: boolean) => void;
  visibilityChanged: () => void;
  dispose: () => void;
}
