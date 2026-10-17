import { MAX_JETS } from './flying-button-shaders';
import { SMOKE, createSim } from './flying-button-sim';
import type {
  FlyingButtonBack,
  FlyingButtonEngine,
  FlyingButtonEngineArgs,
  FlyingButtonJets,
  FlyingButtonNozzle,
  FlyingButtonPiece,
  FlyingButtonRampGeo,
  FlyingButtonSim,
  FlyingButtonSize,
  FlyingButtonSizeSpec,
  FlyingButtonState,
  FlyingButtonTrack,
  FlyingButtonTurn,
} from './types';

const G = 1100;
const SPRING = 380;
const DAMP = 10;
const REST = G / (2 * SPRING);
const POD_H = 5;
const TILT_MAX = 0.55;
const G_RIDE = G * 0.75;
const FLIP_TIME = 0.42;
export const SIZES: Record<FlyingButtonSize, FlyingButtonSizeSpec> = {
  small: { h: 36, px: 16, fs: 13, k: 0.82 },
  medium: { h: 44, px: 22, fs: 14, k: 1 },
  large: { h: 52, px: 26, fs: 16, k: 1.18 },
  'extra-large': { h: 60, px: 30, fs: 18, k: 1.36 },
};

const at = (a: ArrayLike<number>, i: number): number => a[i] ?? 0;
const cloneHtml = (el: HTMLElement): HTMLElement => {
  const c = el.cloneNode(true);
  return c instanceof HTMLElement ? c : document.createElement('span');
};
const ORIGIN: [number, number, number] = [0, 0, 0];
const corner = (
  a: [number, number, number][],
  i: number,
): [number, number, number] => a[i] ?? ORIGIN;
const SHADE_TINT = [0.0, 0.012, 0.045];
export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
export const num = (v: unknown, d: number) =>
  Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : d;
const smooth = (t: number) => {
  const s = clamp(t, 0, 1);
  return s * s * (3 - 2 * s);
};
const jerk = (t: number) => {
  const s = clamp(t, 0, 1);
  return s * s * s * (10 + s * (6 * s - 15));
};
const jerkV = (t: number) => {
  const s = clamp(t, 0, 1);
  return 30 * s * s * (1 - s) * (1 - s);
};
const jerkA = (t: number) => {
  const s = clamp(t, 0, 1);
  return 60 * s * (1 - s) * (1 - 2 * s);
};
const wave = (t: number, k: number) =>
  Math.sin(t * 1.31 + k) * 0.5 +
  Math.sin(t * 2.73 + k * 1.7) * 0.3 +
  Math.sin(t * 5.19 + k * 2.3) * 0.2;
const waveD = (t: number, k: number) =>
  Math.cos(t * 1.31 + k) * 0.655 +
  Math.cos(t * 2.73 + k * 1.7) * 0.819 +
  Math.cos(t * 5.19 + k * 2.3) * 1.038;

