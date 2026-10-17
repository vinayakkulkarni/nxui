export type GridDistortionMode = 'drag' | 'push' | 'swirl';

export interface GridDistortionProps {
  /** Image to distort. It covers the container. */
  imageSrc?: string;
  /** Number of cells across. Rows follow the container so cells stay square. */
  grid?: number;
  /** Reach of the pointer as a fraction of the container width. */
  radius?: number;
  /** How far the pointer throws the cells. 0 turns the pointer off. */
  strength?: number;
  /** How much displacement each cell keeps per frame. */
  relaxation?: number;
  /** Drag pulls cells along, push throws them outward, swirl spins them. */
  mode?: GridDistortionMode;
  /** Blends the crisp blocks into a smooth liquid warp, from 0 to 1. */
  softness?: number;
  /** Splits the color channels on displaced cells, from 0 to 1. */
  chroma?: number;
  /** A slow wandering distortion while the pointer rests. 0 turns it off. */
  idle?: number;
  /** Sends a ring of displaced cells out from every click. */
  clickRipple?: boolean;
  /** Scrambles the cells when the image loads and lets them settle. */
  intro?: boolean;
  class?: string;
}

export interface GridDistortionSettings {
  grid: number;
  radius: number;
  strength: number;
  relaxation: number;
  mode: GridDistortionMode;
  softness: number;
  chroma: number;
  idle: number;
  clickRipple: boolean;
  intro: boolean;
  reduce: boolean;
}

export interface GridDistortionEngine {
  load: (src: string | undefined) => void;
  wake: () => void;
  resize: () => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  destroy: () => void;
}
