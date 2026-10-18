export type ShapeGridShape =
  | 'square'
  | 'tile'
  | 'hexagon'
  | 'triangle'
  | 'diamond'
  | 'circle'
  | 'cross'
  | 'dot';

export type ShapeGridDirection =
  | 'diagonal'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'none';

export interface ShapeGridProps {
  /** Shape of the cells. Cross and dot draw markers where the grid lines would meet. */
  shape?: ShapeGridShape;
  /** Size of each cell, in px. */
  cellSize?: number;
  /** Thickness of the grid lines, in px. */
  lineWidth?: number;
  /** Which way the grid drifts. `'none'` holds it still. */
  direction?: ShapeGridDirection;
  /** How fast the grid drifts. */
  speed?: number;
  /** Color of the grid lines. */
  lineColor?: string;
  /** Color the cell borders light up in under the cursor. */
  hoverColor?: string;
  /** Color that fills the inside of lit cells. Follows `hoverColor` when not set. */
  hoverFillColor?: string;
  /** How solid the inside of lit cells gets, from 0 (outlines only) to 1 (solid cells). */
  fillOpacity?: number;
  /** Lights cells in shifting rainbow colors instead of the hover color. */
  rainbow?: boolean;
  /** Tilts the grid back in perspective, in degrees. Positive values push the top away. */
  tiltX?: number;
  /** Turns the grid sideways in perspective, in degrees. Positive values push the right side away. */
  tiltY?: number;
  /** Size of the light around the cursor, in cells. 0 lights only the cell under it. */
  radius?: number;
  /** How long lit cells take to fade after the cursor moves on, in seconds. */
  trail?: number;
  /** Soft glow around lit cells, from 0 to 1. */
  glow?: number;
  /** Lets random cells light up on their own now and then, from 0 to 1. */
  twinkle?: number;
  /** Fades the grid out toward the edges, from 0 to 1. */
  fade?: number;
  /** Clicking sends a ring of lit cells rolling out across the grid. */
  clickCascade?: boolean;
  /** Draws the grid in from the middle when it first appears. */
  intro?: boolean;
  /** Opacity of the whole grid. */
  opacity?: number;
  /** Color behind the grid. The canvas is transparent by default. */
  backgroundColor?: string;
  /** Freezes the drift and the lights. */
  paused?: boolean;
  /** Device pixel ratio for the canvas. Defaults to the screen's, capped at 2. */
  dpr?: number;
  class?: string;
}

export interface ShapeGridSettings {
  shape: ShapeGridShape;
  cellSize: number;
  lineWidth: number;
  direction: ShapeGridDirection;
  speed: number;
  lineColor: string;
  hoverColor: string;
  hoverFillColor: string;
  fillOpacity: number;
  rainbow: boolean;
  tone: number;
  tiltX: number;
  tiltY: number;
  radius: number;
  trail: number;
  glow: number;
  twinkle: number;
  clickCascade: boolean;
  intro: boolean;
  paused: boolean;
  dpr: number | undefined;
}

/** Row-major 3×3 homography. */
export type ShapeGridMatrix = [
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

export interface ShapeGridView {
  x0: number;
  y0: number;
  width: number;
  height: number;
  inverse: ShapeGridMatrix | null;
  transform: string;
  mist: [number, number, number, number] | null;
  far: number;
  reach: number;
}

export interface ShapeGridLayout {
  stepX: number;
  stepY: number;
  radius: number;
  side: number;
}

export interface ShapeGridCascade {
  x: number;
  y: number;
  time: number;
  power: number;
  reach: number;
  hue: number;
}

export interface ShapeGridEngineOptions {
  getSettings: () => ShapeGridSettings;
  reducedMotion: boolean;
}

export interface ShapeGridEngine {
  redraw: () => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  leave: () => void;
  dispose: () => void;
}

export interface ShapeGridPresetColors {
  lineColor: string;
  hoverColor: string;
  hoverFillColor: string;
}

export interface ShapeGridLook extends ShapeGridPresetColors {
  shape: ShapeGridShape;
  direction: ShapeGridDirection;
  fillOpacity: number;
  rainbow: boolean;
  cellSize: number;
  lineWidth: number;
  speed: number;
  tiltX: number;
  tiltY: number;
  radius: number;
  trail: number;
  glow: number;
  twinkle: number;
  fade: number;
  clickCascade: boolean;
  intro: boolean;
}

export interface ShapeGridPreset {
  look: ShapeGridLook;
  light: ShapeGridPresetColors;
}