const rgb = (hex?: string): [number, number, number] => {
  const h = String(hex || '').replace('#', '');
  const v =
    h.length === 3 ? h.replace(/(.)/g, '$1$1') : h.padEnd(6, '0').slice(0, 6);
  const n = Number.parseInt(v, 16);
  if (!Number.isFinite(n)) return [1, 1, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export function createEngine({
  root,
  canvas,
  button,
  cursor,
  ramp,
  props,
}: FlyingButtonEngineArgs): FlyingButtonEngine {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  const s: FlyingButtonState = {
    W: 0,
    H: 0,
    dpr: 1,
    bw: 0,
    bh: 0,
    x: 0,
    vx: 0,
    y: -REST,
    vy: 0,
    th: 0,
    w: 0,
    fvx: 0,
    fvy: 0,
    thrust: [0, 0, 0, 0],
    delay: [0, 0, 0, 0],
    phase: 'rest',
    pt: 0,
    clock: 0,
    seed: Math.random() * 100,
    wind: 1,
    alt: 160,
    climbT: 1.6,
    y0: 0,
    vrPrev: 0,
    hold: 2.4,
    xRef: 0,
    landX: 0,
    boost: false,
    contact: true,
    placed: false,
    track: null,
    back: null,
    flip: null,
    rampKey: '',
    rampGeo: null,
    strip: null,
    u: 0,
    v: 0,
    target: { x: 0, y: 0 },
    pointer: { in: false, x: 0, y: 0, type: 'mouse' },
    off: { x: 0, y: 0 },
    attached: false,
    hover: false,
    armed: true,
    carry: false,
    pressed: false,
    press: null,
    drag: null,
    suppress: false,
    lastC: null,
    lastTh: 0,
    quiet: 0,
    running: false,
    visible: true,
    last: 0,
    raf: 0,
    simTime: 0,
    activity: 0,
  };

  let sim: FlyingButtonSim | null = null;
  if (gl) {
    const floatOk =
      gl.getExtension('EXT_color_buffer_float') ||
      gl.getExtension('EXT_color_buffer_half_float');
    if (floatOk) {
      try {
        sim = createSim(gl);
      } catch {
        sim = null;
      }
    }
  }

  const still = () => props.current.reducedMotion;
  const scale = () => (SIZES[props.current.size] || SIZES.medium).k;
  const podH = () => POD_H * scale();
  const count = () =>
    clamp(Math.round(num(props.current.jets, 2)), 1, MAX_JETS);
  const offsets = () => {
    const n = count();
    if (n === 1) return [0];
    const a = s.bw * (n === 2 ? 0.3 : 0.34);
    return Array.from({ length: n }, (_, k) => a * ((2 * k) / (n - 1) - 1));
  };
  const feet = () => {
    const xs = offsets();
    return xs.length > 1
      ? [at(xs, 0), at(xs, xs.length - 1)]
      : [-0.3 * s.bw, 0.3 * s.bw];
  };
  const totalThrust = () =>
    at(s.thrust, 0) + at(s.thrust, 1) + at(s.thrust, 2) + at(s.thrust, 3);
  const flying = () =>
    s.phase === 'ignite' ||
    s.phase === 'climb' ||
    s.phase === 'hover' ||
    s.phase === 'descend' ||
    s.phase === 'drag';
  const riding = () =>
    s.phase === 'drive' ||
    s.phase === 'loop' ||
    s.phase === 'flip' ||
    s.phase === 'return';
  const xLimits = (): [number, number] => [
    s.bw / 2 + 4,
    Math.max(s.bw / 2 + 4, s.W - s.bw / 2 - 4),
  ];
  const rampOn = () => Boolean(props.current.ramp);

  const rampGeo = (): FlyingButtonRampGeo => {
    const base = podH() + s.bh / 2;
    const key = `${s.W}|${s.H}|${s.bw}|${base}`;
    if (s.rampKey === key && s.rampGeo) return s.rampGeo;
    const r = Math.max(s.H * 0.24, podH() + s.bh + 40);
    const K = 1 / r;
    const ease = r * 0.4;
    const arc = (r * Math.PI) / 2 - ease;
    const build = (rise: number, top: number) => {
      const segs: [number, number, number][] = [
        [ease, 0, K],
        [arc, K, K],
        [ease, K, 0],
        [rise, 0, 0],
        [ease, 0, K],
        [arc, K, K],
        [ease, K, 0],
        [top, 0, 0],
      ];
      const g = { ss: [0], xs: [0], ys: [0], ps: [0], ks: [0] };
      let x = 0;
      let y = 0;
      let a = 0;
      let d = 0;
      segs.forEach(([len, k0, k1]) => {
        const n = Math.max(1, Math.round(len / 1.5));
        const h = len / n;
        for (let j = 0; j < n; j += 1) {
          const km = k0 + (k1 - k0) * ((j + 0.5) / n);
          const am = a + (km * h) / 2;
          x += Math.cos(am) * h;
          y += Math.sin(am) * h;
          a += km * h;
          d += h;
          g.ss.push(d);
          g.xs.push(x);
          g.ys.push(y);
          g.ps.push(a);
          g.ks.push(k0 + (k1 - k0) * ((j + 1) / n));
        }
      });
      return g;
    };
    const bends = build(0, 0);
    const rise = Math.max(0, s.H * 0.66 - Math.max(...bends.ys));
    const g = build(rise, Math.max(48, s.W * 0.16));
    const T = clamp(r * 0.12, 8, 16);
    const x0 = s.W - Math.max(18, s.W * 0.05) - T - Math.max(...g.xs);
    const xs = g.xs.map((v) => v + x0);
    const n = g.ss.length - 1;
    const footAt = g.ys.findIndex((v) => v > 3);
    const foot = footAt < 0 ? at(xs, n) : at(xs, footAt);
    const geo = {
      ...g,
      xs,
      r,
      T,
      x0,
      foot,
      S: at(g.ss, n),
      clear: Math.min(foot, at(xs, n)) - 12,
      ok: Math.max(...g.ys) + T < s.H - 8,
    };
    s.rampKey = key;
    s.rampGeo = geo;
    return geo;
  };

  const home = () => {
    const [lo, hi] = xLimits();
    if (!rampOn()) return clamp(s.W / 2, lo, hi);
    const g = rampGeo();
    return clamp(
      Math.min(g.foot * 0.5, g.x0 - 90, g.clear - s.bw / 2 - 40),
      lo,
      hi,
    );
  };

  const craftCenter = () => ({
    x: s.x,
    y: podH() + s.bh / 2 + s.y + REST,
  });

  const nozzles = (): FlyingButtonNozzle[] => {
    const c = craftCenter();
    const cs = Math.cos(s.th);
    const sn = Math.sin(s.th);
    const ry = props.current.thrusters
      ? -(s.bh / 2 + podH()) + 1
      : -(s.bh / 2) + 2;
    return offsets().map((rx) => ({
      x: c.x + rx * cs - ry * sn,
      y: c.y + rx * sn + ry * cs,
      dx: sn,
      dy: -cs,
    }));
  };

  const cssCenter = () => {
    const c = craftCenter();
    return { x: c.x, y: s.H - c.y };
  };

  const quad = (
    x0: number,
    w: number,
    h: number,
    p0: number[],
    p1: number[],
    p2: number[],
    p3: number[],
  ) => {
    const dx1 = at(p1, 0) - at(p2, 0);
    const dx2 = at(p3, 0) - at(p2, 0);
    const dx3 = at(p0, 0) - at(p1, 0) + at(p2, 0) - at(p3, 0);
    const dy1 = at(p1, 1) - at(p2, 1);
    const dy2 = at(p3, 1) - at(p2, 1);
    const dy3 = at(p0, 1) - at(p1, 1) + at(p2, 1) - at(p3, 1);
    const det = dx1 * dy2 - dx2 * dy1 || 1e-6;
    const g = (dx3 * dy2 - dx2 * dy3) / det;
    const k = (dx1 * dy3 - dx3 * dy1) / det;
    const a = at(p1, 0) - at(p0, 0) + g * at(p1, 0);
    const b = at(p3, 0) - at(p0, 0) + k * at(p3, 0);
    const d = at(p1, 1) - at(p0, 1) + g * at(p1, 1);
    const e = at(p3, 1) - at(p0, 1) + k * at(p3, 1);
    const tx = at(p0, 0) - (a * x0) / w;
    const ty = at(p0, 1) - (d * x0) / w;
    if (Math.abs(g) < 1e-7 && Math.abs(k) < 1e-7) {
      return `matrix(${[a / w, d / w, b / h, e / h, tx, ty].map((v) => v.toFixed(6)).join(',')})`;
    }
    const m = [
      a / w,
      d / w,
      0,
      g / w,
      b / h,
      e / h,
      0,
      k / h,
      0,
      0,
      1,
      0,
      tx,
      ty,
      0,
      1 - (g * x0) / w,
    ];
    return `matrix3d(${m.map((v) => v.toFixed(6)).join(',')})`;
  };

  const dropStrip = () => {
    if (!s.strip) return;
    s.strip.wrap.remove();
    s.strip.ink.remove();
    s.strip = null;
    button.style.visibility = '';
  };

  const makeStrip = () => {
    dropStrip();
    const t = s.track;
    if (!t) return;
    const g = t.geo;
    const d = podH() + s.bh / 2;
    const sn = [0];
    for (let i = 1; i < g.ss.length; i += 1) {
      const k = (at(g.ks, i) + at(g.ks, i - 1)) / 2;
      sn.push(
        at(sn, i - 1) +
          (at(g.ss, i) - at(g.ss, i - 1)) * Math.max(1 - k * d, 0.2),
      );
    }
    const n = clamp(Math.round(s.bw / 8), 8, 32);
    const wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText =
      'position:absolute;inset:0;z-index:1;pointer-events:none';
    const ink = document.createElement('div');
    ink.setAttribute('aria-hidden', 'true');
    ink.style.cssText =
      'position:absolute;inset:0;z-index:2;pointer-events:none;will-change:transform';
    const kids = Array.from(button.children).filter(
      (k): k is HTMLElement => k instanceof HTMLElement,
    );
    const label = kids[1];
    const pods = kids.slice(2).map((p) => {
      const el = cloneHtml(p);
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.transformOrigin = '0 0';
      wrap.appendChild(el);
      return { el, x: p.offsetLeft, y: p.offsetTop + p.offsetHeight / 2, k: 1 };
    });
    const parts: HTMLElement[] = [];
    for (let i = 0; i < n; i += 1) {
      const c = cloneHtml(button);
      c.removeAttribute('data-hover');
      c.removeAttribute('data-pressed');
      c.setAttribute('tabindex', '-1');
      c.setAttribute('inert', '');
      Array.from(c.children)
        .slice(1)
        .forEach((k: Element) => {
          if (k instanceof HTMLElement) k.style.visibility = 'hidden';
        });
      const x0 = (s.bw * i) / n - (i ? 0.75 : 2);
      const x1 = (s.bw * (i + 1)) / n + (i < n - 1 ? 0.75 : 2);
      c.style.visibility = 'visible';
      c.style.transformOrigin = '0 0';
      c.style.clipPath = `polygon(${x0}px -2px, ${x1}px -2px, ${x1}px ${s.bh + 2}px, ${x0}px ${s.bh + 2}px)`;
      wrap.appendChild(c);
      parts.push(c);
    }
    const items: FlyingButtonPiece[] = [];
    const text = label ? label.textContent || '' : '';
    const ctx = document.createElement('canvas').getContext('2d');
    if (label && ctx && text.trim() && !label.children.length) {
      const cs = getComputedStyle(label);
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ctx.font = font;
      const chars = Array.from(text);
      const at = (i: number) =>
        ctx.measureText(chars.slice(0, i).join('')).width;
      const span = at(chars.length) || 1;
      const yc = label.offsetTop + label.offsetHeight / 2;
      chars.forEach((ch, i) => {
        const el = document.createElement('span');
        el.textContent = ch;
        el.style.cssText = `position:absolute;left:0;top:0;white-space:pre;line-height:1;transform-origin:0 0;font:${font};color:${cs.color}`;
        ink.appendChild(el);
        items.push({
          el,
          x:
            label.offsetLeft +
            ((at(i) + at(i + 1)) / 2) * (label.offsetWidth / span),
          y: yc,
          k: 0.5,
        });
      });
    } else if (label) {
      const el = cloneHtml(label);
      el.style.position = 'absolute';
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.transformOrigin = '0 0';
      ink.appendChild(el);
      items.push({
        el,
        x: label.offsetLeft + label.offsetWidth / 2,
        y: label.offsetTop + label.offsetHeight / 2,
        k: 0,
      });
    }
    root.appendChild(wrap);
    root.appendChild(ink);
    button.style.visibility = 'hidden';
    s.strip = { wrap, ink, parts, n, sn, pods, items };
  };

  const placeStrip = () => {
    const st = s.strip;
    const t = s.track;
    if (!st || !t) return;
    const g = t.geo;
    const S = at(g.ss, g.ss.length - 1);
    const E = at(st.sn, st.sn.length - 1);
    const seek = (from: number[], to: number[], v: number) => {
      let lo = 0;
      let hi = from.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (at(from, mid) <= v) lo = mid;
        else hi = mid;
      }
      return (
        at(to, lo) +
        (at(to, hi) - at(to, lo)) *
          ((v - at(from, lo)) / (at(from, hi) - at(from, lo)))
      );
    };
    const neutral = (u: number) =>
      u <= 0 ? u : u >= S ? E + u - S : seek(g.ss, st.sn, u);
    const track = (v: number) =>
      v <= 0 ? v : v >= E ? S + v - E : seek(st.sn, g.ss, v);
    const nc = neutral(s.u);
    const lift = podH();
    const map = (x: number, y: number): [number, number, number] => {
      const [px, py, a] = along(g, track(nc + x - s.bw / 2));
      const h = lift + s.bh - y;
      return [px - Math.sin(a) * h, s.H - py - Math.cos(a) * h, a];
    };
    const pose = (el: HTMLElement, x: number, y: number, a: number) => {
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${(-a).toFixed(4)}rad) translate(-50%, -50%)`;
    };
    const w = s.bw / st.n;
    const top: [number, number, number][] = [];
    const low: [number, number, number][] = [];
    for (let j = 0; j <= st.n; j += 1) {
      top.push(map(j * w, 0));
      low.push(map(j * w, s.bh));
    }
    st.parts.forEach((part, i) => {
      part.style.transform = quad(
        i * w,
        w,
        s.bh,
        corner(top, i),
        corner(top, i + 1),
        corner(low, i + 1),
        corner(low, i),
      );
    });
    st.pods.forEach((p) => {
      const [x, y, a] = map(p.x, p.y);
      pose(p.el, x, y, a);
    });
    st.items.forEach((it) => {
      const [bx, by, ba] = map(it.x, it.y);
      const [ox, oy, oa] = map(s.bw / 2, it.y);
      const o = it.x - s.bw / 2;
      const rx = ox + Math.cos(oa) * o;
      const ry = oy - Math.sin(oa) * o;
      pose(
        it.el,
        rx + (bx - rx) * it.k,
        ry + (by - ry) * it.k,
        oa + (ba - oa) * it.k,
      );
    });
  };

  const place = () => {
    if (s.strip) placeStrip();
    const c = craftCenter();
    const left = c.x - s.bw / 2;
    const top = s.H - c.y - s.bh / 2;
    button.style.transform = `translate3d(${left.toFixed(2)}px, ${top.toFixed(2)}px, 0) rotate(${(-s.th).toFixed(5)}rad)`;
    root.style.setProperty(
      '--fly-thrust',
      clamp(totalThrust() * 0.9, 0, 1.2).toFixed(3),
    );
  };

  const drawRamp = () => {
    if (!ramp) return;
    const g = rampGeo();
    const paths = ramp.querySelectorAll('path');
    const body = paths[0];
    const edge = paths[1];
    const f = (v: number) => v.toFixed(1);
    const line = (off: number) => {
      const out: string[] = [];
      for (let i = 0; i < g.ss.length; i += 2) {
        const a = at(g.ps, i);
        out.push(
          `${f(at(g.xs, i) + Math.sin(a) * off)} ${f(s.H - at(g.ys, i) + Math.cos(a) * off)}`,
        );
      }
      const a = at(g.ps, g.ss.length - 1);
      out.push(
        `${f(at(g.xs, g.ss.length - 1) + Math.sin(a) * off)} ${f(s.H - at(g.ys, g.ss.length - 1) + Math.cos(a) * off)}`,
      );
      return `M ${out.join(' L ')}`;
    };
    ramp.setAttribute('viewBox', `0 0 ${f(s.W)} ${f(s.H)}`);
    ramp.style.visibility = g.ok ? '' : 'hidden';
    if (body) {
      body.setAttribute('d', line(g.T / 2));
      body.setAttribute('stroke-width', f(g.T));
    }
    if (edge) edge.setAttribute('d', line(0.75));
  };

  const jetUniforms = (list: FlyingButtonNozzle[]): FlyingButtonJets => {
    const a = new Float32Array(MAX_JETS * 4);
    const b = new Float32Array(MAX_JETS * 4);
    const bend = [0, 0, 0, 0];
    const n = list.length;
    const K = SMOKE;
    const k = scale();
    list.forEach((q, i) => {
      const str = clamp(at(s.thrust, i) * n, 0, 2);
      const reach = q.dy < -0.2 ? q.y / -q.dy : K.forceMax;
      a.set([q.x, q.y, q.dx, q.dy], i * 4);
      b.set(
        [
          K.speed * Math.sqrt(str),
          K.radius * k,
          Math.min(K.forceMax, reach * K.reach),
          str > 0.004 ? str : 0,
        ],
        i * 4,
      );
      const across = s.fvx * -q.dy + s.fvy * q.dx;
      bend[i] = clamp(-across * 0.22, -0.55 * reach, 0.55 * reach);
    });
    return { a, b, bend };
  };

  const draw = (dt: number) => {
    if (!sim) return;
    const P = props.current;
    const list = nozzles();
    const jets = jetUniforms(list);
    const c = craftCenter();
    const xs = offsets();
    const k = scale();
    const craft = [c.x, c.y, s.bw / 2, s.bh / 2];
    const motion = [s.vx, s.vy, s.th, s.w];
    const calm =
      (1 - smooth((Math.abs(s.fvx) - 40) / 100)) *
      (1 - smooth((Math.abs(s.th) - 0.1) / 0.2)) *
      (riding() ? 0 : 1);
    if (dt > 0) {
      s.simTime += dt;
      sim.step(dt, {
        jets,
        craft,
        motion,
        calm,
        scale: k,
        activity: s.activity,
        jetX: [0, 1, 2, 3].map((i) => (i < xs.length ? at(xs, i) : 0)),
        jetN: xs.length,
        spacing: xs.length > 1 ? at(xs, 1) - at(xs, 0) : 0,
        wind: s.wind * SMOKE.wind,
        time: s.simTime,
        smoke: clamp(num(P.smoke, 1), 0, 3),
        turbulence: clamp(num(P.turbulence, 1), 0, 3),
      });
    }
    const smoke = rgb(P.smokeColor);
    sim.render(canvas.width, canvas.height, {
      jets,
      craft,
      motion,
      scale: k,
      activity: s.activity,
      time: s.simTime,
      light: P.theme === 'light',
      smokeColor: smoke,
      shadeColor: smoke.map((v, i) => v * 0.74 + at(SHADE_TINT, i)),
      thrustColor: rgb(P.thrustColor),
    });
  };

  const measure = () => {
    const r = root.getBoundingClientRect();
    const W0 = s.W;
    s.W = Math.max(1, r.width);
    s.H = Math.max(1, r.height);
    s.bw = button.offsetWidth;
    s.bh = button.offsetHeight;
    if (!s.placed) {
      s.x = home();
      s.placed = true;
    } else if (W0 > 0 && W0 !== s.W) s.x *= s.W / W0;
    if (!riding()) {
      const [lo, hi] = xLimits();
      s.x = clamp(s.x, lo, hi);
    }
    s.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.round(s.W * s.dpr);
    const ch = Math.round(s.H * s.dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    if (sim) sim.resize(s.W, s.H);
    drawRamp();
    root.dataset.ready = '';
    place();
    if (!s.running) draw(0);
  };

  const overCraft = (px: number, py: number, margin = 0) => {
    const c = cssCenter();
    const a = s.th;
    const dx = px - c.x;
    const dy = py - c.y;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    return (
      Math.abs(lx) <= s.bw / 2 + 2 + margin &&
      ly >= -s.bh / 2 - 2 - margin &&
      ly <= s.bh / 2 + podH() + margin
    );
  };

  const begin = () => {
    s.pt = 0;
    s.armed = false;
    s.seed = Math.random() * 100;
    s.wind = Math.random() < 0.5 ? -1 - Math.random() : 1 + Math.random();
    s.vrPrev = 0;
    s.quiet = 0;
    s.boost = false;
  };

  const launch = () => {
    if (s.phase !== 'rest' || still()) return false;
    const P = props.current;
    begin();
    s.phase = 'ignite';
    s.delay = s.delay.map(() => Math.random() * 0.07);
    const top = s.H - s.bh - podH() - 30 - REST;
    s.alt = clamp(
      s.y + num(P.altitude, 170),
      s.y + 24,
      Math.max(s.y + 24, top),
    );
    s.climbT = 1.15 + (s.alt - s.y) / 420;
    s.hold = Math.max(0, num(P.hoverTime, 2.4));
    s.xRef = s.x;
    wake();
    return true;
  };

  const along = (
    g: FlyingButtonRampGeo,
    u: number,
  ): [number, number, number, number] => {
    if (u <= 0) return [g.x0 + u, 0, 0, 0];
    let lo = 0;
    let hi = g.ss.length - 1;
    if (u >= at(g.ss, hi)) {
      const a = at(g.ps, hi);
      return [
        at(g.xs, hi) + Math.cos(a) * (u - at(g.ss, hi)),
        at(g.ys, hi) + Math.sin(a) * (u - at(g.ss, hi)),
        a,
        0,
      ];
    }
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (at(g.ss, mid) <= u) lo = mid;
      else hi = mid;
    }
    const m = (u - at(g.ss, lo)) / (at(g.ss, hi) - at(g.ss, lo));
    const lerp = (v: number[]) => at(v, lo) + (at(v, hi) - at(v, lo)) * m;
    return [lerp(g.xs), lerp(g.ys), lerp(g.ps), lerp(g.ks)];
  };

  const ridePose = (t: FlyingButtonTrack, u: number) => {
    const [x, y, a, k] = along(t.geo, u);
    return {
      x: x - Math.sin(a) * t.base,
      cy: y + Math.cos(a) * t.base,
      th: a,
      bend: k * t.base,
    };
  };

  const ride = () => {
    if (s.phase !== 'rest' || still() || !rampOn()) return false;
    const g = rampGeo();
    const run = g.x0 - s.x;
    if (run < 60 || !g.ok) return launch();
    begin();
    const base = podH() + s.bh / 2;
    const top = Math.max(...g.ys) - 2 * base;
    const v0 = Math.sqrt(2 * G_RIDE * top + 2.2 * G_RIDE * (g.r - base));
    s.track = { geo: g, base, v0, acc: (v0 * v0) / (2 * run) };
    s.phase = 'drive';
    s.u = -run;
    s.v = 0;
    s.thrust = [0, 0, 0, 0];
    makeStrip();
    wake();
    return true;
  };

  const chooseLanding = (lead: number) => {
    const [lo, hi] = xLimits();
    let x = s.x + lead;
    if (rampOn()) x = Math.min(x, rampGeo().clear - s.bw / 2);
    s.landX = clamp(x, lo, hi);
  };

  const physics = (dt: number) => {
    const P = props.current;
    const wob = clamp(num(P.wobble, 1), 0, 3);
    s.pt += dt;
    s.clock += dt;
    if (s.phase === 'return') {
      const b: FlyingButtonBack = s.back ?? { from: s.x, to: s.x, time: 1 };
      const u = Math.min(s.pt / b.time, 1);
      s.x = b.from + (b.to - b.from) * jerk(u);
      s.vx = ((b.to - b.from) * jerkV(u)) / b.time;
      s.y = -REST;
      s.vy = 0;
      s.th = 0;
      s.w = 0;
      if (u >= 1) {
        s.phase = 'rest';
        s.pt = 0;
        s.vx = 0;
      }
      return;
    }
    if (s.phase === 'drive' || s.phase === 'loop') {
      const t = s.track;
      if (!t) {
        s.phase = 'flip';
        s.pt = 0;
        s.flip = { th: s.th, w: s.w };
        return;
      }
      const prev = ridePose(t, s.u);
      if (s.phase === 'drive') s.v = Math.min(t.v0, s.v + t.acc * dt);
      else
        s.v = Math.sqrt(
          Math.max(
            t.v0 * t.v0 - 2 * G_RIDE * (prev.cy - t.base),
            0.2 * t.v0 * t.v0,
          ),
        );
      s.u += (s.v * dt) / Math.max(1 - prev.bend, 0.25);
      if (s.phase === 'drive' && s.u >= 0) s.phase = 'loop';
      const pose = ridePose(t, s.u);
      s.vx = (pose.x - prev.x) / dt;
      s.vy = (pose.cy - prev.cy) / dt;
      s.w = (pose.th - prev.th) / dt;
      s.x = pose.x;
      s.y = pose.cy - podH() - s.bh / 2 - REST;
      s.th = pose.th;
      s.thrust = s.thrust.map((v) => v * Math.exp(-dt / 0.1));
      if (s.phase === 'loop' && s.u >= t.geo.S) {
        dropStrip();
        s.phase = 'flip';
        s.pt = 0;
        s.flip = { th: s.th, w: s.w };
      }
      return;
    }
    const I = (s.bw * s.bw + s.bh * s.bh) / 12;
    const cs = Math.max(Math.cos(s.th), 0.5);
    let total = 0;
    let control = false;
    let xt = s.xRef;
    let kp = 3;
    let kd = 3.6;
    let turn: FlyingButtonTurn | null = null;
    if (s.phase === 'flip') {
      const u = Math.min(s.pt / FLIP_TIME, 1);
      const f: FlyingButtonTurn = s.flip ?? { th: s.th, w: s.w };
      const end = Math.PI * 2;
      turn = {
        th:
          (2 * u * u * u - 3 * u * u + 1) * f.th +
          (u * u * u - 2 * u * u + u) * FLIP_TIME * f.w +
          (3 * u * u - 2 * u * u * u) * end,
        w:
          ((6 * u * u - 6 * u) * (f.th - end)) / FLIP_TIME +
          (3 * u * u - 4 * u + 1) * f.w,
      };
      total = 2.4 * smooth((Math.cos(turn.th) - 0.8) / 0.15);
      const nearGround = s.y + REST < s.bh * 0.6;
      if (u >= 1 || nearGround) {
        turn = null;
        s.th -= Math.PI * 2 * Math.round(s.th / (Math.PI * 2));
        s.phase = 'descend';
        s.pt = 0;
        s.boost = true;
        s.vrPrev = s.vy;
        chooseLanding((s.vx * Math.abs(s.vx)) / 700);
      }
    }
    if (s.phase === 'ignite') {
      total = 0.9 * smooth(s.pt / 0.5);
      if (s.pt >= 0.5) {
        s.phase = 'climb';
        s.pt = 0;
        s.y0 = s.y;
      }
    }
    if (s.phase === 'climb') {
      const u = s.pt / s.climbT;
      const span = s.alt - s.y0;
      const yr = s.y0 + span * jerk(u);
      const vr = (span * jerkV(u)) / s.climbT;
      const ar = (span * jerkA(u)) / (s.climbT * s.climbT);
      total = (G + ar + 30 * (yr - s.y) + 8 * (vr - s.vy)) / (G * cs);
      control = true;
      if (u >= 1) {
        s.phase = 'hover';
        s.pt = 0;
      }
    } else if (s.phase === 'hover') {
      const t = s.clock * 0.8;
      const yr = s.alt + 3.5 * wob * wave(t, s.seed);
      const vr = 3.5 * wob * 0.8 * waveD(t, s.seed);
      total = (G + 30 * (yr - s.y) + 8 * (vr - s.vy)) / (G * cs);
      control = true;
      if (s.pt >= s.hold) {
        s.phase = 'descend';
        s.pt = 0;
        s.vrPrev = 0;
        chooseLanding(0);
      }
    } else if (s.phase === 'drag') {
      const yr = s.target.y - podH() - s.bh / 2 - REST;
      total = (G + 34 * (yr - s.y) - 10 * s.vy) / (G * cs);
      control = true;
    } else if (s.phase === 'descend') {
      xt = s.landX;
      kp = s.boost ? 5 : 4;
      kd = s.boost ? 4.6 : 4.2;
      const vmax = 170;
      const vt = 32;
      const off = s.boost
        ? smooth((Math.abs(s.landX - s.x) - 20) / 40)
        : smooth((Math.abs(s.landX - s.x) - 3) / 23);
      const h = Math.max(s.y + REST, 0);
      const profile =
        (vt + (vmax - vt) * (1 - Math.exp(-h / 52))) *
        (1 - (s.boost ? 0.45 : 0.88) * off);
      const ramp = s.boost ? vmax * 3 : vmax * smooth(s.pt / 0.9) + 1;
      const vr = -Math.min(profile, ramp);
      const ar = clamp((vr - s.vrPrev) / Math.max(dt, 1e-4), -600, 600);
      s.vrPrev = vr;
      total = (G + ar + (s.boost ? 9 : 7) * (vr - s.vy)) / (G * cs);
      control = true;
      if (s.contact && s.pt > 0.3) {
        s.phase = 'landed';
        s.pt = 0;
        s.boost = false;
      }
    } else if (s.phase === 'landed') {
      total = 0;
      if (s.pt > 0.6 && totalThrust() < 0.03) {
        const back = rampOn() && s.track ? home() : s.x;
        s.phase = Math.abs(back - s.x) > 6 ? 'return' : 'rest';
        s.pt = 0;
        s.thrust = [0, 0, 0, 0];
        s.vy = 0;
        s.w = 0;
        s.vx = 0;
        s.track = null;
        s.back = {
          from: s.x,
          to: back,
          time: clamp(Math.abs(back - s.x) / 200, 0.7, 1.8),
        };
      }
    }
    total = Number.isFinite(total)
      ? clamp(total, 0, s.boost || s.phase === 'flip' ? 2.6 : 1.9)
      : 1;

    const xs = offsets();
    const n = xs.length;
    const sx2 = xs.reduce((acc, v) => acc + v * v, 0);
    const hand =
      s.phase === 'drag'
        ? clamp(100 * (s.target.x - s.x) - 17 * s.vx, -2400, 2400)
        : 0;
    let alphaCmd = 0;
    if (control) {
      const gust = 0.8 * wob * wave(s.clock * 1.7, s.seed + 3);
      const aCmd =
        s.phase === 'drag' ? hand * 0.75 : kp * (xt - s.x) - kd * s.vx;
      const lean = s.boost ? 0.45 : 0.32;
      const thRef = clamp(-Math.atan2(aCmd, G), -lean, lean);
      alphaCmd = -81 * (s.th - thRef) - 14 * s.w - gust;
    }
    const cap = (s.boost || s.phase === 'flip' ? 2.6 : 2.4) / n;
    const spool = (cur: number, cmd: number) =>
      cur + (cmd - cur) * (1 - Math.exp(-dt / (cmd > cur ? 0.08 : 0.17)));
    const unit = sx2 > 1 ? (alphaCmd * I) / (G * sx2) : 0;
    const room = Math.abs(unit) * Math.max(0, ...xs.map(Math.abs));
    const base = Math.min(total / n, Math.max(cap - room, cap * 0.5));
    let torque = 0;
    for (let k = 0; k < MAX_JETS; k += 1) {
      let cmd = 0;
      if (k < n) {
        cmd = clamp(base + unit * at(xs, k), 0, cap);
        if (s.phase === 'ignite' && s.pt < at(s.delay, k)) cmd = 0;
      }
      s.thrust[k] = spool(at(s.thrust, k), cmd);
      if (k < n) torque += at(s.thrust, k) * at(xs, k);
    }

    const T = totalThrust() * G;
    let ax = s.phase === 'drag' ? hand : -T * Math.sin(s.th) - 0.8 * s.vx;
    let ay = T * Math.cos(s.th) - G - 0.3 * s.vy;
    let alpha = s.phase === 'flip' ? 0 : (torque * G) / I - 1.2 * s.w;
    if (control) {
      if (s.phase !== 'drag') ax += 12 * wob * wave(s.clock * 0.7, s.seed + 7);
      alpha += 0.9 * wob * wave(s.clock * 2.3, s.seed + 11);
      if (sx2 < 1) alpha += alphaCmd;
      if (Math.abs(s.th) > 0.35) alpha -= (s.th - Math.sign(s.th) * 0.35) * 160;
    }
    const c = craftCenter();
    const csn = Math.cos(s.th);
    const sn = Math.sin(s.th);
    const ry = -(s.bh / 2 + podH());
    let contact = false;
    if (s.phase !== 'flip') {
      feet().forEach((rx) => {
        const ox = rx * csn - ry * sn;
        const oy = rx * sn + ry * csn;
        const footY = c.y + oy;
        const pen = REST - footY;
        if (pen > 0) {
          contact = true;
          const vpy = s.vy + s.w * ox;
          const vpx = s.vx - s.w * oy;
          const fy = Math.max(0, SPRING * pen - DAMP * vpy);
          const fx = -10 * vpx;
          ay += fy;
          ax += fx;
          alpha += (ox * fy - oy * fx) / I;
        }
      });
    }
    s.contact = contact;
    s.vx = clamp(s.vx + ax * dt, -1500, 1500);
    s.vy = clamp(s.vy + ay * dt, -1500, 1500);
    s.w = clamp(s.w + alpha * dt, -14, 14);
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.th += s.w * dt;
    if (turn) {
      s.th = turn.th;
      s.w = turn.w;
    }
    if (s.phase !== 'flip' && Math.abs(s.th) > TILT_MAX) {
      s.th = Math.sign(s.th) * TILT_MAX;
      if (s.w * s.th > 0) s.w = 0;
    }
    const [lo, hi] = xLimits();
    if (s.x < lo || s.x > hi) {
      s.x = clamp(s.x, lo, hi);
      s.vx = 0;
    }
    if (s.y + REST < -40) {
      s.y = -REST;
      s.vy = 0;
    }
    if (
      !Number.isFinite(s.y + s.x + s.th + s.vy + s.vx + s.w + totalThrust())
    ) {
      Object.assign(s, {
        x: s.W / 2,
        vx: 0,
        y: -REST,
        vy: 0,
        th: 0,
        w: 0,
        thrust: [0, 0, 0, 0],
        phase: 'rest',
      });
      s.drag = null;
    }
  };

  const updatePointer = (dt: number) => {
    const P = props.current;
    const p = s.pointer;
    const c = cssCenter();
    if (s.attached && !s.drag && s.lastC) {
      const fx = p.x + s.off.x;
      const fy = p.y + s.off.y;
      const da = -(s.th - s.lastTh);
      const rx = fx - s.lastC.x;
      const ry = fy - s.lastC.y;
      const nx = c.x + rx * Math.cos(da) - ry * Math.sin(da);
      const ny = c.y + rx * Math.sin(da) + ry * Math.cos(da);
      s.off.x += nx - fx;
      s.off.y += ny - fy;
    }
    s.lastC = c;
    s.lastTh = s.th;
    const fx = p.x + s.off.x;
    const fy = p.y + s.off.y;
    const over = p.in && overCraft(fx, fy, s.attached || s.drag ? 10 : 0);
    if (over !== s.hover) {
      s.hover = over;
      if (over) button.dataset.hover = '';
      else delete button.dataset.hover;
    }
    if (!over && !s.drag) {
      s.attached = false;
      if (s.phase === 'rest') s.armed = true;
    }
    if (
      over &&
      s.armed &&
      s.phase === 'rest' &&
      p.type === 'mouse' &&
      P.trigger !== 'click' &&
      !rampOn() &&
      launch()
    ) {
      s.attached = Boolean(P.carryCursor);
    }
    if (s.phase === 'rest' && Math.abs(s.off.x) + Math.abs(s.off.y) < 12) {
      const k = Math.exp(-dt * 6);
      s.off.x *= k;
      s.off.y *= k;
    }
    if (
      Math.abs(s.off.x) + Math.abs(s.off.y) < 0.3 &&
      (!s.attached || s.phase === 'rest')
    ) {
      s.off.x = 0;
      s.off.y = 0;
      if (s.phase === 'rest') s.attached = false;
    }
    const carry =
      Boolean(P.carryCursor) &&
      p.in &&
      p.type === 'mouse' &&
      (s.attached || Boolean(s.drag) || s.off.x !== 0 || s.off.y !== 0);
    if (carry !== s.carry) {
      s.carry = carry;
      if (carry) root.dataset.carry = '';
      else delete root.dataset.carry;
    }
    if (carry && cursor) {
      cursor.style.transform = `translate3d(${(fx - 1.8).toFixed(2)}px, ${(fy - 1.75).toFixed(2)}px, 0)`;
    }
  };

  const frame = (now: number) => {
    s.raf = 0;
    const dt = s.last ? clamp((now - s.last) / 1000, 0, 1 / 30) : 1 / 60;
    s.last = now;
    if (dt > 0) {
      if (s.phase !== 'rest') {
        const steps = 6;
        for (let i = 0; i < steps; i += 1) physics(dt / steps);
      }
      const kf = 1 - Math.exp(-dt / 0.12);
      s.fvx += (s.vx - s.fvx) * kf;
      s.fvy += (s.vy - s.fvy) * kf;
      updatePointer(dt);
      place();
      draw(dt);
      const thrust = totalThrust();
      s.quiet = thrust > 0.01 || s.phase !== 'rest' ? 0 : s.quiet + dt;
      const firing = thrust > 0.05 ? 1 : 0;
      s.activity +=
        (firing - s.activity) * (1 - Math.exp(-dt / (firing ? 0.25 : 1.6)));
    }
    if (!s.visible) s.last = 0;
    else if (s.phase !== 'rest' || s.quiet < 7 || s.carry)
      s.raf = requestAnimationFrame(frame);
    else {
      s.running = false;
      s.last = 0;
      if (sim) sim.clear();
      draw(0);
    }
  };

  const wake = () => {
    s.running = true;
    if (s.raf || !s.visible) return;
    s.raf = requestAnimationFrame(frame);
  };

  const local = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const pointerAt = () => {
    const p = s.pointer;
    const mouse = p.type === 'mouse';
    return { x: p.x + (mouse ? s.off.x : 0), y: p.y + (mouse ? s.off.y : 0) };
  };

  const aim = () => {
    if (!s.drag) return;
    const f = pointerAt();
    const [lo, hi] = xLimits();
    const low = podH() + s.bh / 2;
    s.target.x = clamp(f.x - s.drag.gx, lo, hi);
    s.target.y = clamp(
      s.H - (f.y - s.drag.gy),
      low,
      Math.max(low, s.H - s.bh / 2 - 6),
    );
  };

  const startDrag = (e: PointerEvent) => {
    const f = pointerAt();
    const c = cssCenter();
    s.drag = { gx: f.x - c.x, gy: f.y - c.y };
    s.phase = 'drag';
    s.pt = 0;
    s.attached = false;
    s.pressed = false;
    s.suppress = true;
    s.boost = false;
    delete button.dataset.pressed;
    root.dataset.dragging = '';
    if (!root.hasPointerCapture(e.pointerId)) {
      try {
        root.setPointerCapture(e.pointerId);
      } catch {
        s.suppress = true;
      }
    }
    aim();
  };

  const endDrag = (e: PointerEvent) => {
    s.drag = null;
    s.press = null;
    delete root.dataset.dragging;
    if (root.hasPointerCapture(e.pointerId))
      root.releasePointerCapture(e.pointerId);
    s.phase = 'hover';
    s.pt = 0;
    s.alt = s.y;
    const [lo, hi] = xLimits();
    s.xRef = clamp(s.x + s.vx * 0.3, lo, hi);
    s.hold = Math.min(Math.max(0, num(props.current.hoverTime, 2.4)), 0.9);
  };

  const onMove = (e: PointerEvent) => {
    const q = local(e);
    const p = s.pointer;
    if (p.in && !s.attached && !s.drag && (s.off.x || s.off.y)) {
      const k = Math.exp(-Math.hypot(q.x - p.x, q.y - p.y) / 110);
      s.off.x *= k;
      s.off.y *= k;
    }
    p.x = q.x;
    p.y = q.y;
    p.in = true;
    p.type = e.pointerType || 'mouse';
    if (
      s.press &&
      !s.drag &&
      flying() &&
      Math.hypot(q.x - s.press.x, q.y - s.press.y) > 4
    )
      startDrag(e);
    if (s.drag) aim();
    updatePointer(0);
    if (s.carry || s.phase !== 'rest') wake();
  };

  const onLeave = () => {
    if (s.drag) return;
    s.pointer.in = false;
    s.attached = false;
    s.off.x = 0;
    s.off.y = 0;
    updatePointer(0);
  };

  const onDown = (e: PointerEvent) => {
    const q = local(e);
    const p = s.pointer;
    p.x = q.x;
    p.y = q.y;
    p.in = true;
    p.type = e.pointerType || 'mouse';
    s.suppress = false;
    const f = pointerAt();
    if (!overCraft(f.x, f.y, s.attached ? 10 : 0)) return;
    if (
      p.type !== 'mouse' &&
      s.phase === 'rest' &&
      props.current.trigger !== 'click' &&
      !rampOn()
    )
      launch();
    s.press = { x: q.x, y: q.y };
    if (s.carry && p.type === 'mouse') {
      s.pressed = true;
      button.dataset.pressed = '';
    }
  };

  const onUp = (e: PointerEvent) => {
    if (s.drag) {
      endDrag(e);
      return;
    }
    s.press = null;
    if (!s.pressed) return;
    s.pressed = false;
    delete button.dataset.pressed;
    if (s.carry && s.hover) {
      if (s.phase === 'rest' && rampOn()) ride();
      else if (props.current.trigger === 'click' && launch())
        s.attached = Boolean(props.current.carryCursor);
      if (props.current.onClick) props.current.onClick(e);
    }
  };

  const onClick = (e: MouseEvent) => {
    if (s.suppress) {
      s.suppress = false;
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    props.current.onClick(e);
    if (s.phase !== 'rest') return;
    if (rampOn()) {
      ride();
      return;
    }
    if (launch() && s.pointer.type === 'mouse' && s.pointer.in && s.hover) {
      s.attached = Boolean(props.current.carryCursor);
    }
  };

  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerenter', onMove);
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onUp);
  button.addEventListener('click', onClick);

  const ro = new ResizeObserver(measure);
  ro.observe(root);
  ro.observe(button);
  measure();

  return {
    refresh: measure,
    rehome() {
      measure();
      if (s.phase !== 'rest') return;
      s.x = home();
      place();
      if (!s.running) draw(0);
    },
    setVisible(visible: boolean) {
      if (s.visible === visible) return;
      s.visible = visible;
      if (!visible && s.raf) {
        cancelAnimationFrame(s.raf);
        s.raf = 0;
        s.last = 0;
      } else if (visible && s.running) wake();
    },
    destroy() {
      ro.disconnect();
      dropStrip();
      if (s.raf) cancelAnimationFrame(s.raf);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerenter', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      button.removeEventListener('click', onClick);
      if (sim) sim.dispose();
    },
  };
}
