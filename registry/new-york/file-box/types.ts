import type { ComponentPublicInstance } from 'vue';

/** What a function template ref receives. */
export type FileBoxNodeRef = Element | ComponentPublicInstance | null;

export type FileBoxColor = 'green' | 'beige' | 'pink' | 'orange';

export type FileBoxTheme = 'light' | 'dark';

export interface FileBoxProps {
  theme?: FileBoxTheme;
  /** Fill the container edge to edge, with the box centred in the largest square that fits. */
  fill?: boolean;
  class?: string;
}

/** Payload of the `pull` event: the folder's colour and its place counted from the front (1–5). */
export interface FileBoxPull {
  color: FileBoxColor;
  position: number;
}

export type FileBoxPoint = [number, number];

export interface FileBoxFolderSpec {
  /** Depth into the box, 0 (front) to 1 (back). */
  d: number;
  x0: number;
  x1: number;
  h: number;
  /** Tab start and width along the folder. */
  tab: [number, number];
  c: FileBoxColor;
}

export interface FileBoxPaperView {
  sheet: string;
  fill: string;
  lines: string[];
}

export interface FileBoxFolderView {
  spec: FileBoxFolderSpec;
  /** Order back → front, 0‥4. */
  index: number;
  /** Place counted from the front, 1‥5. */
  position: number;
  color: FileBoxColor;
  plane: string;
  back: string;
  backFill: string;
  crease: string;
  papers: FileBoxPaperView[];
  flap: string;
  flapFill: string;
  flapHi: string;
  occY: number;
  hitBase: string;
  hitExtend: string;
  label: string;
}

export interface FileBoxSceneView {
  base: string;
  hollowBack: string;
  hollowSide: string;
  rimBack: string;
  faceSide: string;
  faceFront: string;
  rimFront: string;
  hole: string;
  folders: FileBoxFolderView[];
}

export type FileBoxChannel = 'x' | 'y' | 'rotate' | 'scale' | 'sy' | 'opacity';

/** A target per channel: one value, or keyframes where `null` means "from where it is". */
export type FileBoxTargets = Partial<
  Record<FileBoxChannel, number | Array<number | null>>
>;

export interface FileBoxSpring {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass?: number;
  delay?: number;
}

export interface FileBoxTween {
  duration: number;
  ease?: [number, number, number, number] | 'easeInOut';
  delay?: number;
}

export type FileBoxMotion = FileBoxSpring | FileBoxTween;

/** The live SVG nodes of one folder, handed to the motion engine. */
export interface FileBoxFolderNodes {
  view: FileBoxFolderView;
  g: SVGGElement;
  front: SVGGElement;
  papers: SVGGElement[];
  occ: SVGGElement;
  extend: SVGPathElement;
}

export interface FileBoxNodes {
  poster: HTMLElement;
  scene: SVGGElement;
  shadow: SVGGElement;
  boxBack: SVGGElement;
  boxFront: SVGGElement;
  folders: FileBoxFolderNodes[];
}

export interface FileBoxEngineOptions {
  reduced: boolean;
  onReady: () => void;
  onPull: (pull: FileBoxPull) => void;
}

export interface FileBoxEngine {
  intro: () => void;
  /** Lift a folder (index back → front), or drop them all with `null`. `auto` marks a host-driven hover. */
  hover: (index: number | null, auto?: boolean) => void;
  enter: (index: number) => void;
  leave: (index: number) => void;
  pull: (index: number) => void;
  /** Drop a folder lifted by `hover(…, true)`, leaving a real hover alone. */
  release: () => void;
  tilt: (px: number, py: number) => void;
  untilt: () => void;
  settle: () => void;
  destroy: () => void;
}
