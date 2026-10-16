export type CubesEdgeStyle = 'solid' | 'dashed' | 'dotted' | 'none';

export interface CubesProps {
  /** Number of cubes on each side of the grid. */
  gridSize?: number;
  /** Space between cubes, as a fraction of a cell. */
  gap?: number;
  /** Color of the cube faces. Match it to your page background for a clean cut-out look. */
  faceColor?: string;
  /** Color of the cube outlines. */
  edgeColor?: string;
  /** Width of the outlines in px. */
  edgeWidth?: number;
  /** How the cube outlines are drawn. */
  edgeStyle?: CubesEdgeStyle;
  /** Opacity of the faces, from 0 for see-through wireframes to 1 for solid cubes. */
  faceOpacity?: number;
  /** How much the sides of turned cubes pick up light. */
  shading?: number;
  /** How far cubes turn to face the cursor, in degrees. */
  maxAngle?: number;
  /** How far the cursor reaches, in cubes. */
  radius?: number;
  /** How quickly cubes respond. */
  speed?: number;
  /** How much cubes overshoot and wobble as they settle, from 0 to 1. */
  bounce?: number;
  /** How strongly fast cursor sweeps spin the cubes they pass over. */
  brush?: number;
  /** Camera perspective, from 0 for a flat front view to 1 for strong depth. */
  perspective?: number;
  /** Drifts a gentle wave across the grid while the cursor is away. */
  autoAnimate?: boolean;
  /** Clicking sends a ripple through the cubes that lights up their edges. */
  rippleOnClick?: boolean;
  /** Color the ripple lights the cubes with. */
  rippleColor?: string;
  /** Speed of the ripple. */
  rippleSpeed?: number;
  /** Cubes tumble into place from the center on mount. */
  intro?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. Defaults to the screen's ratio. */
  dpr?: number;
  class?: string;
}

export interface CubesSettings {
  gridSize: number;
  gap: number;
  faceColor: string;
  edgeColor: string;
  edgeWidth: number;
  edgeStyle: CubesEdgeStyle;
  faceOpacity: number;
  shading: number;
  maxAngle: number;
  radius: number;
  speed: number;
  bounce: number;
  brush: number;
  perspective: number;
  autoAnimate: boolean;
  rippleOnClick: boolean;
  rippleColor: string;
  rippleSpeed: number;
  paused: boolean;
  dpr: number | undefined;
}

export interface CubesEngineOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  getSettings: () => CubesSettings;
  intro: boolean;
  reduce: boolean;
}

export interface CubesEngine {
  /** Re-reads settings, re-renders when idle and resumes the loop. */
  refresh: () => void;
  pointerMove: (clientX: number, clientY: number) => void;
  pointerLeave: () => void;
  pointerDown: (clientX: number, clientY: number) => void;
  resize: () => void;
  setVisible: (visible: boolean) => void;
  visibilityChanged: () => void;
  dispose: () => void;
}

export interface CubesRing {
  x: number;
  y: number;
  born: number;
}
