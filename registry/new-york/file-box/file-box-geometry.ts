import type {
  FileBoxFolderSpec,
  FileBoxFolderView,
  FileBoxPaperView,
  FileBoxPoint,
  FileBoxSceneView,
} from './types';

/* Oblique projection: u runs along the box front (0‥185), d runs into the box
   (0‥1), h is height above the floor. */
const K = 45 / 185; // slope of the front edge
const BOX_H = 117; // box height
const TU = 8; // wall thickness, along u
const TD = 0.06; // wall thickness, along d

const P = (u: number, d: number, h: number): FileBoxPoint => [
  210 + u + 130 * d,
  455 + K * u - 78 * d - h,
];

/* a folder's own plane: local x = u, y = -h */
const plane = (d: number): string =>
  `matrix(1 ${K} 0 1 ${210 + 130 * d} ${455 - 78 * d})`;

const poly = (...pts: FileBoxPoint[]): string =>
  'M' + pts.map((p) => p.map((n) => n.toFixed(2)).join(' ')).join(' L') + ' Z';

/* back → front */
const FOLDERS: FileBoxFolderSpec[] = [
  { d: 0.85, x0: 14, x1: 176, h: 150, tab: [122, 44], c: 'green' },
  { d: 0.7, x0: 12, x1: 172, h: 150, tab: [56, 46], c: 'beige' },
  { d: 0.5, x0: 10, x1: 168, h: 150, tab: [92, 48], c: 'pink' },
  { d: 0.3, x0: 8, x1: 172, h: 148, tab: [50, 46], c: 'orange' },
  { d: 0.14, x0: 8, x1: 170, h: 146, tab: [8, 44], c: 'green' },
];

const ORDINAL = ['front', 'second', 'middle', 'fourth', 'back'];
const TAB_H = 13;
const FLAP = 27; // how far the front flap sits below the back panel
export const LIFT = 40;
export const PAPER_TILT = [0.8, -1.4, 0.5];
export const PAPER_FAN = [-2.6, 0.8, 2.8];

/* the back panel with its tab; `bottom` lets a hit area start at the box rim, `up` extends it upward */
function backPath(
  { x0, x1, h, tab: [tx, tw] }: FileBoxFolderSpec,
  bottom = 0,
  up = 0,
): string {
  const r = 5;
  const t = h + TAB_H;
  const b = -bottom - up;
  const hh = -h - up;
  const tt = -t - up;
  const tabEnd = tx + tw;
  let d = `M${x0} ${b} `;
  d +=
    tx <= x0
      ? `V${tt + r} Q${x0} ${tt} ${x0 + r} ${tt} `
      : `V${hh + r} Q${x0} ${hh} ${x0 + r} ${hh} H${tx} C${tx + 5} ${hh} ${tx + 4} ${tt} ${tx + 11} ${tt} `;
  d += `H${tabEnd - 11} C${tabEnd - 4} ${tt} ${tabEnd - 5} ${hh} ${tabEnd} ${hh} `;
  d += `H${x1 - r} Q${x1} ${hh} ${x1} ${hh + r} V${b} Z`;
  return d;
}

const roundTop = (x0: number, x1: number, top: number, r = 5): string =>
  `M${x0} 0 V${-top + r} Q${x0} ${-top} ${x0 + r} ${-top} H${x1 - r} Q${x1} ${-top} ${x1} ${-top + r} V0 Z`;

/* you lift a folder by its tab, so it tips a hair toward that side */
export function leanOf(f: FileBoxFolderSpec): number {
  const [tx, tw] = f.tab;
  return ((tx + tw / 2 - (f.x0 + f.x1) / 2) / ((f.x1 - f.x0) / 2)) * 1.3;
}

const PAPER_LINES: Array<[number, number]> = [
  [7, 0.42],
  [12.5, 0.6],
  [18, 0.3],
];

function folderView(F: FileBoxFolderSpec, i: number): FileBoxFolderView {
  const hv = BOX_H - 78 * F.d; // the height at which the folder clears the front rim
  const position = FOLDERS.length - i;
  const papers: FileBoxPaperView[] = [0, 1, 2].map((j) => {
    const px0 = F.x0 + 7 + j * 4;
    const px1 = F.x1 - 7 - j * 5;
    const top = F.h - 4 - j * 6;
    return {
      sheet: roundTop(px0, px1, top, 2),
      fill: `var(--pfbox-paper-${j + 1})`,
      lines: PAPER_LINES.map(
        ([dy, len]) =>
          `M${px0 + 9} ${-(top - dy)} H${px0 + 9 + (px1 - px0 - 18) * len}`,
      ),
    };
  });
  return {
    spec: F,
    index: i,
    position,
    color: F.c,
    plane: plane(F.d),
    back: backPath(F),
    backFill: `var(--pfbox-${F.c}-b)`,
    crease: `M${F.x0 + 2} ${-(F.h - FLAP - 2)} H${F.x1 - 2}`,
    papers,
    flap: roundTop(F.x0, F.x1, F.h - FLAP, 6),
    flapFill: `var(--pfbox-${F.c}-f)`,
    flapHi: `M${F.x0 + 8} ${-(F.h - FLAP - 5)} H${F.x1 - 8}`,
    occY: -(hv + 34),
    hitBase: backPath(F, hv),
    hitExtend: backPath(F, hv, LIFT),
    label: `Pull out the ${F.c} folder, ${ORDINAL[position - 1] ?? ''} from the front`,
  };
}

function sceneView(): FileBoxSceneView {
  const hole = [P(185, 0.36, BOX_H - 22), P(185, 0.64, BOX_H - 22)];
  const [h0, h1] = hole;
  return {
    base: poly(P(0, 0, 0), P(185, 0, 0), P(185, 1, 0), P(0, 1, 0)),
    hollowBack: poly(
      P(TU, 1 - TD, 0),
      P(185 - TU, 1 - TD, 0),
      P(185 - TU, 1 - TD, BOX_H),
      P(TU, 1 - TD, BOX_H),
    ),
    hollowSide: poly(
      P(TU, TD, 0),
      P(TU, 1 - TD, 0),
      P(TU, 1 - TD, BOX_H),
      P(TU, TD, BOX_H),
    ),
    rimBack: poly(
      P(0, 1, BOX_H),
      P(185, 1, BOX_H),
      P(185, 1 - TD, BOX_H),
      P(TU, 1 - TD, BOX_H),
      P(TU, 0, BOX_H),
      P(0, 0, BOX_H),
    ),
    faceSide: poly(
      P(185, 0, 0),
      P(185, 1, 0),
      P(185, 1, BOX_H),
      P(185, 0, BOX_H),
    ),
    faceFront: poly(P(0, 0, 0), P(185, 0, 0), P(185, 0, BOX_H), P(0, 0, BOX_H)),
    rimFront: poly(
      P(0, 0, BOX_H),
      P(185, 0, BOX_H),
      P(185, 1, BOX_H),
      P(185 - TU, 1, BOX_H),
      P(185 - TU, TD, BOX_H),
      P(0, TD, BOX_H),
    ),
    hole: h0 && h1 ? `M${h0[0]} ${h0[1]} L${h1[0]} ${h1[1]}` : '',
    folders: FOLDERS.map(folderView),
  };
}

/** Every path in the scene, computed once: the art is static, only transforms move. */
export const SCENE: FileBoxSceneView = sceneView();
