import type {
  FolderEntry,
  FolderGeometry,
  FolderItem,
  FolderMatrix,
  FolderPhase,
  FolderRgb,
  FolderSlot,
  FolderTabPosition,
} from './types';

export const TAU = Math.PI * 2;
export const STEP = 1 / 240;
export const MAX_ITEMS = 6;
export const DEFAULT_ITEMS: FolderEntry[] = [
  { title: 'Brand guidelines' },
  { title: 'Launch plan' },
  { title: 'Moodboard' },
];

const PILE_TURN = [0.5, -1.1, 1.5, -0.7, 1.2, -1.6];
const BOOK_REST = [
  { x: 0.14, y: -0.004, r: 1.4 },
  { x: 0.115, y: 0.008, r: -1.1 },
  { x: 0.09, y: 0, r: 0.6 },
];
const BOOK_PEEK = [
  { x: 0.27, y: -0.016, r: 4.5 },
  { x: 0.2, y: 0.014, r: 1.2 },
  { x: 0.14, y: 0, r: -1.2 },
];
const FLAP_REST = [
  { x: 0.16, rise: 0, r: 3 },
  { x: -0.17, rise: 0.05, r: -3.5 },
  { x: 0, rise: 0.1, r: 0.5 },
  { x: 0.25, rise: 0.08, r: 5 },
  { x: -0.25, rise: 0.09, r: -5.5 },
  { x: 0.08, rise: 0.12, r: 1.5 },
];
const FLAP_LAST = { x: 0.08, rise: 0.12, r: 1.5 };
const SPREAD_TURN = [4, -5, 3, -6, 5, -3];
const SPREAD_DROP = [0.03, -0.04, 0.05, -0.02, 0.04, -0.05];
export const DROP_TURN = [-6, 4, -3, 7, -5, 3];
export const BOOK_ANGLES: Record<FolderPhase, number> = {
  open: -180,
  receive: -24,
  peek: -13,
  rest: 0,
};
export const FLAP_ANGLES: Record<FolderPhase, number> = {
  open: -64,
  receive: -30,
  peek: -15,
  rest: 0,
};
export const LAYERS = { out: 50, drag: 80, focus: 90 };

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Normalizes a string, number or object entry to a FolderItem. */
export const toFolderItem = (entry: FolderEntry): FolderItem =>
  typeof entry === 'string' || typeof entry === 'number'
    ? { title: String(entry) }
    : entry;

const FALLBACK_RGB: FolderRgb = [61, 139, 255];
const colorCache = new Map<string, FolderRgb>();
let colorContext: CanvasRenderingContext2D | null = null;

const parseHex = (value: string): FolderRgb | null => {
  const hex = value.trim().replace(/^#/, '');
  if (!/^(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(hex)) return null;
  const full =
    hex.length <= 4
      ? hex
          .slice(0, 3)
          .split('')
          .map((c) => c + c)
          .join('')
      : hex.slice(0, 6);
  const num = Number.parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

const parseRgbFunction = (value: string): FolderRgb | null => {
  const match = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(
    value.trim(),
  );
  if (!match) return null;
  return [match[1], match[2], match[3]].map((part) =>
    clamp(Math.round(Number(part)), 0, 255),
  );
};

/** Parses any CSS color to RGB. Hex and rgb() parse identically on the server and the client. */
export const parseColor = (value: string): FolderRgb => {
  const key = String(value);
  const cached = colorCache.get(key);
  if (cached) return cached;
  let rgb = parseHex(key) ?? parseRgbFunction(key);
  if (!rgb) {
    rgb = FALLBACK_RGB;
    if (typeof document !== 'undefined') {
      colorContext ??= document
        .createElement('canvas')
        .getContext('2d', { willReadFrequently: true });
      if (colorContext) {
        colorContext.clearRect(0, 0, 1, 1);
        colorContext.fillStyle = '#3d8bff';
        colorContext.fillStyle = key;
        colorContext.fillRect(0, 0, 1, 1);
        rgb = Array.from(
          colorContext.getImageData(0, 0, 1, 1).data.slice(0, 3),
        );
      }
    }
  }
  colorCache.set(key, rgb);
  return rgb;
};

export const mixRgb = (
  rgb: FolderRgb,
  target: FolderRgb,
  amount: number,
): FolderRgb =>
  rgb.map((channel, i) =>
    Math.round(channel + ((target[i] ?? 0) - channel) * amount),
  );
export const rgbString = (rgb: FolderRgb) =>
  `rgb(${rgb[0] ?? 0}, ${rgb[1] ?? 0}, ${rgb[2] ?? 0})`;
export const luma = (rgb: FolderRgb) =>
  (0.2126 * (rgb[0] ?? 0) + 0.7152 * (rgb[1] ?? 0) + 0.0722 * (rgb[2] ?? 0)) /
  255;

export const multiply = (a: FolderMatrix, b: FolderMatrix): FolderMatrix => {
  const out: FolderMatrix = Array.from({ length: 16 }, () => 0);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        (a[row] ?? 0) * (b[col * 4] ?? 0) +
        (a[4 + row] ?? 0) * (b[col * 4 + 1] ?? 0) +
        (a[8 + row] ?? 0) * (b[col * 4 + 2] ?? 0) +
        (a[12 + row] ?? 0) * (b[col * 4 + 3] ?? 0);
    }
  }
  return out;
};

export const chain = (first: FolderMatrix, ...rest: FolderMatrix[]) =>
  rest.reduce(multiply, first);
export const move = (x: number, y: number, z = 0): FolderMatrix => [
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  x,
  y,
  z,
  1,
];
export const stretch = (x: number, y: number): FolderMatrix => [
  x,
  0,
  0,
  0,
  0,
  y,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1,
];

export const turnX = (degrees: number): FolderMatrix => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
};

