import type {
  IsoBox,
  IsoFaceFills,
  IsoFaces,
  IsoFloor,
  IsoLine,
  IsoPoint,
  IsoStackedBarsRow,
  IsoViewBox,
} from './types';

const COS_30 = Math.cos(Math.PI / 6);
const SIN_30 = 0.5;

/** SVG user units per world unit. */
const ISO_SCALE = 46;
/** Distance between two categories along x. */
const ISO_PITCH = 1;
/** Width and depth of one bar. */
const ISO_BAR = 0.72;
/** Distance between the back and front rows along y. */
const ISO_ROW_PITCH = 1.5;
/** Height of the tallest back bar, in world units. */
export const ISO_MAX_HEIGHT = 4.4;
/** Floor plate margin around the bars. */
const ISO_FLOOR_MARGIN = 0.45;

/** Projects a world point to SVG space (classic 30° isometric). */
export function project(x: number, y: number, z: number): IsoPoint {
  return {
    x: (x - y) * COS_30 * ISO_SCALE,
    y: ((x + y) * SIN_30 - z) * ISO_SCALE,
  };
}

function toPoints(points: IsoPoint[]): string {
  return points.map((p) => `${round(p.x)},${round(p.y)}`).join(' ');
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** The three faces a viewer sees: top, left (y = y1) and right (x = x1). */
export function boxFaces(box: IsoBox): IsoFaces {
  const { x0, x1, y0, y1, z0, z1 } = box;
  return {
    top: toPoints([
      project(x0, y0, z1),
      project(x1, y0, z1),
      project(x1, y1, z1),
      project(x0, y1, z1),
    ]),
    left: toPoints([
      project(x0, y1, z0),
      project(x1, y1, z0),
      project(x1, y1, z1),
      project(x0, y1, z1),
    ]),
    right: toPoints([
      project(x1, y0, z0),
      project(x1, y1, z0),
      project(x1, y1, z1),
      project(x1, y0, z1),
    ]),
  };
}

/** Lighter top, base left, darker right — light comes from the upper left. */
export function faceFills(color: string): IsoFaceFills {
  return {
    top: `color-mix(in oklab, ${color} 72%, white)`,
    left: color,
    right: `color-mix(in oklab, ${color} 74%, black)`,
  };
}

/** World y range of a row. */
export function rowDepth(row: IsoStackedBarsRow): [number, number] {
  const y0 = row === 'back' ? 0 : ISO_ROW_PITCH;
  return [y0, y0 + ISO_BAR];
}

/** World x range of the bar at `index`. */
export function barSpan(index: number): [number, number] {
  const x0 = index * ISO_PITCH;
  return [x0, x0 + ISO_BAR];
}

function floorExtent(count: number): IsoBox {
  return {
    x0: -ISO_FLOOR_MARGIN,
    x1: Math.max(0, count - 1) * ISO_PITCH + ISO_BAR + ISO_FLOOR_MARGIN,
    y0: -ISO_FLOOR_MARGIN,
    y1: ISO_ROW_PITCH + ISO_BAR + ISO_FLOOR_MARGIN,
    z0: 0,
    z1: 0,
  };
}

function line(a: IsoPoint, b: IsoPoint): IsoLine {
  return { x1: round(a.x), y1: round(a.y), x2: round(b.x), y2: round(b.y) };
}

/** The floor plate polygon plus faint guide lines between rows and categories. */
export function floor(count: number): IsoFloor {
  const f = floorExtent(count);
  const plate = toPoints([
    project(f.x0, f.y0, 0),
    project(f.x1, f.y0, 0),
    project(f.x1, f.y1, 0),
    project(f.x0, f.y1, 0),
  ]);
  const gap = (ISO_PITCH - ISO_BAR) / 2;
  const midY = ISO_BAR + (ISO_ROW_PITCH - ISO_BAR) / 2;
  const lines: IsoLine[] = [
    line(project(f.x0, midY, 0), project(f.x1, midY, 0)),
  ];
  for (let i = 1; i < count; i++) {
    const x = i * ISO_PITCH - gap;
    lines.push(line(project(x, f.y0, 0), project(x, f.y1, 0)));
  }
  return { plate, lines };
}

/** A view box that fits the floor and the tallest possible bars, plus room for a lift. */
export function viewBoxFor(count: number, padding = 12): IsoViewBox {
  const f = floorExtent(count);
  const corners: IsoPoint[] = [];
  for (const x of [f.x0, f.x1]) {
    for (const y of [f.y0, f.y1]) {
      corners.push(project(x, y, 0), project(x, y, ISO_MAX_HEIGHT));
    }
  }
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  return {
    x: round(minX),
    y: round(minY),
    width: round(Math.max(...xs) + padding - minX),
    height: round(Math.max(...ys) + padding - minY),
  };
}

/** easeOutCubic on a 0–1 clamp. */
export function easeOut(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - (1 - c) ** 3;
}
