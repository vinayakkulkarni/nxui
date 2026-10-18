import type {
  TearTicketBridge,
  TearTicketGeometry,
  TearTicketSim,
} from './types';

export const GRAVITY = 2400;
export const ART_INSET = 8;
export const ART_SPAN = 0.78;
export const RETRACT = 0.17;

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));
export const rad = (deg: number): number => (deg * Math.PI) / 180;
export const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
export const f = (n: number): string => n.toFixed(2);

/** Deterministic mulberry32 PRNG — keeps the rough edge identical on server and client. */
function noise(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 1_831_565_813) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSim(): TearTicketSim {
  return {
    raf: 0,
    last: 0,
    phase: 'idle',
    id: null,
    sign: 1,
    hinge: { x: 0, y: 0 },
    hingeV: 0,
    grab: { x: 0, y: 0 },
    start: { x: 0, y: 0 },
    point: { x: 0, y: 0 },
    a0: 0,
    theta: 0,
    thetaV: 0,
    sx: 0,
    sy: 0,
    vx: 0,
    vy: 0,
    spin: 0,
    pvx: 0,
    pvy: 0,
    pt: 0,
    fade: 1,
    age: 0,
    bx: 0,
    bv: 0,
    snapped: [],
    snapAt: [],
    span: [],
  };
}

export function buildGeometry(
  W: number,
  H: number,
  S: number,
  R: number,
  holes: number,
  hole: number,
  notch: number,
  rough: number,
  vertical: boolean,
): TearTicketGeometry {
  const main = vertical ? H : W;
  const cross = vertical ? W : H;
  const x = main - S;
  const hr = hole / 2;
  const n = Math.max(1, Math.round(holes));
  const span = cross - 2 * notch;
  const bridge = Math.max(2, (span - n * hole) / (n + 1));
  const random = noise(n * 7919 + Math.round(cross));
  const at = (u: number, v: number) =>
    vertical ? { x: v, y: u } : { x: u, y: v };
  const pt = (u: number, v: number) =>
    vertical ? `${f(v)},${f(u)}` : `${f(u)},${f(v)}`;
  const arc = (r: number, sweep: number, u: number, v: number) =>
    `A${f(r)},${f(r)} 0 0 ${vertical ? 1 - sweep : sweep} ${pt(u, v)}`;

  const bridges: TearTicketBridge[] = [];
  for (let i = 0; i <= n; i += 1) {
    const y0 = notch + i * (bridge + hole);
    const y1 = y0 + bridge;
    const steps = Math.max(2, Math.round(bridge / 2.2));
    const pts: [number, number][] = [];
    for (let k = 1; k < steps; k += 1) {
      pts.push([x + (random() - 0.5) * 2 * rough, y0 + (bridge * k) / steps]);
    }
    bridges.push({ y0, y1, mid: (y0 + y1) / 2, pts, ...at(x, (y0 + y1) / 2) });
  }

  let body = `M${pt(R, 0)}L${pt(x - notch, 0)}${arc(notch, 0, x, notch)}`;
  bridges.forEach((b, i) => {
    for (const p of b.pts) body += `L${pt(p[0], p[1])}`;
    body += `L${pt(x, b.y1)}`;
    if (i < n) body += arc(hr, 0, x, b.y1 + hole);
  });
  body += `${arc(notch, 0, x - notch, cross)}L${pt(R, cross)}${arc(R, 1, 0, cross - R)}L${pt(0, R)}${arc(R, 1, R, 0)}Z`;

  let stub = `M${pt(x + notch, 0)}L${pt(main - R, 0)}${arc(R, 1, main, R)}L${pt(main, cross - R)}${arc(R, 1, main - R, cross)}L${pt(x + notch, cross)}${arc(notch, 0, x, cross - notch)}`;
  for (let i = n; i >= 0; i -= 1) {
    const b = bridges[i]!;
    for (let k = b.pts.length - 1; k >= 0; k -= 1) {
      const p = b.pts[k]!;
      stub += `L${pt(p[0], p[1])}`;
    }
    stub += `L${pt(x, b.y0)}`;
    if (i > 0) stub += arc(hr, 0, x, b.y0 - hole);
  }
  stub += `${arc(notch, 0, x + notch, 0)}Z`;

  const ends: TearTicketGeometry['ends'] = [
    { ...at(x, notch), v: notch },
    { ...at(x, cross - notch), v: cross - notch },
  ];
  const bodyOutline = `M${pt(x, cross - notch)}${arc(notch, 0, x - notch, cross)}L${pt(R, cross)}${arc(R, 1, 0, cross - R)}L${pt(0, R)}${arc(R, 1, R, 0)}L${pt(x - notch, 0)}${arc(notch, 0, x, notch)}`;
  const stubOutline = `M${pt(x, notch)}${arc(notch, 0, x + notch, 0)}L${pt(main - R, 0)}${arc(R, 1, main, R)}L${pt(main, cross - R)}${arc(R, 1, main - R, cross)}L${pt(x + notch, cross)}${arc(notch, 0, x, cross - notch)}`;

  return {
    vertical,
    cross,
    body,
    stub,
    bridges,
    ends,
    bodyOutline,
    stubOutline,
  };
}