export const turnY = (degrees: number): FolderMatrix => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
};

export const turnZ = (degrees: number): FolderMatrix => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};

export const toCss = (m: FolderMatrix) =>
  `matrix3d(${m.map((v) => (Math.abs(v) < 1e-7 ? 0 : Number(v.toFixed(6)))).join(', ')})`;

export const measureFolder = (
  book: boolean,
  scale: number,
  labelWidth: number,
  hasLabel: boolean,
  tabPosition: FolderTabPosition,
): FolderGeometry => {
  const w = (book ? 180 : 224) * scale;
  const h = (book ? 232 : 176) * scale;
  const tabH = 20 * scale;
  const r = 12 * scale;
  const shoulder = tabH * 0.75;
  const frontTop = book ? tabH : tabH + h * 0.3;
  const corners = book ? [0, r, r, 0] : [r, r, r, r];
  const cornerLeft = corners[0] ?? 0;
  const cornerRight = corners[1] ?? 0;
  const maxTab = w - cornerLeft - cornerRight - shoulder * 2 - 10 * scale;
  const tabW = clamp(
    hasLabel ? labelWidth + 14 * scale + shoulder : w * 0.34,
    Math.min(w * 0.3, maxTab),
    maxTab,
  );
  const tabX =
    tabPosition === 'left'
      ? cornerLeft + 5 * scale + shoulder
      : tabPosition === 'center'
        ? (w - tabW) / 2
        : w - cornerRight - 5 * scale - shoulder - tabW;
  const docW = book ? w * 0.8 : w * 0.54;
  return {
    book,
    scale,
    w,
    h,
    tabH,
    r,
    shoulder,
    corners,
    tabW,
    tabX,
    frontTop,
    frontH: tabH + h - frontTop,
    docW,
    docH: docW * (book ? 1.28 : 1.22),
  };
};

export const backPath = (g: FolderGeometry) => {
  const { w, h, tabX, tabW, tabH, shoulder } = g;
  const tl = g.corners[0] ?? 0;
  const tr = g.corners[1] ?? 0;
  const br = g.corners[2] ?? 0;
  const bl = g.corners[3] ?? 0;
  const top = tabH;
  const bottom = tabH + h;
  return [
    `M 0 ${top + tl}`,
    `Q 0 ${top} ${tl} ${top}`,
    `L ${tabX - shoulder} ${top}`,
    `C ${tabX} ${top} ${tabX} 0 ${tabX + shoulder} 0`,
    `L ${tabX + tabW - shoulder} 0`,
    `C ${tabX + tabW} 0 ${tabX + tabW} ${top} ${tabX + tabW + shoulder} ${top}`,
    `L ${w - tr} ${top}`,
    `Q ${w} ${top} ${w} ${top + tr}`,
    `L ${w} ${bottom - br}`,
    `Q ${w} ${bottom} ${w - br} ${bottom}`,
    `L ${bl} ${bottom}`,
    `Q 0 ${bottom} 0 ${bottom - bl}`,
    'Z',
  ].join(' ');
};

