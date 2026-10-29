/**
 * Desk Computer — the live engine.
 *
 * Everything the figure does after it is drawn: the keyboard types into the
 * search box on the CRT, the mouse drags on its pad with its cable following
 * and a cursor moving on the screen, the CD flies from its jewel case into the
 * drive and AutoPlay opens, the CRT warms up and collapses, the system
 * assembles itself, and — while nobody touches it — it gives itself a tour.
 * Every sound is synthesised with Web Audio, and only the visitor's own input
 * makes any.
 *
 * It runs on the SVG the figure was built as (public/library/desk-computer.svg),
 * scoped to one stage element, and it cleans up after itself: every listener
 * hangs off one AbortController, and the frame loop, timers and audio context
 * all stop on destroy().
 *
 * Vue port of the Desk Computer engine from Pin UI (https://pinui.xyz), MIT licence.
 * The isometric helpers below are adapted from the Anatomy kit
 * (https://github.com/wheresryan22/anatomy), MIT, © 2026 Ryan.
 */
import type {
  DeskCdState,
  DeskData,
  DeskDrag,
  DeskEngine,
  DeskKeyState,
  DeskMountOptions,
  DeskMouseState,
  DeskNoiseOptions,
  DeskPaths,
  DeskPlan,
  DeskProjection,
  DeskSound,
  DeskToneOptions,
  DeskTour,
  DeskVec2,
  DeskVec3,
  DeskWaiter,
} from './types';

type Vec2 = DeskVec2;
type Vec3 = DeskVec3;

const D: DeskData = {
  P: { origin: [285.7585, 513.2772], scale: 1.83, azimuth: 41, elevation: 30 },
  crtMid: 69,
  queryX: -12.8,
  queryMax: 25,
  scale: 2.3147,
  screen: { u0: -30.5, u1: 28.5, z0: 48, z1: 94.5 },
  search: { u0: -17, u1: 17, z0: 54, z1: 61.5 },
  cursor: { u: 6, z: 70 },
  mouse: {
    centre: [103, -164],
    tip: [87.9941, -166.4216, 2.9],
    dir: [-0.9872, -0.1593, 0],
    padTop: 1.4,
    edge: [68.5, -157.5, 2.75],
    padY: [-188, -142],
    anchor: [59.4708, -152.7058, 1.5694],
    tangent: [-0.6754, 0.7332, -0.0789],
    r: 0.85,
    range: { x: [-16, 11], y: [-18.8, 16.8] },
  },
  tray: {
    front: 44,
    y0: -171,
    y1: -121,
    body: { y0: -167, y1: -125, z: 131, h: 2.2 },
    plate: { z0: 129.4, z1: 137.4, t: 1.6 },
    travel: 48,
    bay: { u0: 120, u1: 172, z0: 129.4, z1: 137.6 },
  },
  disc: { r: 19, home: [127.5, 80, 3.6] },
  keys: [
    'Escape',
    'F1',
    'F2',
    'F3',
    'F4',
    'F5',
    'F6',
    'F7',
    'F8',
    'F9',
    'F10',
    'F11',
    'F12',
    '`',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '0',
    '-',
    '=',
    'Backspace',
    'Tab',
    'q',
    'w',
    'e',
    'r',
    't',
    'y',
    'u',
    'i',
    'o',
    'p',
    '[',
    ']',
    '\\',
    'CapsLock',
    'a',
    's',
    'd',
    'f',
    'g',
    'h',
    'j',
    'k',
    'l',
    ';',
    "'",
    'Enter',
    'Shift',
    'z',
    'x',
    'c',
    'v',
    'b',
    'n',
    'm',
    ',',
    '.',
    '/',
    'ShiftRight',
    'Control',
    'Meta',
    'Alt',
    ' ',
    'AltRight',
    'MetaRight',
    'ContextMenu',
    'ControlRight',
    'Insert',
    'Home',
    'PageUp',
    'Delete',
    'End',
    'PageDown',
    'ArrowUp',
    'ArrowLeft',
    'ArrowDown',
    'ArrowRight',
    'NumLock',
    'NumpadDivide',
    'NumpadMultiply',
    'NumpadSubtract',
    'Numpad7',
    'Numpad8',
    'Numpad9',
    'NumpadAdd',
    'Numpad4',
    'Numpad5',
    'Numpad6',
    'Numpad1',
    'Numpad2',
    'Numpad3',
    'NumpadEnter',
    'Numpad0',
    'NumpadDecimal',
  ],
};

/** Parse SVG markup and return the root element, or null if it does not parse. */
export function parseSvg(markup: string): SVGSVGElement | null {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const root = doc.documentElement;
  if (doc.querySelector('parsererror') || !(root instanceof SVGSVGElement))
    return null;
  return root;
}

/** Replace an SVG group's children with parsed fragment markup the engine generated. */
function setSvgMarkup(el: Element, markup: string): void {
  if (!markup) {
    el.replaceChildren();
    return;
  }
  const root = parseSvg(
    `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`,
  );
  el.replaceChildren(...(root ? Array.from(root.childNodes) : []));
}

/** Index into a list that the geometry guarantees is long enough. */
function nth<T>(list: readonly T[], i: number): T {
  const value = list[i];
  if (value === undefined)
    throw new RangeError(`DeskComputer: index ${i} out of range`);
  return value;
}

/* ------------------------------------------------------------------------ */
/* isometric helpers (Anatomy kit, MIT)                                      */
/* ------------------------------------------------------------------------ */

const RADIANS = Math.PI / 180;
const UNIT = Math.sqrt(1.6);
const SHADES = 4;

function cameraOf({ scale, azimuth, elevation }: DeskProjection) {
  const a = azimuth * RADIANS;
  const e = elevation * RADIANS;
  return {
    sinA: Math.sin(a),
    cosA: Math.cos(a),
    sinE: Math.sin(e),
    cosE: Math.cos(e),
    k: scale * UNIT,
  };
}
function iso([x, y, z]: Vec3, projection: DeskProjection): Vec2 {
  const { origin } = projection;
  const { sinA, cosA, sinE, cosE, k } = cameraOf(projection);
  return [
    origin[0] + (x * sinA - y * cosA) * k,
    origin[1] + ((x * cosA + y * sinA) * sinE - z * cosE) * k,
  ];
}
function towardViewer(projection: DeskProjection): Vec2 {
  const { sinA, cosA } = cameraOf(projection);
  return [cosA, sinA];
}
const tenth = (value: number) => {
  const text = (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, '');
  return text === '-0' ? '0' : text;
};
function pathOf(points: Vec2[], closed = false) {
  if (!points.length) return '';
  return (
    points
      .map(([x, y], at) => `${at ? 'L' : 'M'}${tenth(x)} ${tenth(y)}`)
      .join('') + (closed ? 'Z' : '')
  );
}
function roundedPlan({ x, y, w, d, r }: DeskPlan, steps = 8): Vec2[] {
  const radius = Math.max(0, Math.min(r, w / 2, d / 2));
  const corners: Vec3[] = [
    [x + w - radius, y + radius, -90],
    [x + w - radius, y + d - radius, 0],
    [x + radius, y + d - radius, 90],
    [x + radius, y + radius, 180],
  ];
  const out: Vec2[] = [];
  for (const [cx, cy, start] of corners) {
    const count = radius > 0 ? steps : 0;
    for (let step = 0; step <= count; step++) {
      const angle = (start + (count ? (90 * step) / count : 45)) * RADIANS;
      out.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
    }
  }
  return out;
}
function signedArea(points: Vec2[]) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = nth(points, i);
    const [bx, by] = nth(points, (i + 1) % points.length);
    area += ax * by - bx * ay;
  }
  return area / 2;
}
const oriented = (points: Vec2[]) =>
  signedArea(points) < 0 ? [...points].reverse() : points;
