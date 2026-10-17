/** Lifecycle state reported through the `state-change` event. */
export type PaperCrumpleState = 'flat' | 'holding' | 'crumpled' | 'creased';

/** What the sheet does when the hold ends. */
export type PaperCrumpleRelease = 'stay' | 'restore' | 'creased';

/** How the image texture is fitted onto the sheet. */
export type PaperCrumpleImageFit = 'cover' | 'contain';

/** Loading state of the WebGL scene. */
export type PaperCrumpleStatus = 'loading' | 'ready' | 'error';

/**
 * Props for the PaperCrumple registry component.
 */
export interface PaperCrumpleProps {
  /** Image URL. PNG transparency is kept. Remote hosts must allow CORS. */
  src: string;
  /** Image description for the fallback image and the hold control. */
  alt?: string;
  /** Optional image printed on the back. Otherwise the back uses `paperColor`. */
  backSrc?: string;
  /** Unfolded paper width in px. Scales down to fit the stage with a 24px inset. */
  width?: number;
  /** Unfolded paper height in px. Sets the sheet aspect ratio. */
  height?: number;
  /** Stage height in px, including room to drag. */
  sceneHeight?: number;
  /** `cover` crops the texture; `contain` keeps the whole image. */
  imageFit?: PaperCrumpleImageFit;
  /** Freeze the crumple, unfold fully, or unfold with lasting creases. */
  releaseBehavior?: PaperCrumpleRelease;
  /** Maximum fold amount while held, 0 (flat) to 1 (fully crumpled). */
  crumpleAmount?: number;
  /** Approximate settling time in seconds while holding. */
  crumpleDuration?: number;
  /** Approximate unfolding time in seconds. */
  releaseDuration?: number;
  /** Number of crease guides in the paper solver, 3 to 16. */
  foldCount?: number;
  /** Blend from rounded wrinkles (0) to angular creases (1). */
  foldSharpness?: number;
  /** Compression depth, 0 to 2. */
  wrinkleDepth?: number;
  /** Residual relief, 0 to 1, for the `creased` release mode. */
  creaseStrength?: number;
  /** Color of the unprinted back of the sheet. */
  paperColor?: string;
  /** Material roughness, 0 (smooth) to 1 (matte). */
  roughness?: number;
  /** Paper-grain bump strength, 0 to 1. */
  paperTexture?: number;
  /** Directional light strength. */
  lightIntensity?: number;
  /** Key light direction in degrees. 0 shines from above. */
  lightAngle?: number;
  /** Self-shadowing plus a soft drop shadow. */
  shadow?: boolean;
  /** Opacity of the cast and drop shadows, 0 to 1. */
  shadowOpacity?: number;
  /** Move the sheet while held. */
  draggable?: boolean;
  /** Maximum tilt in degrees while dragging. */
  dragRotation?: number;
  /** Maximum resting offset on each axis, in px. */
  dragRadius?: number;
  /** `restore` and `creased` return the sheet to the center. */
  returnToOrigin?: boolean;
  /** Initial sheet rotation in degrees. */
  rotation?: number;
  /** Seed for a repeatable fold and grain arrangement. */
  seed?: number;
  /** Simulation detail. Higher values add smaller folds. */
  detail?: number;
  /** Disable input and finish any active hold. */
  disabled?: boolean;
  /** Change this value to reset position, crumple and creases. */
  resetKey?: number | string;
  /** Extra classes for the stage. */
  class?: string;
}

/** Live options the engine reads on every frame. */
export interface PaperCrumpleLiveOptions {
  releaseBehavior: PaperCrumpleRelease;
  crumpleAmount: number;
  crumpleDuration: number;
  releaseDuration: number;
  creaseStrength: number;
  draggable: boolean;
  dragRotation: number;
  dragRadius: number;
  returnToOrigin: boolean;
  disabled: boolean;
  reduceMotion: boolean;
}

/** Structural options; a change rebuilds the scene. */
export interface PaperCrumpleSceneOptions {
  src: string;
  backSrc: string;
  width: number;
  height: number;
  imageFit: PaperCrumpleImageFit;
  foldCount: number;
  foldSharpness: number;
  wrinkleDepth: number;
  paperColor: string;
  roughness: number;
  paperTexture: number;
  lightIntensity: number;
  lightAngle: number;
  shadow: boolean;
  shadowOpacity: number;
  rotation: number;
  seed: number;
  detail: number;
}

/** Elements and callbacks handed to the engine. */
export interface PaperCrumpleEngineContext {
  root: HTMLDivElement;
  canvas: HTMLCanvasElement;
  hit: HTMLButtonElement;
  scene: PaperCrumpleSceneOptions;
  live: () => PaperCrumpleLiveOptions;
  onStatus: (status: PaperCrumpleStatus) => void;
  onState: (state: PaperCrumpleState) => void;
  onError: (error: Error) => void;
}

/** Imperative handle returned by the engine. */
export interface PaperCrumpleEngine {
  resize: () => void;
  setInView: (visible: boolean) => void;
  setHidden: (hidden: boolean) => void;
  motionChange: () => void;
  reset: () => void;
  cancel: () => void;
  pointerDown: (event: PointerEvent) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  pointerCancel: (event: PointerEvent) => void;
  keyDown: (event: KeyboardEvent) => void;
  keyUp: (event: KeyboardEvent) => void;
  blur: () => void;
  contextLost: (event: Event) => void;
  contextRestored: () => void;
  dispose: () => void;
}

/** Spring state used by the critically damped integrator. */
export interface PaperSpring {
  value: number;
  target: number;
  velocity: number;
}

/** Precomputed crumple animation: per-frame vertex samples plus the creased rest pose. */
export interface PaperPath {
  samples: Float32Array[];
  creased: Float32Array;
}
