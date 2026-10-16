import type {
  LogoLoopConfig,
  LogoLoopCopies,
  LogoLoopDrag,
  LogoLoopEngine,
  LogoLoopEngineItem,
  LogoLoopGeometry,
  LogoLoopItemStyleKey,
  LogoLoopMatrix,
  LogoLoopStyleProp,
  LogoLoopTween,
} from './types';

const SMOOTH_TAU = 0.25;
const GLIDE_TAU = 0.8;
const DRAG_THRESHOLD = 6;
const MAX_FLING = 4000;
const INTRO_TIME = 0.7;
const INTRO_STAGGER = 0.45;
const HALF_SQRT_PI = Math.sqrt(Math.PI) / 2;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const toCssLength = (
  value: number | string | undefined,
): string | undefined => (typeof value === 'number' ? `${value}px` : value);

const erf = (x: number): number => {
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-a * a);
  return x < 0 ? -y : y;
};

const easeInOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

const smootherstep = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

/** Soft transparent edge mask, so the fade works on any background. */
export const fadeMask = (
  size: number,
  vertical: boolean,
): string | undefined => {
  const span = clamp(size, 0, 0.5) * 100;
  if (span <= 0) return undefined;
  const stops: string[] = [];
  for (let i = 0; i <= 12; i++) {
    stops.push(
      `rgba(0,0,0,${smootherstep(i / 12).toFixed(4)}) ${((span * i) / 12).toFixed(3)}%`,
    );
  }
  for (let i = 12; i >= 0; i--) {
    stops.push(
      `rgba(0,0,0,${smootherstep(i / 12).toFixed(4)}) ${(100 - (span * i) / 12).toFixed(3)}%`,
    );
  }
  return `linear-gradient(${vertical ? 'to bottom' : 'to right'}, ${stops.join(', ')})`;
};

