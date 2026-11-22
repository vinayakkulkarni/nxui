import type { DevicePairingGeometry, IsoPoint } from './types';

// Dimetric projection: the plate runs left to right with a 14° fall,
// depth runs down-left at 44°, height goes straight up.
const XA = (14 * Math.PI) / 180;
const YA = (44 * Math.PI) / 180;
const ZS = 0.92;

function project([x, y, z]: IsoPoint): [number, number] {
  return [
    x * Math.cos(XA) - y * Math.cos(YA),
    x * Math.sin(XA) + y * Math.sin(YA) - z * ZS,
  ];
}

function fmt(n: number): string {
  return n.toFixed(1);
}

function poly(points: IsoPoint[]): string {
  return points
    .map((p, i) => {
      const [sx, sy] = project(p);
      return `${i ? 'L' : 'M'}${fmt(sx)} ${fmt(sy)}`;
    })
    .join(' ')
    .concat(' Z');
}

function line(a: IsoPoint, b: IsoPoint): string {
  const [ax, ay] = project(a);
  const [bx, by] = project(b);
  return `M${fmt(ax)} ${fmt(ay)} L${fmt(bx)} ${fmt(by)}`;
}

/** The three faces of a box the viewer can see: right, front, top. */
function box(
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
): string[] {
  const X = x + w;
  const Y = y + d;
  const Z = z + h;
  return [
    poly([
      [X, y, z],
      [X, Y, z],
      [X, Y, Z],
      [X, y, Z],
    ]),
    poly([
      [x, Y, z],
      [X, Y, z],
      [X, Y, Z],
      [x, Y, Z],
    ]),
    poly([
      [x, y, Z],
      [X, y, Z],
      [X, Y, Z],
      [x, Y, Z],
    ]),
  ];
}

/** A solar panel tilted back towards the far edge of the plate. */
function panel(x: number, w: number, faces: string[], lines: string[]): void {
  const lowY = 60;
  const highY = 12;
  const lowZ = 16;
  const highZ = 50;
  const at = (u: number, v: number): IsoPoint => [
    x + u * w,
    lowY + (highY - lowY) * v,
    lowZ + (highZ - lowZ) * v,
  ];
  // Legs first so the panel covers their tops.
  for (const u of [0.08, 0.92]) {
    const [lx, ly, lz] = at(u, 0.05);
    const [hx, hy, hz] = at(u, 0.95);
    faces.push(...box(lx - 1.6, ly - 1.6, 6, 3.2, 3.2, lz - 6));
    faces.push(...box(hx - 1.6, hy - 1.6, 6, 3.2, 3.2, hz - 6));
  }
  faces.push(poly([at(0, 0), at(1, 0), at(1, 1), at(0, 1)]));
  for (let c = 1; c < 4; c += 1) lines.push(line(at(c / 4, 0), at(c / 4, 1)));
  for (let r = 1; r < 3; r += 1) lines.push(line(at(0, r / 3), at(1, r / 3)));
}

function build(): DevicePairingGeometry {
  const faces: string[] = [];
  const lines: string[] = [];

  // Base plate with a raised inner deck.
  faces.push(...box(0, 0, 0, 372, 72, 7));
  lines.push(
    poly([
      [7, 7, 7],
      [365, 7, 7],
      [365, 65, 7],
      [7, 65, 7],
    ]),
  );
  // Ruler ticks along the far edge.
  for (let x = 92; x <= 160; x += 8) {
    lines.push(line([x, 7, 6], [x, x % 16 === 12 ? 12 : 10, 6]));
  }

  // Junction boxes.
  faces.push(...box(14, 52, 6, 12, 10, 8));
  faces.push(...box(160, 50, 6, 13, 10, 7));

  // Battery: plinth, body, cap.
  faces.push(...box(14, 10, 6, 50, 38, 6));
  faces.push(...box(22, 16, 12, 36, 26, 88));
  faces.push(...box(20, 14, 100, 40, 30, 11));
  lines.push(line([22, 42, 58], [58, 42, 58]));
  // Vents on the side.
  for (let z = 76; z <= 94; z += 4.5)
    lines.push(line([58, 21, z], [58, 35, z + 2]));
  // Socket near the bottom.
  lines.push(
    poly([
      [32, 42, 20],
      [48, 42, 20],
      [48, 42, 28],
      [32, 42, 28],
    ]),
  );
  // Button under the screen.
  const [bx, by] = project([40, 42, 68]);
  lines.push(
    `M${fmt(bx - 2.6)} ${fmt(by)} a2.6 2.6 0 1 0 5.2 0 a2.6 2.6 0 1 0 -5.2 0`,
  );

  panel(186, 80, faces, lines);
  panel(276, 80, faces, lines);

  // Cable from the battery to the far box, sagging along the deck.
  const p = (pt: IsoPoint): string => {
    const [sx, sy] = project(pt);
    return `${fmt(sx)} ${fmt(sy)}`;
  };
  const cable = `M${p([20, 52, 9])} C${p([16, 66, 6])} ${p([60, 64, 6])} ${p([100, 60, 6])} S${p([154, 58, 6])} ${p([160, 56, 9])}`;

  const screenPts: IsoPoint[] = [
    [25, 42, 76],
    [55, 42, 76],
    [55, 42, 90],
    [25, 42, 90],
  ];
  const screen = poly(screenPts);
  const screenCenter = project([40, 42, 83]);
  const [ax, ay] = project([1, 0, 0]);
  const [ox, oy] = project([0, 0, 0]);
  const len = Math.hypot(ax - ox, ay - oy);
  const beacon = project([40, 29, 111]);

  // Extreme corners of the scene decide the view box.
  const corners: IsoPoint[] = [
    [0, 0, 0],
    [372, 0, 0],
    [372, 72, 0],
    [0, 72, 0],
    [20, 14, 111],
    [60, 14, 111],
    [60, 44, 111],
    [20, 44, 111],
  ];
  const xs = corners.map((c) => project(c)[0]);
  const ys = corners.map((c) => project(c)[1]);
  const pad = 3;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad - 4;
  const maxX = Math.max(...xs) + pad;
  const maxY = Math.max(...ys) + pad;

  return {
    viewBox: `${fmt(minX)} ${fmt(minY)} ${fmt(maxX - minX)} ${fmt(maxY - minY)}`,
    faces,
    lines,
    cable,
    screen,
    screenCenter,
    screenAxis: [(ax - ox) / len, (ay - oy) / len],
    beacon,
  };
}

export const SCENE: DevicePairingGeometry = build();