const cross = (o: Vec2, a: Vec2, b: Vec2) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
function convexHull(points: Vec2[]): Vec2[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const lower: Vec2[] = [];
  for (const point of sorted) {
    while (
      lower.length >= 2 &&
      cross(
        nth(lower, lower.length - 2),
        nth(lower, lower.length - 1),
        point,
      ) <= 0
    )
      lower.pop();
    lower.push(point);
  }
  const upper: Vec2[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const point = nth(sorted, i);
    while (
      upper.length >= 2 &&
      cross(
        nth(upper, upper.length - 2),
        nth(upper, upper.length - 1),
        point,
      ) <= 0
    )
      upper.pop();
    upper.push(point);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
function runsOf(flags: boolean[], want: boolean): number[][] {
  const count = flags.length;
  const runs: number[][] = [];
  const start = flags.findIndex(
    (flag, i) => flag !== flags[(i + count - 1) % count],
  );
  if (start < 0)
    return flags[0] === want
      ? [Array.from({ length: count + 1 }, (_, i) => i % count)]
      : [];
  let run: number[] | null = null;
  for (let step = 0; step < count; step++) {
    const i = (start + step) % count;
    if (flags[i] === want) {
      if (!run) run = [i];
      run.push((i + 1) % count);
    } else if (run) {
      runs.push(run);
      run = null;
    }
  }
  if (run) runs.push(run);
  return runs;
}
/* a convex extrusion of a plan ring: its fill, outline, creases, top and four shade buckets */
function extrude(
  ringPts: Vec2[],
  z: number,
  height: number,
  projection: DeskProjection,
  bevelBy = 0,
): DeskPaths {
  const count = ringPts.length;
  const counter = signedArea(ringPts) > 0;
  const [vx, vy] = towardViewer(projection);
  const { sinA, cosA } = cameraOf(projection);
  const normals: Vec2[] = ringPts.map(([ax, ay], i) => {
    const [bx, by] = nth(ringPts, (i + 1) % count);
    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.hypot(dx, dy) || 1;
    return counter ? [dy / length, -dx / length] : [-dy / length, dx / length];
  });
  const facing = normals.map(([nx, ny]) => nx * vx + ny * vy > 1e-9);
  const top = ringPts.map(([x, y]) => iso([x, y, z + height], projection));
  const bottom = ringPts.map(([x, y]) => iso([x, y, z], projection));
  const outline: string[] = [];
  const crease: string[] = [];
  for (const run of runsOf(facing, false))
    outline.push(pathOf(run.map((i) => nth(top, i))));
  for (const run of runsOf(facing, true)) {
    crease.push(pathOf(run.map((i) => nth(top, i))));
    if (height > 0) outline.push(pathOf(run.map((i) => nth(bottom, i))));
  }
  if (height > 0) {
    for (let i = 0; i < count; i++)
      if (facing[(i + count - 1) % count] !== facing[i])
        outline.push(pathOf([nth(top, i), nth(bottom, i)]));
  }
  const fill = pathOf(convexHull([...top, ...bottom]), true);
  const buckets: string[][] = Array.from({ length: SHADES }, () => []);
  if (height > 0) {
    const [lx, ly] = [-sinA, cosA];
    for (let i = 0; i < count; i++) {
      if (!facing[i]) continue;
      const [nx, ny] = nth(normals, i);
      const lit = (nx * lx + ny * ly + 1) / 2;
      const shade = Math.min(SHADES - 1, Math.max(0, Math.floor(lit * SHADES)));
      const next = (i + 1) % count;
      nth(buckets, shade).push(
        pathOf(
          oriented([
            nth(top, i),
            nth(top, next),
            nth(bottom, next),
            nth(bottom, i),
          ]),
          true,
        ),
      );
    }
  }
  let bevel: string | undefined;
  if (bevelBy > 0) {
    const inset: Vec2[] = ringPts.map(([x, y], i) => {
      const [ax, ay] = nth(normals, (i + count - 1) % count);
      const [bx, by] = nth(normals, i);
      const mx = ax + bx;
      const my = ay + by;
      const length = Math.hypot(mx, my) || 1;
      return [x - (mx / length) * bevelBy, y - (my / length) * bevelBy];
    });
    const insetTop = inset.map(([x, y]) => iso([x, y, z + height], projection));
    bevel = runsOf(facing, true)
      .map((run) =>
        pathOf([
          nth(top, nth(run, 0)),
          ...run.slice(1, -1).map((i) => nth(insetTop, i)),
          nth(top, nth(run, run.length - 1)),
        ]),
      )
      .join('');
  }
  return {
    fill,
    outline: outline.join(''),
    crease: crease.join(''),
    top: pathOf(oriented(top), true),
    shades: buckets.map((p) => p.join('')),
    bevel,
  };
}
const slabOf = (
  plan: DeskPlan,
  z: number,
  height: number,
  projection: DeskProjection,
  steps = 8,
  bevel = 0,
) => extrude(roundedPlan(plan, steps), z, height, projection, bevel);
const circleRing = (
  cx: number,
  cy: number,
  radius: number,
  steps = 40,
): Vec2[] =>
  Array.from({ length: steps }, (_, step): Vec2 => {
    const angle = (step / steps) * Math.PI * 2;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  });
const onTop = (
  points: Vec2[],
  z: number,
  projection: DeskProjection,
  closed = false,
) =>
  pathOf(
    points.map(([x, y]) => iso([x, y, z], projection)),
    closed,
  );
const planOutline = (
  plan: DeskPlan,
  z: number,
  projection: DeskProjection,
  steps = 8,
) => onTop(roundedPlan(plan, steps), z, projection, true);
const ring = (
  cx: number,
  cy: number,
  radius: number,
  z: number,
  projection: DeskProjection,
  steps = 40,
) => onTop(circleRing(cx, cy, radius, steps), z, projection, true);
function axisVector(projection: DeskProjection, [dx, dy, dz]: Vec3): Vec2 {
  const origin = iso([0, 0, 0], projection);
  const moved = iso([dx, dy, dz], projection);
  return [moved[0] - origin[0], moved[1] - origin[1]];
}
const fine = (value: number) => Math.round(value * 100) / 100;
function translateAlong(projection: DeskProjection, by: Vec3) {
  const [x, y] = axisVector(projection, by);
  return `translate(${fine(x)} ${fine(y)})`;
}
const thousandth = (value: number) => Math.round(value * 1000) / 1000;
function axesAt(at: Vec2, z: number, projection: DeskProjection) {
  const origin = iso([at[0], at[1], z], projection);
  const along = (point: Vec3): Vec2 => {
    const [px, py] = iso(point, projection);
    return [px - origin[0], py - origin[1]];
  };
  return {
    origin,
    x: along([at[0] + 1, at[1], z]),
    y: along([at[0], at[1] + 1, z]),
    z: along([at[0], at[1], z + 1]),
  };
}
const matrixOf = (u: Vec2, v: Vec2, origin: Vec2) =>
  `matrix(${thousandth(u[0])} ${thousandth(u[1])} ${thousandth(v[0])} ${thousandth(v[1])} ${thousandth(origin[0])} ${thousandth(origin[1])})`;
function sideMatrix(
  at: Vec2,
  z: number,
  projection: DeskProjection,
  face: 'left' | 'right',
) {
  const { origin, x, y, z: up } = axesAt(at, z, projection);
  const down: Vec2 = [-up[0], -up[1]];
  return face === 'left'
    ? matrixOf(x, down, origin)
    : matrixOf([-y[0], -y[1]], down, origin);
}
function solidSvg(paths: DeskPaths, tone = 'hi', crease = 'faint') {
  const parts = [`<path class="iso-fill" d="${paths.fill}"/>`];
  paths.shades.forEach((d, shade) => {
    if (d)
      parts.push(`<path class="iso-shade" data-shade="${shade}" d="${d}"/>`);
  });
  parts.push(`<path class="iso-top" d="${paths.top}"/>`);
  if (paths.crease)
    parts.push(
      `<path class="iso-line iso-crease" data-tone="${crease}" d="${paths.crease}"/>`,
    );
  if (paths.bevel)
    parts.push(
      `<path class="iso-line iso-bevel" data-tone="${crease}" d="${paths.bevel}"/>`,
    );
  parts.push(
    `<path class="iso-line iso-edge" data-tone="${tone}" d="${paths.outline}"/>`,
  );
  return `<g class="iso-solid">${parts.join('')}</g>`;
}
const lineSvg = (d: string, tone: string) =>
  d ? `<path class="iso-line" data-tone="${tone}" d="${d}"/>` : '';

/* ------------------------------------------------------------------------ */
/* sound                                                                     */
/* ------------------------------------------------------------------------ */

const HEAVY = new Set([
  ' ',
  'Enter',
  'NumpadEnter',
  'Backspace',
  'Shift',
  'ShiftRight',
  'Tab',
  'CapsLock',
  'NumpadAdd',
  'Numpad0',
]);

interface AudioRig {
  ctx: AudioContext;
  master: GainNode;
  noiseBuf: AudioBuffer;
}

/* everything synthesised: no files. The context is made on the first gesture, as browsers require */
function makeSound(initiallyMuted: boolean): DeskSound {
  let rig: AudioRig | null = null;
  let muted = initiallyMuted;
  const ensure = (): AudioRig | null => {
    if (rig) return rig;
    if (typeof AudioContext === 'undefined') return null;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    rig = { ctx, master, noiseBuf };
    return rig;
  };
  /* the rig, if sound is on and the context is running */
  const ready = (): AudioRig | null => {
    if (muted) return null;
    const r = ensure();
    return r && r.ctx.state === 'running' ? r : null;
  };
  const jitter = (v: number, amount: number) =>
    v * (1 - amount + Math.random() * amount * 2);
  /* a filtered noise burst with a fast attack and an exponential decay */
  const noise = (
    r: AudioRig,
    t: number,
    dur: number,
    {
      type = 'bandpass',
      freq = 3000,
      q = 1,
      gain = 0.2,
      attack = 0.001,
    }: DeskNoiseOptions = {},
  ) => {
    const c = r.ctx;
    const src = c.createBufferSource();
    src.buffer = r.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(r.master);
    src.start(t, Math.random() * 0.8, dur + 0.05);
  };
  /* an oscillator gliding from f0 to f1, enveloped the same way */
  const tone = (
    r: AudioRig,
    t: number,
    dur: number,
    {
      type = 'sine',
      f0 = 200,
      f1 = f0,
      gain = 0.2,
      attack = 0.002,
      filter = 0,
    }: DeskToneOptions = {},
  ) => {
    const c = r.ctx;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = o;
    if (filter) {
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = filter;
      node = o.connect(lp);
    }
    node.connect(g).connect(r.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  };
  const sound: DeskSound = {
    unlock() {
      if (muted) return;
      const r = ensure();
      if (r && r.ctx.state === 'suspended') void r.ctx.resume();
    },
    setMuted(next: boolean) {
      muted = next;
      if (!next) sound.unlock();
    },
    /* a key going down (bottom-out click and case thock), then its lighter return click */
    key(code: string) {
      const r = ready();
      if (!r) return;
      const t = r.ctx.currentTime + 0.002;
      const heavy = HEAVY.has(code);
      const v = jitter(1, 0.15);
      noise(r, t, heavy ? 0.03 : 0.02, {
        freq: jitter(heavy ? 2300 : 3500, 0.12),
        q: 1.3,
        gain: (heavy ? 0.42 : 0.34) * v,
      });
      tone(r, t, heavy ? 0.1 : 0.055, {
        f0: jitter(heavy ? 150 : 230, 0.08),
        f1: heavy ? 70 : 115,
        gain: (heavy ? 0.42 : 0.2) * v,
      });
      if (heavy)
        noise(r, t + 0.012, 0.05, {
          type: 'highpass',
          freq: 5200,
          q: 0.7,
          gain: 0.05 * v,
        });
      noise(r, t + jitter(0.085, 0.15), 0.014, {
        freq: jitter(4300, 0.1),
        q: 1.6,
        gain: 0.12 * v,
      });
    },
    /* relay, degauss hum, static as the picture blooms, a fading flyback whine */
    powerOn() {
      const r = ready();
      if (!r) return;
      const c = r.ctx;
      const t = c.currentTime + 0.01;
      noise(r, t, 0.012, { type: 'highpass', freq: 1800, gain: 0.45 });
      tone(r, t, 0.09, { f0: 95, f1: 50, gain: 0.32 });
      const hum = c.createOscillator();
      const hum2 = c.createOscillator();
      const lp = c.createBiquadFilter();
      const g = c.createGain();
      hum.type = 'sawtooth';
      hum.frequency.value = 60;
      hum2.type = 'sine';
      hum2.frequency.value = 120;
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(380, t);
      lp.frequency.exponentialRampToValueAtTime(140, t + 1.2);
      g.gain.setValueAtTime(0.0001, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.26, t + 0.14);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
      hum.connect(lp);
      hum2.connect(lp);
      lp.connect(g).connect(r.master);
      hum.start(t);
      hum2.start(t);
      hum.stop(t + 1.3);
      hum2.stop(t + 1.3);
      for (let i = 0; i < 9; i++)
        noise(r, t + 0.12 + Math.random() * 0.4, 0.02 + Math.random() * 0.03, {
          type: 'highpass',
          freq: 2800,
          gain: 0.04 + Math.random() * 0.08,
        });
      tone(r, t + 0.2, 2.2, { f0: 15734, gain: 0.008, attack: 0.4 });
    },
    /* relay, then a falling zap as the picture collapses to a line and a dot */
    powerOff() {
      const r = ready();
      if (!r) return;
      const t = r.ctx.currentTime + 0.005;
      noise(r, t, 0.012, { type: 'highpass', freq: 1800, gain: 0.4 });
      tone(r, t, 0.26, {
        type: 'triangle',
        f0: 900,
        f1: 45,
        gain: 0.16,
        attack: 0.004,
      });
      noise(r, t, 0.32, { freq: 1300, q: 0.8, gain: 0.1, attack: 0.004 });
      tone(r, t + 0.02, 0.16, { f0: 75, f1: 40, gain: 0.22 });
    },
    close() {
      void rig?.ctx.close();
      rig = null;
    },
  };
  return sound;
}

/* ------------------------------------------------------------------------ */
/* the engine                                                                */
/* ------------------------------------------------------------------------ */

const PHRASES = ['nxui components', 'windows 98 themes', 'how does a crt work'];
const SHIFTED: Record<string, string> = {
  '~': '`',
  '!': '1',
  '@': '2',
  '#': '3',
  $: '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  _: '-',
  '+': '=',
  '{': '[',
  '}': ']',
  '|': '\\',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/',
};
const DOWN = 1.6;

type Vec = Vec3;
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec, s: number): Vec => [a[0] * s, a[1] * s, a[2] * s];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const unit = (a: Vec): Vec => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeInOut = (t: number) => {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
const bezier = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};
const freshTour = (wait: number): DeskTour => ({
  phrase: 0,
  step: 'aim',
  index: 0,
  wait,
});

export function mountDeskComputer({
  stage,
  svg,
  readout,
  status,
  muted: initiallyMuted,
}: DeskMountOptions): DeskEngine {
  const P = D.P;
  const KEYS = D.keys;
  const ac = new AbortController();
  const signal = ac.signal;
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
    return t;
  };
  const cancel = (t: number) => {
    clearTimeout(t);
    timers.delete(t);
  };

  const need = <T extends Element>(el: T | null, what: string): T => {
    if (!el) throw new Error(`DeskComputer: the figure has no ${what}`);
    return el;
  };
  const part = <T extends Element = SVGGraphicsElement>(name: string) =>
    need(svg.querySelector<T>(`[data-part="${name}"]`), name);
  const keyEls = KEYS.map((_, i) =>
    need(svg.querySelector<SVGGElement>(`[data-key="${i}"]`), `key ${i}`),
  );
  const query = part<SVGTextElement>('query');
  const caret = part('caret');
  const crt = part('crt');
  const beam = part('beam');
  const dot = part('dot');
  const glass = need(
    svg.querySelector<SVGGraphicsElement>('.pc-glass'),
    'glass',
  );
  const monLed = part('mon-led');
  const hddLed = part('hdd-led');
  const cdLed = part('cd-led');
  const kbLeds = [0, 1, 2].map((i) => part(`kb-led${i}`));
  const mouseEl = part('mouse');
  const mouseHalo = part('mouse-halo');
  const mousePress = part('mouse-press');
  const cablePaths = Array.from(
    part('mouse-cable').querySelectorAll<SVGPathElement>('path'),
  );
  const cursorEl = part('cursor');
  const arrowEl = part('arrow');
  const ibeamEl = part('ibeam');
  const autoplayEl = part('autoplay');
  const trayEl = part('cd-tray');
  const flyEl = part('fly');
  const caseDisc = part('case-disc');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const down = axisVector(P, [0, 0, -1]);
  const follow = (v: number, to: number, dt: number, tau: number) =>
    still.matches ? to : v + (to - v) * (1 - Math.exp(-dt / tau));
  const pt = (p: Vec) => {
    const s = iso(p, P);
    return `${s[0].toFixed(2)} ${s[1].toFixed(2)}`;
  };

  /* ── state ── */
  const keyState: DeskKeyState[] = KEYS.map(() => ({ at: 0, held: 0 }));
  const active = new Set<number>();
  let line = '';
  let lastKey = '';
  let power = 0;
  let powerClock = 9;
  let searches = 0;
  let hdd = 0;
  let caps = false;
  let frame = 0;
  let previous = 0;
  let visible = false;
  let touring = false;
  let idleTimer = 0;
  let booted = false;
  let alive = true;
  let tour = freshTour(0.4);
  const waiters: DeskWaiter[] = [];
  /* the mouse: its centre's offset on the pad (world units), its target, and what the cursor is over */
  const mouse: DeskMouseState = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    tau: 0.32,
    press: 0,
    dragging: false,
    drawn: '',
  };
  let cursorOver = '';
  /* the CD: where the disc is, the tray's travel (0 shut, 1 out), the disc's flight, AutoPlay */
  const cd: DeskCdState = {
    at: 'case',
    tray: 0,
    trayTo: 0,
    flight: null,
    spin: 0,
    busy: false,
    read: 0,
    autoplay: 0,
    autoplayTo: 0,
    autoplayTimer: 0,
    drawnTray: -1,
  };
  const until = (test: () => boolean) =>
    new Promise<void>((done) => {
      waiters.push({ test, done });
      run();
    });
  const sleep = (ms: number) =>
    new Promise<void>((done) => later(done, still.matches ? 0 : ms));

  const sfx = makeSound(initiallyMuted);
  /* true while handling the visitor's own input, so the idle tour stays silent */
  let byUser = false;
  const asUser = (fn: () => void) => {
    byUser = true;
    try {
      fn();
    } finally {
      byUser = false;
    }
  };
  for (const type of ['pointerdown', 'keydown'] as const)
    stage.addEventListener(type, () => sfx.unlock(), { capture: true, signal });

  /* ── keyboard and screen ── */
  const indexOf = (code: string) => KEYS.indexOf(code);
  let repeating = false;
  function press(code: string, hold = 0.09) {
    const i = indexOf(code);
    const state = keyState[i];
    if (i < 0 || !state) return;
    state.held = hold;
    active.add(i);
    if (byUser && !repeating && code !== 'Shift' && code !== 'ShiftRight')
      sfx.key(code);
    else if (byUser && !repeating && state.at === 0) sfx.key(code);
    run();
  }
  function type(char: string) {
    if (!power) return;
    const lower = char.toLowerCase();
    const code = SHIFTED[char] || lower;
    if (indexOf(code) < 0) return;
    if (SHIFTED[char] || char !== lower) press('Shift', 0.14);
    press(code);
    lastKey = char === ' ' ? 'space' : char;
    if (line.length < 60) line += char;
    write();
  }
  function erase() {
    if (!power) return;
    press('Backspace');
    lastKey = 'backspace';
    line = line.slice(0, -1);
    write();
  }
  function enter() {
    if (!power) return;
    press('Enter');
    lastKey = 'return';
    if (line.trim()) {
      searches++;
      hdd = 0.9;
      status.textContent = `Searching for ${line}.`;
    }
    line = '';
    write();
    run();
  }
  function write() {
    query.textContent = line;
    let shown = line;
    while (shown.length && query.getComputedTextLength() > D.queryMax) {
      shown = shown.slice(1);
      query.textContent = shown;
    }
    caret.setAttribute(
      'x',
      String(D.queryX + (shown ? query.getComputedTextLength() + 0.3 : 0)),
    );
    const parts = power ? ['on', `${line.length} chars`] : ['off'];
    if (power && searches)
      parts.push(`${searches}${searches === 1 ? ' search' : ' searches'}`);
    if (cd.at === 'drive') parts.push('CD in drive');
    if (power && lastKey) parts.push(`key ${lastKey}`);
    const text = parts.join(' · ');
    if (readout && readout.textContent !== text) readout.textContent = text;
  }
  function setPower(next: number) {
    if (next === power) return;
    power = next;
    if (byUser) {
      if (power) sfx.powerOn();
      else sfx.powerOff();
    }
    powerClock = still.matches ? 9 : 0;
    monLed.style.opacity = power ? '' : '0.15';
    status.textContent = power ? 'Screen on.' : 'Screen off.';
    write();
    run();
  }
  function crtFrame() {
    const t = powerClock;
    let sx = 1;
    let sy = 1;
    let beamAt = 0;
    let dotAt = 0;
    if (power) {
      if (t < 0.14) {
        sx = ease(t / 0.14);
        sy = 0.012;
        beamAt = 1;
      } else if (t < 0.36) {
        sy = 0.012 + 0.988 * ease((t - 0.14) / 0.22);
        beamAt = 1 - ease((t - 0.14) / 0.22);
      }
    } else if (t < 0.1) {
      sy = 1 - 0.988 * ease(t / 0.1);
      beamAt = ease(t / 0.1);
    } else if (t < 0.26) {
      sy = 0.012;
      sx = 1 - ease((t - 0.1) / 0.16);
      beamAt = 1;
    } else {
      sx = 0;
      sy = 0;
      dotAt = Math.max(0, 1 - (t - 0.26) / 0.5);
    }
    crt.setAttribute(
      'transform',
      `translate(0 ${-D.crtMid}) scale(${Math.max(sx, 0.0001).toFixed(3)} ${Math.max(sy, 0.0001).toFixed(3)}) translate(0 ${D.crtMid})`,
    );
    beam.setAttribute(
      'transform',
      `translate(0 ${-D.crtMid}) scale(${Math.max(sx, 0.001).toFixed(3)} 1) translate(0 ${D.crtMid})`,
    );
    beam.style.opacity = beamAt.toFixed(2);
    dot.style.opacity = dotAt.toFixed(2);
    glass.style.fill = power || t < 0.26 ? '' : 'var(--pc-glass-off)';
    return t > 0.8;
  }

  /* ── the mouse, its cable and the cursor ── */
  const M = D.mouse;
  const ax = axisVector(P, [1, 0, 0]);
  const ay = axisVector(P, [0, 1, 0]);
  const det = ax[0] * ay[1] - ay[0] * ax[1];
  const toWorld = (dx: number, dy: number): Vec2 => [
    (dx * ay[1] - ay[0] * dy) / det,
    (ax[0] * dy - dx * ax[1]) / det,
  ];
  const svgPoint = (event: PointerEvent) => {
    const p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    const m = svg.getScreenCTM();
    return m ? p.matrixTransform(m.inverse()) : p;
  };
  function aimMouse(x: number, y: number, tau = 0.32) {
    mouse.tx = clamp(x, M.range.x[0], M.range.x[1]);
    mouse.ty = clamp(y, M.range.y[0], M.range.y[1]);
    mouse.tau = tau;
    run();
  }
  /* the cursor on the CRT moves with the mouse: forward (−x) is up, right (−y) is right */
  const cursorAt = (x: number, y: number): Vec2 => [
    clamp(D.cursor.u - y * 1.55, D.screen.u0, D.screen.u1),
    clamp(D.cursor.z - x * 1.4, D.screen.z0, D.screen.z1),
  ];
  const mouseFor = (u: number, z: number): Vec2 => [
    (D.cursor.z - z) / 1.4,
    (D.cursor.u - u) / 1.55,
  ];
  function overOf(u: number, z: number) {
    const S = D.search;
    if (cd.autoplay > 0.5 && u > 6 && u < 18 && z > 52.4 && z < 57)
      return 'open';
    if (u > S.u0 && u < S.u1 && z > S.z0 && z < S.z1) return 'search';
    return '';
  }
  function drawMouse() {
    const shift = translateAlong(P, [mouse.x, mouse.y, 0]);
    mouseEl.setAttribute('transform', shift);
    mouseHalo.setAttribute('transform', shift);
    mousePress.setAttribute(
      'transform',
      mouse.press > 0
        ? translateAlong(P, [
            0,
            0,
            -0.45 * Math.sin(Math.PI * clamp(mouse.press / 0.16, 0, 1)),
          ])
        : '',
    );
    /* the cable: from the strain relief over the pad, down its edge, into the static run on the floor */
    const tip: Vec = [M.tip[0] + mouse.x, M.tip[1] + mouse.y, M.tip[2]];
    const edge: Vec = [
      M.edge[0],
      clamp(lerp(M.edge[1], tip[1], 0.55), M.padY[0], M.padY[1]),
      M.edge[2],
    ];
    const drop = unit([M.anchor[0] - edge[0], M.anchor[1] - edge[1], 0]);
    const reach = Math.max(
      4,
      0.42 * Math.hypot(edge[0] - tip[0], edge[1] - tip[1]),
    );
    const d = `M${pt(tip)}C${pt(add(tip, mul(M.dir, reach)))} ${pt(sub(edge, mul(drop, 4)))} ${pt(edge)}C${pt(add(edge, mul(drop, 2.4)))} ${pt(sub(M.anchor, mul(M.tangent, 2.4)))} ${pt(M.anchor)}`;
    if (d !== mouse.drawn) {
      mouse.drawn = d;
      const w = 2 * M.r * D.scale;
      const widths = [w + 0.95, w - 0.95, w * 0.28];
      cablePaths.forEach((path, i) => {
        path.setAttribute('d', d);
        path.style.strokeWidth = (widths[i] ?? w).toFixed(2);
      });
      cablePaths[2]?.setAttribute(
        'transform',
        `translate(${(-0.16 * w).toFixed(2)} ${(-0.22 * w).toFixed(2)})`,
      );
    }
    const [u, z] = cursorAt(mouse.x, mouse.y);
    cursorEl.setAttribute(
      'transform',
      `translate(${u.toFixed(2)} ${(-z).toFixed(2)})`,
    );
    const over = overOf(u, z);
    if (over !== cursorOver) {
      cursorOver = over;
      arrowEl.style.display = over === 'search' ? 'none' : '';
      ibeamEl.style.display = over === 'search' ? '' : 'none';
    }
  }
  function mouseClick() {
    mouse.press = 0.16;
    run();
    if (!power) return;
    if (cursorOver === 'search') {
      status.textContent = 'Search box focused.';
      caret.style.animation = 'none';
      void caret.getBBox();
      caret.style.animation = '';
    }
    if (cursorOver === 'open') {
      cd.autoplayTo = 0;
      status.textContent = 'AutoPlay closed.';
    }
  }

  /* ── the CD-ROM: tray, disc and AutoPlay ── */
  const T = D.tray;
  const discAtTray = (ext: number): Vec => [
    T.front + ext - T.plate.t - 21.5,
    (T.body.y0 + T.body.y1) / 2,
    T.body.z + T.body.h + 0.05,
  ];
  const frontPlane = (x: number) => sideMatrix([x, 0], 0, P, 'right');
  const faceRect = (
    u0: number,
    z0: number,
    u1: number,
    z1: number,
    r: number,
  ) =>
    pathOf(
      roundedPlan({ x: u0, y: z0, w: u1 - u0, d: z1 - z0, r }, 3).map(
        ([u, z]): Vec2 => [u, -z],
      ),
      true,
    );
  function discMarkup(c: Vec, spin: number) {
    const R = D.disc.r;
    const [x, y, z] = c;
    const circle = (r: number, n: number) =>
      planOutline({ x: x - r, y: y - r, w: 2 * r, d: 2 * r, r }, z, P, n);
    const sheen: Vec[] = [[x, y, z]];
    for (let i = 0; i <= 12; i++) {
      const a = spin - 0.3 + (i / 12) * 0.9;
      sheen.push([x + 18.4 * Math.cos(a), y + 18.4 * Math.sin(a), z]);
    }
    return (
      `<path class="pc-disc" fill-rule="evenodd" d="${circle(R, 24)}${circle(2, 10)}"/>` +
      `<path class="pc-disc-sheen" d="${pathOf(
        sheen.map((p) => iso(p, P)),
        true,
      )}"/>` +
      lineSvg(ring(x, y, R, z, P, 96), 'hi') +
      lineSvg(ring(x, y, 7.6, z, P, 48), 'mid') +
      lineSvg(ring(x, y, 4.4, z, P, 32), 'lo') +
      lineSvg(ring(x, y, 2, z, P, 20), 'hi')
    );
  }
  function plateMarkup(ext: number) {
    const x = T.front + ext;
    const plate = {
      x: x - T.plate.t,
      y: T.y0,
      w: T.plate.t,
      d: T.y1 - T.y0,
      r: 0.4,
    };
    const u0 = -T.y1;
    const u1 = -T.y0;
    const reading = cd.read > 0 && Math.sin(performance.now() / 45) > 0;
    const face =
      `<g transform="${frontPlane(x)}">` +
      `<path class="iso-line" data-tone="lo" d="${faceRect(u0 + 3, 132.2, u1 - 12, 136.6, 0.6)}"/>` +
      `<path class="iso-line" data-tone="hi" d="${faceRect(u1 - 9, 130.4, u1 - 3, 132.4, 0.6)}"/>` +
      `<circle class="pc-led-cd"${reading ? ' data-on=""' : ''} cx="${u0 + 4}" cy="-130.6" r="0.6"/></g>`;
    return (
      solidSvg(slabOf(plate, T.plate.z0, T.plate.z1 - T.plate.z0, P, 2, 0.3)) +
      face
    );
  }
  const clipId = `pdesk-tray-${Math.random().toString(36).slice(2, 8)}`;
  function trayMarkup() {
    const ext = cd.tray * T.travel;
    if (ext < 0.02) return '';
    const out: string[] = [];
    /* the bay behind the tray is a dark opening while the tray is out */
    out.push(
      `<g transform="${frontPlane(T.front)}"><path class="pc-slot" d="${faceRect(T.bay.u0, T.bay.z0, T.bay.u1, T.bay.z1, 0.8)}"/></g>`,
    );
    const bodyW = ext - T.plate.t;
    if (bodyW > 0.2) {
      const body = {
        x: T.front,
        y: T.body.y0,
        w: bodyW,
        d: T.body.y1 - T.body.y0,
        r: 0.5,
      };
      const top = T.body.z + T.body.h;
      out.push(solidSvg(slabOf(body, T.body.z, T.body.h, P, 2, 0.3)));
      const c = discAtTray(ext);
      const well = planOutline(
        { x: c[0] - 20.2, y: c[1] - 20.2, w: 40.4, d: 40.4, r: 20.2 },
        top,
        P,
        24,
      );
      out.push(
        `<clipPath id="${clipId}"><path d="${planOutline(body, top, P, 2)}"/></clipPath><g clip-path="url(#${clipId})">`,
      );
      out.push(`<path class="iso-line" data-tone="faint" d="${well}"/>`);
      if (cd.at === 'drive' && !cd.flight) out.push(discMarkup(c, cd.spin));
      out.push('</g>');
    }
    out.push(plateMarkup(ext));
    return out.join('');
  }
  function flightPoint(t: number, toDrive: boolean): Vec {
    const home = D.disc.home;
    const end = discAtTray(T.travel);
    const [a, b] = toDrive ? [home, end] : [end, home];
    const c1 = add(a, [0, 0, toDrive ? 85 : 70]);
    const c2 = add(b, [0, 0, toDrive ? 70 : 85]);
    return [
      bezier(a[0], c1[0], c2[0], b[0], t),
      bezier(a[1], c1[1], c2[1], b[1], t),
      bezier(a[2], c1[2], c2[2], b[2], t),
    ];
  }
  function drawCd(now: number) {
    if (cd.drawnTray !== cd.tray || cd.flight || cd.read > 0) {
      cd.drawnTray = cd.tray;
      setSvgMarkup(trayEl, trayMarkup());
    }
    if (cd.flight) {
      const t = easeInOut(cd.flight.t);
      const p = flightPoint(t, cd.flight.toDrive);
      /* near the tray the disc passes behind the tray's front plate: draw the plate over it there */
      const nearTray = cd.flight.toDrive ? t > 0.82 : t < 0.18;
      setSvgMarkup(
        flyEl,
        discMarkup(p, cd.spin) +
          (nearTray ? plateMarkup(cd.tray * T.travel) : ''),
      );
    } else if (flyEl.firstChild) flyEl.replaceChildren();
    if (cd.read > 0) cdLed.toggleAttribute('data-on', Math.sin(now / 45) > 0);
    else cdLed.removeAttribute('data-on');
    const a = cd.autoplay;
    autoplayEl.style.opacity = a.toFixed(3);
    autoplayEl.setAttribute(
      'transform',
      `translate(0 -66.5) scale(${(0.92 + 0.08 * ease(a)).toFixed(3)}) translate(0 66.5)`,
    );
  }
  const trayTo = (to: number) => {
    cd.trayTo = to;
    run();
    return until(() => cd.tray === to);
  };
  const fly = (toDrive: boolean) => {
    cd.flight = { t: 0, toDrive };
    run();
    return until(() => !cd.flight);
  };
  async function loadCd() {
    if (cd.busy || cd.at !== 'case') return;
    cd.busy = true;
    status.textContent = 'Loading the CD.';
    cd.read = 0.6;
    await trayTo(1);
    caseDisc.style.display = 'none';
    await fly(true);
    cd.at = 'drive';
    write();
    await sleep(250);
    await trayTo(0);
    cd.read = 2.2;
    await sleep(700);
    if (power) {
      cd.autoplayTo = 1;
      status.textContent = 'AutoPlay: CD-R in drive D.';
      cancel(cd.autoplayTimer);
      cd.autoplayTimer = later(() => {
        cd.autoplayTo = 0;
        run();
      }, 5200);
    }
    run();
    cd.busy = false;
  }
  async function ejectCd() {
    if (cd.busy) return;
    cd.busy = true;
    cd.autoplayTo = 0;
    cancel(cd.autoplayTimer);
    if (cd.at === 'drive') {
      status.textContent = 'Ejecting the CD.';
      cd.read = 0.5;
      await trayTo(1);
      await sleep(200);
      await fly(false);
      cd.at = 'case';
      caseDisc.style.display = '';
      write();
      await sleep(200);
      await trayTo(0);
    } else {
      /* an empty drive just opens and shuts */
      await trayTo(cd.trayTo ? 0 : 1);
    }
    cd.busy = false;
  }

  /* ── the idle tour ── */
  function tourStep(dt: number) {
    tour.wait -= dt;
    if (tour.wait > 0) return;
    const phrase = PHRASES[tour.phrase] ?? '';
    const S = D.search;
    switch (tour.step) {
      case 'aim': {
        const [x, y] = mouseFor(
          S.u0 + 6 + Math.random() * 6,
          (S.z0 + S.z1) / 2,
        );
        aimMouse(x, y);
        tour.step = 'click';
        tour.wait = 1.1;
        break;
      }
      case 'click':
        mouseClick();
        tour.step = 'type';
        tour.index = 0;
        tour.wait = 0.45;
        break;
      case 'type':
        if (tour.index < phrase.length) {
          const char = phrase.charAt(tour.index++);
          type(char);
          tour.wait = 0.08 + Math.random() * 0.12 + (char === ' ' ? 0.08 : 0);
        } else {
          tour.step = 'enter';
          tour.wait = 0.8;
        }
        break;
      case 'enter':
        enter();
        tour.step = 'drift';
        tour.wait = 0.9;
        break;
      case 'drift':
        aimMouse(
          lerp(M.range.x[0], M.range.x[1], Math.random()),
          lerp(M.range.y[0], M.range.y[1], Math.random()),
          0.5,
        );
        if (tour.phrase === PHRASES.length - 1) {
          tour.step = 'cd';
          tour.wait = 1.6;
        } else {
          tour.phrase++;
          tour.step = 'aim';
          tour.wait = 1.4;
        }
        break;
      case 'cd':
        void loadCd();
        tour.step = 'eject';
        tour.wait = 8.5;
        break;
      case 'eject':
        void ejectCd();
        tour.step = 'off';
        tour.wait = 5.5;
        break;
      case 'off':
        setPower(0);
        tour.step = 'on';
        tour.wait = 1.8;
        break;
      case 'on':
        setPower(1);
        tour = freshTour(1.4);
        break;
    }
  }

  /* ── the frame loop: it runs only while something is moving and the figure can be seen ── */
  function tick(now: number) {
    if (!alive) return;
    const dt = previous ? Math.min((now - previous) / 1000, 0.1) : 1 / 60;
    previous = now;
    const calm = still.matches;
    if (touring) tourStep(dt);
    powerClock += dt;
    const settledCrt = crtFrame();
    if (hdd > 0) {
      hdd = Math.max(0, hdd - dt);
      hddLed.toggleAttribute(
        'data-on',
        hdd > 0 && Math.sin(now / 37) + Math.sin(now / 23) > 0.2,
      );
    } else hddLed.removeAttribute('data-on');
    for (const i of active) {
      const s = keyState[i];
      const el = keyEls[i];
      if (!s || !el) continue;
      s.held = Math.max(0, s.held - dt);
      const want = s.held > 0 ? DOWN : 0;
      s.at = calm
        ? want
        : s.at + (want - s.at) * (1 - Math.exp(-dt / (want ? 0.022 : 0.06)));
      if (Math.abs(want - s.at) < 0.01) s.at = want;
      el.setAttribute(
        'transform',
        `translate(${(down[0] * s.at).toFixed(2)} ${(down[1] * s.at).toFixed(2)})`,
      );
      el.toggleAttribute('data-down', s.at > 0.5);
      if (!s.held && s.at === 0) active.delete(i);
    }
    mouse.x = follow(mouse.x, mouse.tx, dt, mouse.tau);
    mouse.y = follow(mouse.y, mouse.ty, dt, mouse.tau);
    if (Math.abs(mouse.x - mouse.tx) < 0.005) mouse.x = mouse.tx;
    if (Math.abs(mouse.y - mouse.ty) < 0.005) mouse.y = mouse.ty;
    mouse.press = Math.max(0, mouse.press - dt);
    drawMouse();
    /* the tray runs on a motor (eased toward its stop); the disc flies on a timed arc */
    if (cd.tray !== cd.trayTo) {
      cd.tray = calm ? cd.trayTo : follow(cd.tray, cd.trayTo, dt, 0.17);
      if (Math.abs(cd.tray - cd.trayTo) < 0.004) cd.tray = cd.trayTo;
    }
    if (cd.flight) {
      cd.flight.t = calm ? 1 : cd.flight.t + dt / 1.15;
      cd.spin += dt * 9;
      if (cd.flight.t >= 1) cd.flight = null;
    }
    cd.read = Math.max(0, cd.read - dt);
    cd.autoplay = follow(cd.autoplay, cd.autoplayTo, dt, 0.12);
    if (Math.abs(cd.autoplay - cd.autoplayTo) < 0.004)
      cd.autoplay = cd.autoplayTo;
    drawCd(now);
    for (let i = waiters.length - 1; i >= 0; i--) {
      const waiter = waiters[i];
      if (waiter && waiter.test()) {
        waiter.done();
        waiters.splice(i, 1);
      }
    }
    const busy =
      touring ||
      active.size > 0 ||
      hdd > 0 ||
      !settledCrt ||
      mouse.x !== mouse.tx ||
      mouse.y !== mouse.ty ||
      mouse.press > 0 ||
      mouse.dragging ||
      cd.tray !== cd.trayTo ||
      cd.flight !== null ||
      cd.read > 0 ||
      cd.autoplay !== cd.autoplayTo ||
      waiters.length > 0;
    frame = visible && busy ? requestAnimationFrame(tick) : 0;
  }
  function run() {
    if (!frame && visible && alive) {
      previous = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  /* the visitor takes over from the tour; it resumes after nine quiet seconds */
  function takeOver() {
    if (touring) {
      touring = false;
      tour = freshTour(0.4);
      line = '';
      if (booted) setPower(1);
      write();
    }
    cancel(idleTimer);
    idleTimer = later(() => {
      if (still.matches) return;
      touring = true;
      line = '';
      setPower(1);
      write();
      run();
    }, 9000);
  }

  /* ── input ── */
  function onKey(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key;
    if (key === 'Tab') return;
    takeOver();
    if (key === 'Escape') {
      event.preventDefault();
      setPower(power ? 0 : 1);
      return;
    }
    if (key === 'Backspace') {
      event.preventDefault();
      erase();
      return;
    }
    if (key === 'Enter') {
      event.preventDefault();
      enter();
      return;
    }
    if (key === 'CapsLock') {
      caps = !caps;
      const led = kbLeds[1];
      if (led) led.style.opacity = caps ? '' : '0.25';
      press('CapsLock');
      return;
    }
    if (key === 'Shift') {
      press(event.code === 'ShiftRight' ? 'ShiftRight' : 'Shift', 0.14);
      return;
    }
    if (key.length === 1) {
      event.preventDefault();
      type(key);
      return;
    }
    if (indexOf(key) >= 0) press(key);
  }
  stage.addEventListener(
    'keydown',
    (event) => {
      repeating = event.repeat;
      asUser(() => onKey(event));
      repeating = false;
    },
    { signal },
  );
  let drag: DeskDrag | null = null;
  mouseEl.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button > 0) return;
      event.preventDefault();
      takeOver();
      const p = svgPoint(event);
      drag = {
        id: event.pointerId,
        sx: p.x,
        sy: p.y,
        mx: mouse.tx,
        my: mouse.ty,
        moved: 0,
      };
      mouse.dragging = true;
      stage.setAttribute('data-dragging', '');
      stage.setPointerCapture(event.pointerId);
      run();
    },
    { signal },
  );
  stage.addEventListener(
    'pointermove',
    (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const p = svgPoint(event);
      drag.moved = Math.max(
        drag.moved,
        Math.hypot(p.x - drag.sx, p.y - drag.sy),
      );
      const [wx, wy] = toWorld(p.x - drag.sx, p.y - drag.sy);
      aimMouse(drag.mx + wx, drag.my + wy, 0.05);
    },
    { signal },
  );
  const endDrag = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    const click = drag.moved < 2.5;
    drag = null;
    mouse.dragging = false;
    stage.removeAttribute('data-dragging');
    if (stage.hasPointerCapture(event.pointerId))
      stage.releasePointerCapture(event.pointerId);
    if (click) mouseClick();
    run();
  };
  stage.addEventListener('pointerup', endDrag, { signal });
  stage.addEventListener('pointercancel', endDrag, { signal });
  function onClick(event: MouseEvent) {
    stage.focus({ preventScroll: true });
    const target = event.target;
    if (!(target instanceof Element) || target.closest('[data-part="mouse"]'))
      return;
    const key = target.closest<SVGElement>('[data-key]');
    if (key) {
      takeOver();
      const code = KEYS[Number(key.dataset.key)];
      if (code === undefined) return;
      if (code.length === 1) type(code);
      else if (code === 'Backspace') erase();
      else if (code === 'Enter' || code === 'NumpadEnter') enter();
      else press(code);
      return;
    }
    if (target.closest('[data-part="cd-case"]')) {
      takeOver();
      if (cd.at === 'case') void loadCd();
      return;
    }
    if (
      target.closest('[data-part="cd-bay"]') ||
      target.closest('[data-part="cd-tray"]')
    ) {
      takeOver();
      void ejectCd();
      return;
    }
    if (target.closest('[data-part="mon-power"]')) {
      takeOver();
      setPower(power ? 0 : 1);
    }
  }
  svg.addEventListener('click', (event) => asUser(() => onClick(event)), {
    signal,
  });
  /* the focus ring is for keyboard users: hide it once the figure has been used with a pointer */
  stage.addEventListener(
    'pointerdown',
    () => stage.setAttribute('data-pointer', ''),
    {
      signal,
    },
  );
  stage.addEventListener('blur', () => stage.removeAttribute('data-pointer'), {
    signal,
  });
  /* double-clicks and drags never select the drawing's text */
  stage.addEventListener('selectstart', (event) => event.preventDefault(), {
    signal,
  });

  /* ── the assembly: shadows first, then each piece drops in, a wave across the keys, the cables last ── */
  let introTimer = 0;
  function playIntro() {
    stage.classList.remove('pdesk--intro');
    if (still.matches) return 0;
    void stage.getBoundingClientRect();
    stage.classList.add('pdesk--intro');
    let last = 0;
    stage.querySelectorAll<SVGElement>('.it').forEach((el) => {
      last = Math.max(
        last,
        Number.parseFloat(el.style.getPropertyValue('--d')) || 0,
      );
    });
    cancel(introTimer);
    introTimer = later(
      () => stage.classList.remove('pdesk--intro'),
      last + 800,
    );
    return last;
  }

  /* ── boot: assemble, then the CRT warms up and the tour begins ── */
  for (const led of kbLeds.slice(1)) led.style.opacity = '0.25';
  write();
  crtFrame();
  drawMouse();
  const assembled = playIntro();
  later(
    () => {
      booted = true;
      setPower(1);
      if (!still.matches) {
        touring = true;
        tour.wait = 1.4;
      }
      run();
    },
    still.matches ? 0 : assembled + 450,
  );

  return {
    replayIntro: () => void playIntro(),
    setMuted: (next) => sfx.setMuted(next),
    setVisible(next) {
      visible = next;
      if (visible) run();
    },
    destroy() {
      alive = false;
      ac.abort();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      waiters.length = 0;
      stage.classList.remove('pdesk--intro');
      sfx.close();
    },
  };
}
