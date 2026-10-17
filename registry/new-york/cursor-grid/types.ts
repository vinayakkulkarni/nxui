import type { StyleValue } from 'vue';

export type CursorGridFalloff = 'linear' | 'smooth' | 'sharp';
export type CursorGridHighlight = 'area' | 'cell';
export type CursorGridStyle = 'lines' | 'dashed' | 'dots' | 'crosses';

export interface CursorGridProps {
  /** Size of each grid cell, in px. */
  cellSize?: number;
  /** Color of lit cells and pulses. Defaults to white, or near black in light mode. */
  color?: string;
  /** Color of the grid lines. Defaults to white, or near black in light mode. */
  gridColor?: string;
  /** Reach of the cursor, in px, for the lit area and the spotlight. */
  radius?: number;
  /** How quickly cells dim toward the edge of the radius. */
  falloff?: CursorGridFalloff;
  /** Light every cell within the radius, or only the cell under the cursor. */
  highlight?: CursorGridHighlight;
  /** How long a cell stays lit before it fades, in ms. */
  holdTime?: number;
  /** How long a lit cell takes to fade out, in ms. */
  fadeDuration?: number;
  /** Width of the grid lines, in px. */
  lineWidth?: number;
  /** Brightness of a fully lit cell outline. */
  maxOpacity?: number;
  /** Soft fill inside lit cells. */
  fillOpacity?: number;
  /** Opacity of the grid lines at rest. */
  gridOpacity?: number;
  /** How the grid is drawn. */
  gridStyle?: CursorGridStyle;
  /** Corner radius of lit tiles, in px. */
  cellRadius?: number;
  /** Inset of lit cells, in px. Above 0, lit cells become separate tiles. */
  cellGap?: number;
  /** How much the grid lines brighten around the cursor, 0 to 1. */
  spotlight?: number;
  /** Clicking sends a ring of lit cells out from the click. */
  clickPulse?: boolean;
  /** Speed of the click ring, in px per second. */
  pulseSpeed?: number;
  /** Lets random cells glow softly on their own, 0 to 1. */
  ambient?: number;
  /** Fades the grid out toward the edges, 0 to 0.5. */
  edgeFade?: number;
  /** Draws the grid out from the center with a pulse on mount. */
  intro?: boolean;
  /** Uses near black lines and cells by default, for light pages. */
  lightMode?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
  style?: StyleValue;
}

export interface CursorGridSettings {
  cellSize: number;
  color: string;
  gridColor: string;
  radius: number;
  falloff: CursorGridFalloff;
  highlight: CursorGridHighlight;
  holdTime: number;
  fadeDuration: number;
  lineWidth: number;
  maxOpacity: number;
  fillOpacity: number;
  gridOpacity: number;
  gridStyle: number;
  cellRadius: number;
  cellGap: number;
  spotlight: number;
  clickPulse: boolean;
  pulseSpeed: number;
  ambient: number;
  edgeFade: number;
  intro: boolean;
  dpr?: number;
}

export interface CursorGridPulse {
  x: number;
  y: number;
  t0: number;
  strength: number;
}

export interface CursorGridProgram {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
}

export type CursorGridPreset =
  | 'minimal'
  | 'cell'
  | 'tiles'
  | 'marks'
  | 'dots'
  | 'dashed'
  | 'classic';

export type CursorGridLook = Required<
  Pick<
    CursorGridProps,
    | 'color'
    | 'gridColor'
    | 'highlight'
    | 'gridStyle'
    | 'falloff'
    | 'cellSize'
    | 'radius'
    | 'holdTime'
    | 'fadeDuration'
    | 'lineWidth'
    | 'maxOpacity'
    | 'fillOpacity'
    | 'gridOpacity'
    | 'spotlight'
    | 'cellGap'
    | 'cellRadius'
    | 'pulseSpeed'
    | 'ambient'
    | 'edgeFade'
  >
>;
