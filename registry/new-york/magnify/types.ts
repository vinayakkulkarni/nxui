export type MagnifyTheme = 'light' | 'dark';

export interface MagnifyPoint {
  x: number;
  y: number;
}

export interface MagnifyColors {
  paper: string;
  ink: string;
}

export interface MagnifyProps {
  theme?: MagnifyTheme;
  /** The big letter on the poster. */
  glyph?: string;
  /** The tiny characters it is printed from, seen through the lens. */
  micro?: string;
  /** Magnification at rest. */
  zoom?: number;
  /** Magnification after a click or Enter. */
  zoomMax?: number;
  /** The glass's radius, in poster units (the poster is 500 wide). */
  lensRadius?: number;
  /** The poster's width in px; it never grows past its container. */
  size?: number;
  /** The outline trace and the lens dropping in on arrival. */
  intro?: boolean;
  /** The "Move to inspect" line under the poster. */
  hint?: boolean;
  class?: string;
}

export interface MagnifyMicroProps {
  glyph: string;
  micro: string;
  ink: string;
  paper: string;
  clipId: string;
}

/** Imperative hooks, so a host (e.g. an idle demo) can drive the lens. */
export interface MagnifyExpose {
  /** Move the lens to a point in poster units (500 × 680). */
  moveTo: (x: number, y: number) => void;
  /** Set the zoom state. */
  setZoomed: (zoomed: boolean) => void;
  /** Toggle between the rest zoom and the max zoom. */
  toggleZoom: () => void;
  /** Put the lens back at rest and drop the zoom. */
  rest: () => void;
}
