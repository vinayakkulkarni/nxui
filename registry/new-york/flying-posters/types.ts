export type FlyingPostersAxis = 'vertical' | 'horizontal' | 'diagonal';

export interface FlyingPostersItem {
  image: string;
  link?: string;
  alt?: string;
}

export type FlyingPostersEntry = string | FlyingPostersItem;

export interface FlyingPostersProps {
  /** Images for the posters. Each is cropped to fill its poster; they repeat to fill the view. */
  items?: FlyingPostersEntry[];
  /** Poster width in px at the default camera. */
  planeWidth?: number;
  /** Poster height in px at the default camera. */
  planeHeight?: number;
  /** How far one corner turns ahead of the other, which gives the twist. */
  distortion?: number;
  /** How quickly posters catch up with wheel and drag. Lower glides longer. */
  scrollEase?: number;
  /** Camera field of view in degrees. */
  cameraFov?: number;
  /** Camera distance. Higher = smaller and flatter, lower = closer with stronger perspective. */
  cameraZ?: number;
  /** Space between posters in px. Defaults to a spacing that follows the camera. */
  gap?: number;
  columns?: number;
  /** Space between columns in px. */
  columnGap?: number;
  /** Moves every other column in the opposite direction. */
  alternate?: boolean;
  /** Corner radius in px. */
  radius?: number;
  /** How far each poster turns while crossing the view, in degrees. */
  rotation?: number;
  axis?: FlyingPostersAxis;
  /** Drift in px per second while idle. Negative drifts down. */
  speed?: number;
  /** How far posters lean back with fast scrolling. */
  lean?: number;
  /** Fades posters toward the top and bottom edges, 0 to 1. */
  fade?: number;
  /** Darkens posters as they turn away, 0 to 1. */
  shading?: number;
  /** Scroll with the mouse wheel while hovered. */
  wheel?: boolean;
  /** Scroll by dragging. */
  drag?: boolean;
  /** Moves the posters with the page scroll, as a multiplier. 0 turns it off. */
  pageScroll?: number;
  class?: string;
}

export interface PosterSettings {
  planeWidth: number;
  planeHeight: number;
  distortion: number;
  scrollEase: number;
  cameraFov: number;
  cameraZ: number;
  gap: number | undefined;
  columns: number;
  columnGap: number;
  alternate: boolean;
  radius: number;
  rotation: number;
  axis: FlyingPostersAxis;
  speed: number;
  lean: number;
  fade: number;
  shading: number;
  wheel: boolean;
  drag: boolean;
  pageScroll: number;
}

export interface PosterEngineOptions {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  reduced: boolean;
  settings: () => PosterSettings;
  items: () => FlyingPostersEntry[];
  onItemClick: (item: FlyingPostersItem, index: number) => void;
}

export interface PosterEngine {
  loadItems: (list: FlyingPostersEntry[]) => void;
  wake: () => void;
  resize: () => void;
  setVisible: (visible: boolean) => void;
  wheel: (event: WheelEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  pageScroll: () => void;
  dispose: () => void;
}
