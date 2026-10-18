export type GridScanLineStyle = 'solid' | 'dashed' | 'dotted';

export type GridScanDirection = 'forward' | 'backward' | 'pingpong';

export type GridScanClickEffect = 'ping' | 'scan' | 'none';

export type GridScanStatus = 'loading' | 'searching' | 'tracking' | 'blocked';

export type GridScanPreset =
  | 'scan'
  | 'laser'
  | 'lidar'
  | 'blueprint'
  | 'deep'
  | 'wire'
  | 'pulse';

export interface GridScanProps {
  /** Color of the grid lines. Defaults to `#4d4757`, or a pale gray in light mode. */
  linesColor?: string;
  /** Color of the scan, its trail, the points and the click ping. Defaults to `#7dd3fc`, or a deeper blue in light mode. */
  scanColor?: string;
  /** Number of grid cells from the floor to the ceiling (2–40). */
  cells?: number;
  /** Thickness of the grid lines in pixels (0.5–4). */
  lineThickness?: number;
  /** Style of the grid lines. */
  lineStyle?: GridScanLineStyle;
  /** How deep the room goes, relative to its height (0.5–12). */
  depth?: number;
  /** How much the room fades into the distance, from 0 to 1. */
  depthFade?: number;
  /** How far the view shifts as the cursor moves (0–3). 0 keeps it still. */
  parallax?: number;
  /** Scatters points over the walls that sparkle as the scan passes. */
  points?: boolean;
  /** How much the glossy floor reflects the scan and pings, from 0 to 1. */
  reflection?: number;
  /** Soft light and corner shadows on the walls, from 0 (pure wireframe) to 1. */
  shading?: number;
  /** Whether the scan travels into the room, out of it, or alternates. */
  scanDirection?: GridScanDirection;
  /** Seconds each scan takes to cross the room. */
  scanDuration?: number;
  /** Seconds between scans. */
  scanDelay?: number;
  /** Thickness of the scan line, from 0.2 to 5. */
  scanWidth?: number;
  /** How long the walls keep glowing behind the scan, from 0 to 1. */
  trail?: number;
  /** Bloom around the scan line and points, from 0 to 1.5. */
  glow?: number;
  /** Runs scans on a loop. Turn it off to scan only on click. */
  autoScan?: boolean;
  /** Moves the view with the cursor and lights up the walls under it. */
  interactive?: boolean;
  /** What a click does: send a ping across the walls, start a new scan, or nothing. */
  clickEffect?: GridScanClickEffect;
  /** Moves the view with your head through the webcam. The face tracker loads from a CDN the first time. */
  enableWebcam?: boolean;
  /** Shows a small camera preview with the tracking status while the webcam is on. */
  showPreview?: boolean;
  /** Where the face tracking model is loaded from. */
  modelsPath?: string;
  /** Moves the view as a phone or tablet tilts. iOS asks for permission on the first tap. */
  enableGyro?: boolean;
  /** Reveals the room with a first scan on mount. */
  intro?: boolean;
  /** Renders a bright room with dark shading for light backgrounds. */
  lightMode?: boolean;
  /** Maximum device pixel ratio, capped at 2. Defaults to the screen's ratio. */
  dpr?: number;
  class?: string;
}

/** Clamped, resolved settings read by the renderer every frame. */
export interface GridScanSettings {
  linesColor: string;
  scanColor: string;
  cells: number;
  thickness: number;
  style: number;
  depth: number;
  depthFade: number;
  parallax: number;
  points: boolean;
  reflection: number;
  shading: number;
  direction: GridScanDirection;
  duration: number;
  delay: number;
  scanWidth: number;
  trail: number;
  glow: number;
  autoScan: boolean;
  interactive: boolean;
  clickEffect: GridScanClickEffect;
  enableGyro: boolean;
  intro: boolean;
  lightMode: boolean;
  dpr: number | undefined;
}

/** The visual props a demo preset sets. */
export interface GridScanLook {
  linesColor: string;
  scanColor: string;
  cells: number;
  lineThickness: number;
  lineStyle: GridScanLineStyle;
  depth: number;
  depthFade: number;
  shading: number;
  reflection: number;
  points: boolean;
  scanDirection: GridScanDirection;
  scanDuration: number;
  scanDelay: number;
  scanWidth: number;
  trail: number;
  glow: number;
}

export interface GridScanPointer {
  u: number;
  v: number;
  inside: boolean;
}

export interface GridScanEngine {
  /** Advances one frame. Returns false once nothing is moving, so the loop can stop. */
  frame: (now: number) => boolean;
  resize: (width: number, height: number) => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (pointer: GridScanPointer) => void;
  pointerDown: (pointer: GridScanPointer) => void;
  pointerLeave: () => void;
  orientation: (gamma: number | null, beta: number | null) => void;
  /** Head tracking: normalized face position and a closeness factor. */
  headMove: (nx: number, ny: number, near: number) => void;
  headRelease: () => void;
  setHeadActive: (active: boolean) => void;
  isHeadActive: () => boolean;
  resetClock: () => void;
  dispose: () => void;
}

export interface FaceApiBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceApiDetection {
  box: FaceApiBox;
}

export interface FaceApi {
  nets: { tinyFaceDetector: { loadFromUri: (uri: string) => Promise<void> } };
  TinyFaceDetectorOptions: new (options: {
    inputSize: number;
    scoreThreshold: number;
  }) => object;
  detectSingleFace: (
    input: HTMLVideoElement,
    options: object,
  ) => PromiseLike<FaceApiDetection | undefined | null>;
}
