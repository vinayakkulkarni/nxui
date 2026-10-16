export type LatticeStatus = 'working' | 'done' | 'error';

export type LatticePatternName =
  | 'arrow'
  | 'dots'
  | 'orbit'
  | 'ripple'
  | 'snake'
  | 'spiral'
  | 'sweep'
  | 'spin'
  | 'rain'
  | 'pulse';

export type LatticeGrid = 3 | 4;

export type LatticeShape = 'square' | 'round';

export interface LatticePattern {
  /** One wave step per cell (row-major). `null` leaves a hole. */
  cells: (number | null)[];
  /** Cycle length in steps. Defaults to the highest step plus 4.2. */
  loop?: number;
  /** Multiplies `step` for this pattern. */
  scale?: number;
  /** Share of the cycle a cell stays lit. */
  lit?: 0.25 | 0.35 | 0.45 | 0.62;
}

export interface LatticeResolvedPattern {
  cells: (number | null)[];
  loop: number;
  scale: number;
  lit?: number;
}

export interface LatticeLoaderProps {
  /** Text while working. */
  label?: string;
  /** Text once done; the time follows it. */
  doneLabel?: string;
  /** Text on error; the time follows it. */
  errorLabel?: string;
  /** Working runs the wave and the clock. Done and error stop both and show a mark. */
  status?: LatticeStatus;
  /** A named wave or your own `{ cells, loop, scale, lit }`. */
  pattern?: LatticePatternName | LatticePattern;
  /** 3 × 3 or 4 × 4 cells. */
  grid?: LatticeGrid;
  /** Square or round cells. */
  shape?: LatticeShape;
  /** Ink for the cells and the text. */
  color?: string;
  /** The tick on done. */
  doneColor?: string;
  /** The cross on error. */
  errorColor?: string;
  /** Cell size in px. */
  cellSize?: number;
  /** Gap between cells in px. */
  gap?: number;
  /** Text size in px. */
  fontSize?: number;
  /** Milliseconds between wave steps. */
  step?: number;
  /** Opacity of an unlit cell. */
  idleOpacity?: number;
  /** A soft halo around each cell. */
  glow?: boolean;
  /** Halo colour. Empty uses the cell colour. */
  glowColor?: string;
  /** Shows the stopwatch. */
  showTimer?: boolean;
  /** Seconds to show instead of the internal clock. */
  elapsed?: number;
  class?: string;
}