const rotationMatrix = (degX: number, degY: number): LogoLoopMatrix => {
  const a = (degX * Math.PI) / 180;
  const b = (degY * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const cb = Math.cos(b);
  const sb = Math.sin(b);
  return [cb, 0, sb, sa * sb, ca, -sa * cb, -ca * sb, sa, ca * cb];
};

const unproject = (
  m: LogoLoopMatrix,
  depth: number,
  sx: number,
  sy: number,
): [number, number] | null => {
  const den = m[8] * depth - m[2] * sx - m[5] * sy;
  if (den <= 1e-6) return null;
  const t = (m[8] * depth) / den;
  if (t <= 0) return null;
  const qx = t * sx;
  const qy = t * sy;
  const qz = depth * (1 - t);
  return [m[0] * qx + m[3] * qy + m[6] * qz, m[1] * qx + m[4] * qy + m[7] * qz];
};

const project = (
  m: LogoLoopMatrix,
  depth: number,
  px: number,
  py: number,
): [number, number] => {
  const k = depth / (depth - (m[6] * px + m[7] * py));
  return [(m[0] * px + m[1] * py) * k, (m[3] * px + m[4] * py) * k];
};

const childAt = (el: Element, index: number): HTMLElement | null => {
  const child = el.children[index];
  return child instanceof HTMLElement ? child : null;
};

interface EngineState {
  offset: number;
  velocity: number;
  period: number;
  length: number;
  box: [number, number];
  items: LogoLoopEngineItem[];
  snaps: number[];
  pitch: number;
  crossMax: number;
  sizeMax: number;
  tipMax: number;
  geo: LogoLoopGeometry | null;
  layout: LogoLoopCopies;
  hovered: boolean;
  focused: boolean;
  pointer: [number, number] | null;
  pointerInside: boolean;
  mag: number;
  magU: number;
  magReady: boolean;
  drag: LogoLoopDrag | null;
  glide: boolean;
  suppressUntil: number;
  pressedAt: number;
  move: LogoLoopTween | null;
  hold: number;
  seek: LogoLoopTween | null;
  scrollVel: number;
  scrollY: number;
  scrollT: number;
  visible: boolean;
  introStart: number;
  introDone: boolean;
  itemMode: boolean;
  active: LogoLoopEngineItem | null;
  raf: number;
  last: number;
  reduced: boolean;
  destroyed: boolean;
}

/**
 * Imperative loop engine ported from React Bits' LogoLoop. It owns the rAF
 * loop and writes transforms straight to the DOM; Vue owns the markup and
 * forwards events to the returned handlers.
 */
export function createLogoLoopEngine(
  root: HTMLElement,
  track: HTMLElement,
  getConfig: () => LogoLoopConfig,
  setLayout: (layout: LogoLoopCopies) => void,
  initial: { reduced: boolean; visible: boolean; copies: LogoLoopCopies },
): LogoLoopEngine {
  const st: EngineState = {
    offset: 0,
    velocity: 0,
    period: 0,
    length: 0,
    box: [0, 0],
    items: [],
    snaps: [],
    pitch: 0,
    crossMax: 0,
    sizeMax: 0,
    tipMax: 0,
    geo: null,
    layout: { ...initial.copies },
    hovered: false,
    focused: false,
    pointer: null,
    pointerInside: false,
    mag: 0,
    magU: 0,
    magReady: false,
    drag: null,
    glide: false,
    suppressUntil: 0,
    pressedAt: -1e9,
    move: null,
    hold: 0,
    seek: null,
    scrollVel: 0,
    scrollY: window.scrollY,
    scrollT: 0,
    visible: initial.visible,
    introStart: -1,
    introDone: !getConfig().intro,
    itemMode: false,
    active: null,
    raf: 0,
    last: 0,
    reduced: initial.reduced,
    destroyed: false,
  };

  const collect = (): void => {
    const items: LogoLoopEngineItem[] = [];
    Array.from(track.children).forEach((list, copy) => {
      Array.from(list.children).forEach((el, index) => {
        if (!(el instanceof HTMLElement)) return;
        items.push({
          el,
          copy,
          index,
          content: childAt(el, 0),
          tip: childAt(el, 1),
          center: 0,
          size: 0,
          cross: 0,
          t: '',
          o: '',
          v: '',
          z: '',
          s: '',
          p: '',
        });
      });
    });
    st.items = items;
    st.active = null;
  };

  const clearItems = (): void => {
    for (const it of st.items) {
      it.el.style.transform = '';
      it.el.style.opacity = '';
      it.el.style.visibility = '';
      it.el.style.zIndex = '';
      if (it.content) it.content.style.transform = '';
      if (it.tip) it.tip.style.transform = '';
      it.t = it.o = it.v = it.z = it.s = it.p = '';
    }
  };

  const geometry = (): void => {
    const cfg = getConfig();
    const L = st.length;
    const P = st.period;
    const hc = st.crossMax;
    const w = st.sizeMax;
    const bend = clamp(cfg.bend, -1, 1);
    const geo: LogoLoopGeometry = {
      mode: cfg.layout,
      shift: 0,
      uMin: -L / 2 - w,
      uMax: L / 2 + w,
      lead: 0,
      focus: clamp(cfg.focus, 0, 1) * 0.9,
      focusSigma: Math.max(40, L * 0.18),
      magnify: clamp(cfg.magnify, 0, 1),
      magSigma: Math.max(hc * 1.4, st.pitch * 1.1),
      amp: 0,
      k: 0,
      R: 0,
      sign: 1,
      limit: 0,
      C: 0,
      alpha: 0,
      depth: 0,
      pf: 1,
      tilted: false,
      tiltX: 0,
      tiltY: 0,
      m: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      persp: 0,
    };
    let pad = cfg.scaleOnHover ? hc * 0.1 : 0;
    const lens = (1 + geo.focus) * (1 + geo.magnify) - 1;
    if (geo.mode === 'wave') {
      geo.amp = bend * (hc * 0.6 + L * 0.035);
      geo.k = (2 * Math.PI) / Math.max(1, L / 1.25);
      pad += Math.abs(geo.amp) + (lens * hc) / 2 + hc * 0.08;
    } else if (geo.mode === 'arc' && Math.abs(bend) > 0.005) {
      const edge = Math.abs(bend) * (Math.PI / 4);
      const R = L / 2 / Math.sin(edge);
      const sag = R * (1 - Math.cos(edge));
      geo.R = R;
      geo.sign = Math.sign(bend);
      geo.shift = sag / 2;
      geo.limit = Math.PI * 0.6;
      const reach =
        R * Math.min(Math.PI / 2, Math.asin(Math.min(1, (L / 2 + w) / R))) + w;
      geo.uMin = -reach;
      geo.uMax = reach;
      pad += sag / 2 + (w / 2) * Math.sin(edge) + (lens * hc) / 2;
    } else if (geo.mode === 'orbit') {
      const R = Math.max(40, L * 0.43 - w * 0.2);
      const k = Math.max(1, Math.round((2 * Math.PI * R) / P));
      const alpha =
        Math.sign(bend) *
        Math.atan2(Math.abs(bend) * Math.max(hc * 2, R * 0.36), R);
      const depth = R * 5;
      const pf = depth / (depth - R * Math.cos(alpha));
      const pb = depth / (depth + R * Math.cos(alpha));
      const yf = R * Math.sin(alpha) * pf;
      const yb = -R * Math.sin(alpha) * pb;
      const grow = (1 + lens) * (cfg.scaleOnHover ? 1.2 : 1);
      const lo = Math.min(yf - (hc * pf * grow) / 2, yb - (hc * pb) / 2);
      const hi = Math.max(yf + (hc * pf * grow) / 2, yb + (hc * pb) / 2);
      geo.R = R;
      geo.C = k * P;
      geo.alpha = alpha;
      geo.depth = depth;
      geo.pf = pf;
      geo.shift = (lo + hi) / 2;
      geo.uMin = -geo.C / 2;
      geo.uMax = geo.C / 2;
      pad = Math.max(0, (hi - lo) / 2 - hc / 2);
    } else {
      pad += (lens * hc) / 2;
    }
    if (cfg.labels === 'hover') {
      pad += cfg.vertical
        ? st.tipMax
        : hc * 0.2 + Math.max(11, hc * 0.26) * 1.3;
    }
    const tx = clamp(cfg.tiltX, -60, 60);
    const ty = clamp(cfg.tiltY, -60, 60);
    if (Math.abs(tx) > 0.01 || Math.abs(ty) > 0.01) {
      geo.tilted = true;
      geo.tiltX = tx;
      geo.tiltY = ty;
      geo.m = rotationMatrix(tx, ty);
      geo.persp = Math.max(L, 480) * 1.3;
      const edge = L / 2 + w;
      const along = (s: number): number => {
        const p = cfg.vertical
          ? unproject(geo.m, geo.persp, 0, s)
          : unproject(geo.m, geo.persp, s, 0);
        if (!p) return Math.sign(s) * L * 4;
        return clamp(cfg.vertical ? p[1] : p[0], -L * 4, L * 4);
      };
      const a = along(-edge);
      const b = along(edge);
      geo.uMin = Math.min(geo.uMin, a, b) - w;
      geo.uMax = Math.max(geo.uMax, a, b) + w;
      const band = hc / 2 + pad;
      let reach = band;
      for (const u of [a, b, 0]) {
        for (const v of [-band, band]) {
          const q = cfg.vertical
            ? project(geo.m, geo.persp, v, u)
            : project(geo.m, geo.persp, u, v);
          reach = Math.max(reach, Math.abs(cfg.vertical ? q[0] : q[1]));
        }
      }
      pad = reach - hc / 2;
    }
    const extra = cfg.links ? 2 : 0;
    geo.lead = (Math.max(0, Math.ceil((-geo.uMin - L / 2) / P)) + extra) * P;
    const copies = Math.max(
      2,
      Math.ceil((geo.uMax + L / 2 + geo.lead) / P) + 2 + (extra ? 1 : 0),
    );
    const primary = Math.min(copies - 1, Math.floor((geo.lead + L / 2) / P));
    st.geo = geo;
    root.style.setProperty('--logoloop-pad', `${Math.ceil(pad)}px`);
    root.style.perspective = geo.tilted ? `${geo.persp}px` : '';
    track.style.transformOrigin = geo.tilted
      ? cfg.vertical
        ? `50% ${L / 2}px`
        : `${L / 2}px 50%`
      : '';
    if (copies !== st.layout.copies || primary !== st.layout.primary) {
      st.layout = { copies, primary };
      setLayout(st.layout);
    }
  };

  const measure = (): void => {
    const cfg = getConfig();
    const lists = track.children;
    const firstList = lists[0];
    if (!firstList || !st.items.length) {
      st.period = 0;
      return;
    }
    if (cfg.vertical) {
      const parentHeight = root.parentElement?.clientHeight ?? 0;
      if (
        parentHeight > 0 &&
        root.style.height !== `${Math.ceil(parentHeight)}px`
      ) {
        root.style.height = `${Math.ceil(parentHeight)}px`;
      }
    } else if (root.style.height) {
      root.style.height = '';
    }
    track.style.transform = 'none';
    clearItems();
    const rootRect = root.getBoundingClientRect();
    const k = root.offsetWidth ? rootRect.width / root.offsetWidth || 1 : 1;
    const trackRect = track.getBoundingClientRect();
    const origin = cfg.vertical ? trackRect.top : trackRect.left;
    let crossMax = 0;
    let sizeMax = 0;
    let tipMax = 0;
    for (const it of st.items) {
      const r = it.el.getBoundingClientRect();
      it.center =
        ((cfg.vertical ? r.top + r.height / 2 : r.left + r.width / 2) -
          origin) /
        k;
      it.size = (cfg.vertical ? r.height : r.width) / k;
      it.cross = (cfg.vertical ? r.width : r.height) / k;
      crossMax = Math.max(crossMax, it.cross);
      sizeMax = Math.max(sizeMax, it.size);
      if (it.tip && it.copy === 0)
        tipMax = Math.max(tipMax, it.tip.offsetWidth);
    }
    const a = firstList.getBoundingClientRect();
    const second = lists[1];
    const b = second ? second.getBoundingClientRect() : null;
    st.period =
      (b
        ? cfg.vertical
          ? b.top - a.top
          : b.left - a.left
        : cfg.vertical
          ? a.height
          : a.width) / k;
    const cs = getComputedStyle(root);
    st.box = [root.offsetWidth, root.offsetHeight];
    st.length = cfg.vertical
      ? root.clientHeight -
        Number.parseFloat(cs.paddingTop) -
        Number.parseFloat(cs.paddingBottom)
      : root.clientWidth -
        Number.parseFloat(cs.paddingLeft) -
        Number.parseFloat(cs.paddingRight);
    st.crossMax = crossMax;
    st.sizeMax = sizeMax;
    st.tipMax = tipMax + crossMax * 0.25;
    const first = st.items.filter((it) => it.copy === 0);
    st.pitch = first.length ? st.period / first.length : st.period;
    st.snaps = first.map((it) => it.center);
    st.itemMode = false;
    if (st.period <= 0) return;
    geometry();
  };

  const pointerU = (): number | null => {
    const geo = st.geo;
    if (!st.pointer || !geo) return null;
    const cfg = getConfig();
    let sx = st.pointer[0] - st.box[0] / 2;
    let sy = st.pointer[1] - st.box[1] / 2;
    if (geo.tilted) {
      const p = unproject(geo.m, geo.persp, sx, sy);
      if (!p) return null;
      sx = p[0];
      sy = p[1];
    }
    const s = cfg.vertical ? sy : sx;
    if (geo.mode === 'arc' && geo.R) {
      return geo.R * Math.asin(clamp(s / geo.R, -1, 1));
    }
    if (geo.mode === 'orbit') {
      return Math.asin(clamp(s / (geo.R * geo.pf), -1, 1));
    }
    return s;
  };

  const snapTarget = (from: number, dir: number): number => {
    const P = st.period;
    const base = st.length / 2 + (st.geo?.lead ?? 0);
    let best: number | null = null;
    for (const c of st.snaps) {
      const s = c - base;
      const candidate =
        dir > 0
          ? s + P * Math.ceil((from + 0.5 - s) / P)
          : s + P * Math.floor((from - 0.5 - s) / P);
      if (best === null || (dir > 0 ? candidate < best : candidate > best)) {
        best = candidate;
      }
    }
    return best ?? from;
  };

  const nearestSnap = (value: number): number => {
    const P = st.period;
    const base = st.length / 2 + (st.geo?.lead ?? 0);
    let best = value;
    let dist = Infinity;
    for (const c of st.snaps) {
      const s = c - base;
      const candidate = s + P * Math.round((value - s) / P);
      if (Math.abs(candidate - value) < dist) {
        dist = Math.abs(candidate - value);
        best = candidate;
      }
    }
    return best;
  };

  const startMove = (target: number, duration: number): void => {
    st.move = {
      from: st.offset,
      delta: target - st.offset,
      t: 0,
      dur: duration,
    };
  };

  const stepTiming = (speed: number): { move: number; hold: number } => {
    const cycle = st.pitch / Math.max(1, Math.abs(speed));
    const move = clamp(cycle * 0.55, 0.35, 0.9);
    return { move, hold: Math.max(0.35, cycle - move) };
  };

  const write = (
    it: LogoLoopEngineItem,
    key: LogoLoopItemStyleKey,
    prop: LogoLoopStyleProp,
    value: string,
    target: HTMLElement,
  ): void => {
    if (it[key] !== value) {
      it[key] = value;
      target.style[prop] = value;
    }
  };

  const render = (now: number): void => {
    const cfg = getConfig();
    const geo = st.geo;
    if (!geo) return;
    const L = st.length;
    const half = L / 2;
    const T = -st.offset - geo.lead;
    const lineT = cfg.vertical
      ? `translate3d(0px, ${T.toFixed(2)}px, 0px)`
      : `translate3d(${T.toFixed(2)}px, 0px, 0px)`;
    track.style.transform = geo.tilted
      ? `rotateX(${geo.tiltX}deg) rotateY(${geo.tiltY}deg) ${lineT}`
      : lineT;
    const introRunning = st.introStart >= 0;
    const elapsed = introRunning ? (now - st.introStart) / 1000 : 0;
    const lensFocus =
      geo.mode === 'orbit' ? clamp(cfg.focus, 0, 1) * 0.9 : geo.focus;
    const lensMag = geo.magnify * st.mag;
    const cursorActive = lensMag > 0 && st.mag > 0.5 && geo.mode !== 'orbit';
    const wantsActive = cfg.focus > 0 || cfg.step || cursorActive;
    const needItems =
      geo.mode !== 'line' || lensFocus > 0 || lensMag > 0.0005 || introRunning;
    if (!needItems && st.itemMode) clearItems();
    st.itemMode = needItems;
    if (!needItems && !wantsActive) {
      if (st.active) {
        st.active.el.removeAttribute('data-active');
        st.active = null;
      }
      return;
    }
    let best: LogoLoopEngineItem | null = null;
    let bestDist = Infinity;
    for (const it of st.items) {
      const u = T + it.center - half;
      let x = u;
      let y = 0;
      let rot = 0;
      let scale = 1;
      let opacity = 1;
      let z = '';
      let hidden = false;
      let dist = Math.abs(u);
      if (geo.mode === 'orbit') {
        if (u < -geo.C / 2 || u >= geo.C / 2) {
          hidden = true;
        } else {
          const th = (2 * Math.PI * u) / geo.C;
          const Z = geo.R * Math.cos(th);
          const p = geo.depth / (geo.depth - Z * Math.cos(geo.alpha));
          x = geo.R * Math.sin(th) * p;
          y = Z * Math.sin(geo.alpha) * p - geo.shift;
          scale = p;
          if (lensFocus > 0) {
            scale *= 1 + lensFocus * Math.exp(-((th / 0.55) ** 2));
          }
          if (lensMag > 0) {
            const span = (geo.magSigma * 2 * Math.PI) / geo.C;
            scale *=
              1 +
              lensMag *
                Math.max(0, Math.cos(th)) *
                Math.exp(-(((th - st.magU) / span) ** 2));
          }
          const facing = (Math.cos(th) + 1) / 2;
          opacity = 0.25 + 0.75 * facing * facing;
          z = String(Math.round(facing * 1000));
          dist = Math.cos(th) > 0 ? Math.abs(th) * geo.R : Infinity;
        }
      } else {
        let w = u;
        if (lensFocus > 0) {
          const kf = w / geo.focusSigma;
          scale *= 1 + lensFocus * Math.exp(-kf * kf);
          opacity *=
            1 -
            0.45 *
              lensFocus *
              (1 - Math.exp(-((u / (geo.focusSigma * 1.8)) ** 2)));
          w += lensFocus * geo.focusSigma * HALF_SQRT_PI * erf(kf);
        }
        const near = Math.abs(w - st.magU);
        if (lensMag > 0) {
          const km = (w - st.magU) / geo.magSigma;
          scale *= 1 + lensMag * Math.exp(-km * km);
          w += lensMag * geo.magSigma * HALF_SQRT_PI * erf(km);
        }
        x = w;
        if (geo.mode === 'wave') {
          y = geo.amp * Math.sin(geo.k * w);
          rot =
            (Math.atan(geo.amp * geo.k * Math.cos(geo.k * w)) * 90) / Math.PI;
        } else if (geo.mode === 'arc' && geo.R) {
          const phi = w / geo.R;
          if (Math.abs(phi) > geo.limit) hidden = true;
          x = geo.R * Math.sin(phi);
          y = geo.sign * (geo.R * (1 - Math.cos(phi)) - geo.shift);
          rot = (geo.sign * phi * 180) / Math.PI;
        }
        dist = cursorActive ? near : Math.abs(x);
      }
      if (introRunning && !hidden) {
        const pos = clamp((x + half) / Math.max(1, L), 0, 1);
        const e = easeOut(
          clamp((elapsed - pos * INTRO_STAGGER) / INTRO_TIME, 0, 1),
        );
        opacity *= e;
        y += (1 - e) * 14;
      }
      if (wantsActive && !hidden && dist < bestDist) {
        bestDist = dist;
        best = it;
      }
      if (!needItems) continue;
      const along = x - u;
      const shiftT = cfg.vertical
        ? `translate3d(${y.toFixed(2)}px, ${along.toFixed(2)}px, 0px)`
        : `translate3d(${along.toFixed(2)}px, ${y.toFixed(2)}px, 0px)`;
      const rotT = rot
        ? ` rotate(${(cfg.vertical ? -rot : rot).toFixed(2)}deg)`
        : '';
      const t = hidden ? '' : `${shiftT}${rotT}`;
      write(it, 't', 'transform', t, it.el);
      write(
        it,
        'o',
        'opacity',
        hidden ? '0' : opacity > 0.999 ? '' : opacity.toFixed(3),
        it.el,
      );
      write(it, 'v', 'visibility', hidden ? 'hidden' : '', it.el);
      write(it, 'z', 'zIndex', z, it.el);
      if (it.content) {
        write(
          it,
          's',
          'transform',
          Math.abs(scale - 1) < 0.0005 ? '' : `scale(${scale.toFixed(4)})`,
          it.content,
        );
      }
      if (it.tip) {
        const lift = ((scale - 1) * it.cross) / 2;
        const tipT =
          Math.abs(lift) < 0.05
            ? ''
            : cfg.vertical
              ? `translateX(${lift.toFixed(2)}px)`
              : `translateY(${lift.toFixed(2)}px)`;
        write(it, 'p', 'transform', tipT, it.tip);
      }
    }
    const active =
      best && bestDist < Math.max(best.size, st.pitch) / 2 + 1 ? best : null;
    if (active !== st.active) {
      st.active?.el.removeAttribute('data-active');
      active?.el.setAttribute('data-active', '');
      st.active = active;
    }
  };

  const frame = (now: number): void => {
    st.raf = 0;
    if (st.destroyed || !st.geo || st.period <= 0) return;
    const cfg = getConfig();
    const dt = st.last ? clamp((now - st.last) / 1000, 0, 0.1) : 0;
    st.last = now;
    const P = st.period;
    let busy = false;
    if (st.introStart === -1 && !st.introDone && st.visible) {
      if (cfg.intro && !st.reduced) {
        st.introStart = now;
      } else {
        st.introDone = true;
      }
      root.removeAttribute('data-intro');
    }
    if (st.introStart >= 0) {
      if ((now - st.introStart) / 1000 >= INTRO_TIME + INTRO_STAGGER) {
        st.introStart = -2;
        st.introDone = true;
      } else {
        busy = true;
      }
    }
    const travel = Math.sign(cfg.speed) || 1;
    const paused = st.focused || (st.hovered && cfg.hoverValue !== undefined);
    const pausedSpeed = st.focused ? 0 : (cfg.hoverValue ?? 0);
    let target = st.reduced
      ? 0
      : paused
        ? pausedSpeed * travel * cfg.dirSign
        : cfg.speed * cfg.dirSign;
    if (cfg.scrollBoost > 0 && !st.reduced) {
      st.scrollVel *= Math.exp(-dt / 0.18);
      if (Math.abs(st.scrollVel) > 1) busy = true;
      target +=
        clamp(st.scrollVel * cfg.scrollBoost, -3000, 3000) *
        travel *
        cfg.dirSign;
    }
    if (st.drag?.active) {
      busy = true;
    } else if (st.seek) {
      st.seek.t = Math.min(1, st.seek.t + dt / st.seek.dur);
      st.offset = st.seek.from + st.seek.delta * easeInOut(st.seek.t);
      st.velocity = 0;
      if (st.seek.t >= 1) st.seek = null;
      busy = true;
    } else if (st.move) {
      st.move.t = Math.min(1, st.move.t + dt / st.move.dur);
      st.offset = st.move.from + st.move.delta * easeInOut(st.move.t);
      st.velocity = 0;
      busy = true;
      if (st.move.t >= 1) {
        st.move = null;
        st.hold = stepTiming(paused ? pausedSpeed : cfg.speed).hold;
      }
    } else if (cfg.step && !st.reduced) {
      const speed = paused ? pausedSpeed : cfg.speed;
      st.velocity = 0;
      if (speed) {
        busy = true;
        st.hold -= dt;
        if (st.hold <= 0) {
          const dir = Math.sign(speed) * cfg.dirSign;
          startMove(snapTarget(st.offset, dir), stepTiming(speed).move);
        }
      }
    } else {
      const tau = st.glide ? GLIDE_TAU : SMOOTH_TAU;
      st.velocity += (target - st.velocity) * (1 - Math.exp(-dt / tau));
      if (st.glide && Math.abs(st.velocity - target) < 2) st.glide = false;
      if (Math.abs(st.velocity - target) < 0.01) st.velocity = target;
      st.offset += st.velocity * dt;
      if (st.velocity !== 0 || target !== 0) busy = true;
    }
    if (!st.focused && !st.seek && !st.drag?.active) {
      const wrapped = ((st.offset % P) + P) % P;
      if (st.move) st.move.from += wrapped - st.offset;
      st.offset = wrapped;
    }
    const wantMag = cfg.magnify > 0 && st.pointerInside && !st.reduced ? 1 : 0;
    if (st.mag !== wantMag) {
      st.mag +=
        (wantMag - st.mag) * (1 - Math.exp(-dt / (wantMag ? 0.12 : 0.25)));
      if (Math.abs(wantMag - st.mag) < 0.002) st.mag = wantMag;
      busy = true;
    }
    const pu = st.mag > 0 ? pointerU() : null;
    if (pu !== null) {
      if (!st.magReady) {
        st.magU = pu;
        st.magReady = true;
      }
      const next = st.magU + (pu - st.magU) * (1 - Math.exp(-dt / 0.06));
      if (Math.abs(next - pu) > 0.05) busy = true;
      st.magU = Math.abs(next - pu) > 0.05 ? next : pu;
    } else if (st.mag === 0) {
      st.magReady = false;
    }
    render(now);
    if (busy && st.visible && !st.destroyed) {
      st.raf = requestAnimationFrame(frame);
    }
  };

  const wake = (): void => {
    if (st.raf || st.destroyed || !st.visible) return;
    st.last = 0;
    st.raf = requestAnimationFrame(frame);
  };

  const local = (e: PointerEvent): [number, number] => {
    const r = root.getBoundingClientRect();
    const k = root.offsetWidth ? r.width / root.offsetWidth || 1 : 1;
    return [(e.clientX - r.left) / k, (e.clientY - r.top) / k];
  };

  const dragScale = (): number => {
    const geo = st.geo;
    if (!geo) return 1;
    if (geo.mode === 'orbit') return geo.C / (2 * Math.PI * geo.R * geo.pf);
    const pu = pointerU();
    if (pu === null || geo.focus <= 0) return 1;
    const kf = pu / geo.focusSigma;
    return 1 / (1 + geo.focus * Math.exp(-kf * kf));
  };

  const onEnter = (e: PointerEvent): void => {
    st.hovered = true;
    if (e.pointerType !== 'touch') {
      st.pointerInside = true;
      st.pointer = local(e);
    }
    wake();
  };

  const onLeave = (): void => {
    st.hovered = false;
    st.pointerInside = false;
    wake();
  };

  const onDown = (e: PointerEvent): void => {
    st.pressedAt = performance.now();
    if (
      !getConfig().draggable ||
      (e.pointerType === 'mouse' && e.button !== 0)
    ) {
      return;
    }
    const [x, y] = local(e);
    if (e.pointerType !== 'touch') st.pointer = [x, y];
    st.drag = {
      id: e.pointerId,
      x,
      y,
      active: false,
      samples: [],
      scale: dragScale(),
      anchor: 0,
      offset: 0,
    };
  };

  const onMove = (e: PointerEvent): void => {
    const cfg = getConfig();
    if (e.pointerType !== 'touch') {
      st.pointer = local(e);
      st.pointerInside = true;
    }
    const d = st.drag;
    if (d && e.pointerId === d.id) {
      const [x, y] = local(e);
      const along = cfg.vertical ? y - d.y : x - d.x;
      const across = cfg.vertical ? x - d.x : y - d.y;
      if (!d.active) {
        if (Math.abs(along) < DRAG_THRESHOLD) {
          wake();
          return;
        }
        if (Math.abs(across) > Math.abs(along)) {
          st.drag = null;
          wake();
          return;
        }
        d.active = true;
        d.anchor = along;
        d.offset = st.offset;
        st.move = null;
        st.seek = null;
        st.glide = false;
        st.velocity = 0;
        try {
          root.setPointerCapture(e.pointerId);
        } catch {
          // Pointer may already be released; dragging still works without capture.
        }
        root.setAttribute('data-dragging', '');
      }
      const next = d.offset - (along - d.anchor) * d.scale;
      const P = st.period || 1;
      st.offset = ((next % P) + P) % P;
      d.offset += st.offset - next;
      const now = performance.now();
      d.samples.push([now, along]);
      while (d.samples.length > 2 && now - (d.samples[0]?.[0] ?? now) > 100) {
        d.samples.shift();
      }
    }
    wake();
  };

  const endDrag = (e: PointerEvent, cancelled: boolean): void => {
    const d = st.drag;
    if (!d || e.pointerId !== d.id) return;
    st.drag = null;
    if (!d.active) return;
    root.removeAttribute('data-dragging');
    try {
      root.releasePointerCapture(e.pointerId);
    } catch {
      // Capture already released.
    }
    const cfg = getConfig();
    const now = performance.now();
    st.suppressUntil = now + 400;
    let v = 0;
    const s = d.samples;
    const firstSample = s[0];
    const lastSample = s[s.length - 1];
    if (!cancelled && s.length > 1 && firstSample && lastSample) {
      const [t0, a0] = firstSample;
      const [t1, a1] = lastSample;
      if (t1 > t0 && now - t1 < 80) {
        v = clamp(
          (-(a1 - a0) / (t1 - t0)) * 1000 * d.scale,
          -MAX_FLING,
          MAX_FLING,
        );
      }
    }
    if (cfg.step && !st.reduced) {
      const target = nearestSnap(st.offset + v * 0.35);
      startMove(
        target,
        clamp(0.3 + Math.abs(target - st.offset) / 1800, 0.3, 0.8),
      );
      st.velocity = 0;
    } else {
      st.velocity = v;
      st.glide = Math.abs(v) > 30;
    }
    wake();
  };

  const onUp = (e: PointerEvent): void => endDrag(e, false);
  const onCancel = (e: PointerEvent): void => endDrag(e, true);

  const onClick = (e: MouseEvent): void => {
    if (performance.now() < st.suppressUntil) {
      e.preventDefault();
      e.stopPropagation();
      st.suppressUntil = 0;
    }
  };

  const onDragStart = (e: DragEvent): void => {
    if (getConfig().draggable) e.preventDefault();
  };

  const onFocusIn = (e: FocusEvent): void => {
    const target = e.target;
    if (performance.now() - st.pressedAt < 800) return;
    st.focused = true;
    const it =
      target instanceof Node
        ? st.items.find((item) => item.el.contains(target))
        : undefined;
    if (it && st.geo) {
      const u = -st.offset - st.geo.lead + it.center - st.length / 2;
      const comfortable =
        st.geo.mode === 'orbit' ? 1 : Math.max(0, st.length / 2 - it.size);
      if (Math.abs(u) > comfortable) {
        st.move = null;
        st.seek = {
          from: st.offset,
          delta: u,
          t: 0,
          dur: clamp(0.35 + Math.abs(u) / 2000, 0.35, 0.8),
        };
      }
    }
    wake();
  };

  const onFocusOut = (e: FocusEvent): void => {
    const next = e.relatedTarget;
    if (next instanceof Node && root.contains(next)) return;
    st.focused = false;
    wake();
  };

  const onRootScroll = (): void => {
    if (root.scrollLeft || root.scrollTop) {
      root.scrollLeft = 0;
      root.scrollTop = 0;
    }
  };

  const onWindowScroll = (): void => {
    const now = performance.now();
    const y = window.scrollY;
    if (st.scrollT && now > st.scrollT) {
      const v = ((y - st.scrollY) / (now - st.scrollT)) * 1000;
      st.scrollVel += (clamp(v, -6000, 6000) - st.scrollVel) * 0.5;
    }
    st.scrollY = y;
    st.scrollT = now;
    if (getConfig().scrollBoost > 0) wake();
  };

  const refresh = (): void => {
    collect();
    measure();
    st.last = 0;
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = 0;
    if (st.geo && st.period > 0) frame(performance.now());
  };

  const resize = (): void => {
    measure();
    if (st.geo && st.period > 0) render(performance.now());
    wake();
  };

  const setVisible = (visible: boolean): void => {
    st.visible = visible;
    if (visible) wake();
  };

  const setReduced = (reduced: boolean): void => {
    st.reduced = reduced;
    wake();
  };

  const destroy = (): void => {
    st.destroyed = true;
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = 0;
  };

  return {
    refresh,
    resize,
    wake,
    destroy,
    setVisible,
    setReduced,
    onEnter,
    onLeave,
    onDown,
    onMove,
    onUp,
    onCancel,
    onClick,
    onDragStart,
    onFocusIn,
    onFocusOut,
    onRootScroll,
    onWindowScroll,
  };
}