export const placeBook = (
  rank: number,
  count: number,
  phase: FolderPhase,
  layout: string,
  g: FolderGeometry,
): FolderSlot => {
  const pileX = g.w / 2;
  const pileY = g.frontTop + g.frontH / 2;
  if (phase === 'open') {
    if (layout === 'row') {
      const gap = 10 * g.scale;
      const fit = Math.min(
        0.8,
        (g.w * 1.86 - gap * (count - 1)) / (count * g.docW),
      );
      const step = g.docW * fit + gap;
      return {
        x: g.w / 2 + (rank - (count - 1) / 2) * step,
        y: pileY,
        z: 0,
        r: 0,
        ry: 0,
        s: fit,
      };
    }
    if (layout === 'stack') {
      const fit = 0.74;
      const strip = Math.min(
        26 * g.scale,
        (g.h * 0.36) / Math.max(1, count - 1),
      );
      const top = g.frontTop + 14 * g.scale + (count - 1) * strip;
      return {
        x: g.w,
        y: top + (g.docH * fit) / 2 - rank * strip,
        z: 0,
        r: 0,
        ry: 0,
        s: fit,
      };
    }
    const fit = count > 4 ? 0.58 : count > 3 ? 0.64 : 0.72;
    const span =
      count === 2 ? g.w : Math.min(g.w * 1.3, g.w * 0.6 * (count - 1));
    const x = count > 1 ? span / 2 - (rank * span) / (count - 1) : g.w * 0.5;
    return {
      x: g.w / 2 + x,
      y: pileY + (SPREAD_DROP[rank] ?? 0) * g.h,
      z: 0,
      r: SPREAD_TURN[rank] ?? 0,
      ry: 0,
      s: fit,
    };
  }
  const offsets = phase === 'rest' ? BOOK_REST : BOOK_PEEK;
  const offset = offsets[rank] ?? { x: 0.06, y: 0, r: PILE_TURN[rank] ?? 0 };
  return {
    x: pileX + offset.x * g.w,
    y: pileY + offset.y * g.h + rank * 0.8 * g.scale,
    z: 0,
    r: offset.r,
    ry: 0,
    s: 1,
  };
};

export const placeFlap = (
  rank: number,
  count: number,
  phase: FolderPhase,
  layout: string,
  g: FolderGeometry,
  pointer: number | null,
): FolderSlot => {
  const rest = FLAP_REST[rank] ?? FLAP_LAST;
  const floor = g.tabH + g.h - 5 * g.scale - g.docH / 2;
  const mid = (count - 1) / 2;
  if (phase === 'open') {
    const lift = g.tabH - g.h * 0.02;
    if (layout === 'stack') {
      const strip = Math.min(
        30 * g.scale,
        (g.h * 0.62) / Math.max(1, count - 1),
      );
      const fit = 1.04 - rank * 0.05;
      return {
        x: g.w / 2,
        y: g.tabH + g.h * 0.1 - rank * strip - (g.docH * (1.04 - fit)) / 2,
        z: -rank * 18 * g.scale,
        r: 0,
        ry: 0,
        s: fit,
      };
    }
    const gap = 12 * g.scale;
    const fit = Math.min(
      0.94,
      (g.w * 2.3 - gap * (count - 1)) / (count * g.docW),
    );
    const step = g.docW * fit + gap;
    const tidy = layout === 'row';
    return {
      x: g.w / 2 + (rank - mid) * step,
      y: lift + (tidy ? 0 : (SPREAD_DROP[rank] ?? 0) * g.h * 0.7),
      z: 0,
      r: tidy ? 0 : (SPREAD_TURN[rank] ?? 0) * 0.55,
      ry: 0,
      s: fit,
    };
  }
  const part = phase === 'receive' ? 1.7 : phase === 'peek' ? 1.3 : 1;
  const x = g.w / 2 + rest.x * g.w * part;
  if (phase === 'rest')
    return { x, y: floor - rest.rise * g.h, z: 0, r: rest.r, ry: 0, s: 1 };
  const near =
    phase === 'peek' && pointer != null
      ? Math.max(0, 1 - Math.abs(pointer - x) / (g.w * 0.32))
      : 0;
  const rise = rest.rise + (phase === 'receive' ? 0.03 : 0.1);
  return {
    x,
    y: floor - rise * g.h - near * near * g.h * 0.09,
    z: 0,
    r: rest.r * 1.6,
    ry: 0,
    s: 1,
  };
};
