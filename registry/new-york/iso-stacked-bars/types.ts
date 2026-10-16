/** Which row of the floor plate a series stacks in. */
export type IsoStackedBarsRow = 'back' | 'front';

/** Fine texture drawn over every face of a series' boxes. */
export type IsoStackedBarsTexture = 'stripes' | 'dots' | 'grid' | 'none';

export interface IsoStackedBarsSeries {
  /** Field in each datum's `values`. */
  key: string;
  label: string;
  /** Any CSS color. Faces are shaded from it with `color-mix()`. */
  color: string;
  /** `back` for the tall bars, `front` for the short bars. */
  row: IsoStackedBarsRow;
  texture?: IsoStackedBarsTexture;
}

export interface IsoStackedBarsDatum {
  /** Category label, e.g. a date. Shown in the tooltip. */
  label: string;
  /** Value per series key. Missing keys count as 0. */
  values: Record<string, number>;
}

export interface IsoStackedBarsProps {
  /** Series in stacking order, bottom first. */
  series: IsoStackedBarsSeries[];
  data: IsoStackedBarsDatum[];
  title?: string;
  subtitle?: string;
  /** Headline number. Defaults to the sum of every back-row value. */
  total?: number;
  unit?: string;
  /** Accent text on the right of the headline, e.g. `scrap 2.4 %`. */
  note?: string;
  /** Height of the tallest front bar relative to the tallest back bar. */
  frontScale?: number;
  /** Grow the bars from the floor when the chart scrolls into view. */
  animate?: boolean;
  ariaLabel?: string;
  class?: string;
}

/** A point in SVG user space. */
export interface IsoPoint {
  x: number;
  y: number;
}

/** An axis-aligned box in world units: x along the categories, y toward the viewer, z up. */
export interface IsoBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}

/** SVG `points` strings for the three visible faces of a box. */
export interface IsoFaces {
  top: string;
  left: string;
  right: string;
}

export interface IsoFaceFills {
  top: string;
  left: string;
  right: string;
}

export interface IsoViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IsoFloor {
  plate: string;
  lines: IsoLine[];
}

export interface IsoLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface IsoSegment {
  key: string;
  label: string;
  value: number;
  faces: IsoFaces;
  fills: IsoFaceFills;
  texture: IsoStackedBarsTexture;
}

export interface IsoBar {
  id: string;
  row: IsoStackedBarsRow;
  index: number;
  label: string;
  total: number;
  segments: IsoSegment[];
  /** Center of the top face, where the tooltip points. */
  anchor: IsoPoint;
  ariaLabel: string;
}

export interface IsoBarRef {
  row: IsoStackedBarsRow;
  index: number;
}

export interface IsoActive extends IsoBarRef {
  /** Hovered segment, or null when the whole bar is active (keyboard focus). */
  series: string | null;
}
