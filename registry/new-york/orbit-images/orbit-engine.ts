import type { OrbitEasing, OrbitEngine, OrbitEngineCallbacks } from './types';

const SAMPLES = 720;
const FRONT_GROW = 0.3;
const BACK_SHRINK = 0.45;
const BACK_DIM = 0.55;
const INTRO_SPREAD = 1.3;
const INTRO_FADE = 0.45;
const DRAG_THRESHOLD = 5;

interface OrbitItemState {
  el: HTMLElement;
  t: string;
  o: string;
  z: string;
}

interface DragState {
  id: number;
  x: number;
  y: number;
  active: boolean;
  samples: [number, number][];
  rate: number;
  anchor: number;
  manual: number;
}

interface SeekState {
  from: number;
  delta: number;
  t: number;
  dur: number;
}

type StyleKey = 't' | 'o' | 'z';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const wrapSigned = (value: number): number => value - Math.round(value);

function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (x: number) => number {
  const sample = (a1: number, a2: number, t: number) =>
    ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t;
  const slope = (a1: number, a2: number, t: number) =>
    3 * (1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + 3 * a1;
  return (x) => {
    if (x <= 0 || x >= 1) return x;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const s = slope(x1, x2, t);
      if (Math.abs(s) < 1e-6) break;
      t = clamp(t - (sample(x1, x2, t) - x) / s, 0, 1);
    }
    return sample(y1, y2, t);
  };
}

const EASINGS: Record<OrbitEasing, (t: number) => number> = {
  linear: (t) => t,
  easeIn: cubicBezier(0.42, 0, 1, 1),
  easeOut: cubicBezier(0, 0, 0.58, 1),
  easeInOut: cubicBezier(0.42, 0, 0.58, 1),
};

const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);

/**
 * Imperative orbit engine. Samples the SVG path into a lookup table, then
 * writes transform / opacity / z-index straight onto the item elements each
 * frame. Sleeps when nothing moves; `wake()` restarts the loop.
 */
export function createOrbitEngine(
  root: HTMLElement,
  callbacks: OrbitEngineCallbacks,
  initialReduced: boolean,
): OrbitEngine {
  const { getConfig, setAspect, setIntroPending, setDragging } = callbacks;
  const st = {
    lut: null as Float32Array | null,
    length: 0,
    front: 0,
    yMid: 0,
    yHalf: 1,
    bbox: [0, 0, 1, 1] as [number, number, number, number],
    width: 0,
    height: 0,
    scale: 0,
    size: 0,
    items: [] as OrbitItemState[],
    strokes: [] as SVGElement[],
    lap: 0,
    manual: 0,
    glide: 0,
    speed: 1,
    drag: null as DragState | null,
    seek: null as SeekState | null,
    hovered: false,
    hoverIndex: -1,
    suppressUntil: 0,
    introStart: -1,
    introDone: !getConfig().intro,
    visible: false,
    reduced: initialReduced,
    raf: 0,
    last: 0,
    destroyed: false,
  };
  st.speed = st.reduced || getConfig().paused ? 0 : 1;

  const collect = () => {
    st.items = Array.from(
      root.querySelectorAll<HTMLElement>('[data-orbit-item]'),
    ).map((el) => ({ el, t: '', o: '', z: '' }));
    st.strokes = Array.from(
      root.querySelectorAll<SVGElement>('[data-orbit-stroke]'),
    );
  };

  const applyDash = (reveal: number) => {
    const cfg = getConfig();
    const dash = cfg.pathDash > 0 && st.scale ? cfg.pathDash / st.scale : 0;
    for (const stroke of st.strokes) {
      if (reveal < 1 && !dash) {
        stroke.style.strokeDasharray = `${st.length} ${st.length}`;
        stroke.style.strokeDashoffset = String(st.length * (1 - reveal));
        stroke.style.opacity = '';
      } else {
        stroke.style.strokeDasharray = dash ? `${dash} ${dash * 1.6}` : '';
        stroke.style.strokeDashoffset = '';
        stroke.style.opacity = reveal < 1 ? String(reveal) : '';
      }
    }
  };

  const build = () => {
    const cfg = getConfig();
    const path = root.querySelector<SVGGeometryElement>('[data-orbit-path]');
    let length: number;
    try {
      length = path ? path.getTotalLength() : 0;
    } catch {
      length = 0;
    }
    if (!path || !length || !Number.isFinite(length)) {
      st.lut = null;
      return;
    }
    const lut = new Float32Array(SAMPLES * 2);
    const angle = (cfg.rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const origin = cfg.baseWidth / 2;
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    let front = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const point = path.getPointAtLength((i / SAMPLES) * length);
      const dx = point.x - origin;
      const dy = point.y - origin;
      const x = origin + dx * cos - dy * sin;
      const y = origin + dx * sin + dy * cos;
      lut[i * 2] = x;
      lut[i * 2 + 1] = y;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      if (y > (lut[front * 2 + 1] ?? 0) + 1e-6) front = i;
    }
    st.lut = lut;
    st.length = length;
    st.front = front / SAMPLES;
    st.yMid = (y0 + y1) / 2;
    st.yHalf = Math.max(1e-3, (y1 - y0) / 2);
    const depth = clamp(cfg.depth, 0, 1);
    const margin =
      (cfg.itemSize / 2) *
        (1 + depth * FRONT_GROW) *
        Math.max(1, cfg.hoverScale) +
      2;
    st.bbox = [x0 - margin, y0 - margin, x1 + margin, y1 + margin];
    setAspect((x1 - x0 + margin * 2) / (y1 - y0 + margin * 2));
  };

  const layout = () => {
    const cfg = getConfig();
    st.width = root.clientWidth;
    st.height = root.clientHeight;
    if (!st.lut) return;
    const [bx0, by0, bx1, by1] = st.bbox;
    const scale = Math.min(st.width / (bx1 - bx0), st.height / (by1 - by0));
    st.scale = scale > 0 && Number.isFinite(scale) ? scale : 0;
    st.size = cfg.itemSize * st.scale;
    for (const it of st.items) {
      it.el.style.width = `${st.size}px`;
      it.el.style.height = `${st.size}px`;
    }
    if (!st.scale) return;
    const vw = st.width / st.scale;
    const vh = st.height / st.scale;
    const cx = (bx0 + bx1) / 2;
    const cy = (by0 + by1) / 2;
    root.querySelectorAll('[data-orbit-svg]').forEach((svg) => {
      svg.setAttribute('viewBox', `${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}`);
    });
    const clip = root.querySelector('[data-orbit-clip]');
    if (clip) {
      clip.setAttribute('x', String(cx - vw));
      clip.setAttribute('y', String(st.yMid));
      clip.setAttribute('width', String(vw * 2));
      clip.setAttribute('height', String(vh * 2));
    }
    for (const stroke of st.strokes) {
      stroke.style.strokeWidth = String(cfg.pathWidth / st.scale);
    }
    applyDash(1);
  };

  const sample = (lut: Float32Array, u: number): [number, number] => {
    const f = (((u % 1) + 1) % 1) * SAMPLES;
    const i0 = Math.floor(f) % SAMPLES;
    const i1 = (i0 + 1) % SAMPLES;
    const t = f - Math.floor(f);
    const ax = lut[i0 * 2] ?? 0;
    const ay = lut[i0 * 2 + 1] ?? 0;
    const bx = lut[i1 * 2] ?? 0;
    const by = lut[i1 * 2 + 1] ?? 0;
    return [ax + (bx - ax) * t, ay + (by - ay) * t];
  };

  const heading = (lut: Float32Array, u: number): number => {
    const a = sample(lut, u - 2 / SAMPLES);
    const b = sample(lut, u + 2 / SAMPLES);
    return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  };

  const progress = (): number => {
    const cfg = getConfig();
    const ease = EASINGS[cfg.easing] ?? EASINGS.linear;
    const whole = Math.floor(st.lap);
    return (
      (whole + ease(st.lap - whole)) * (cfg.direction === 'reverse' ? -1 : 1) +
      st.manual
    );
  };

  const offsetOf = (index: number, count: number): number => {
    const cfg = getConfig();
    if (cfg.fill) return index / Math.max(1, count);
    return (-index * cfg.itemSize * 1.3) / Math.max(1, st.length);
  };

  const CSS_PROP: Record<StyleKey, string> = {
    t: 'transform',
    o: 'opacity',
    z: 'z-index',
  };

  const write = (it: OrbitItemState, key: StyleKey, value: string) => {
    if (it[key] !== value) {
      it[key] = value;
      it.el.style.setProperty(CSS_PROP[key], value);
    }
  };

  const render = (now: number) => {
    const cfg = getConfig();
    const lut = st.lut;
    if (!lut || !st.scale) return;
    const p = progress();
    const count = st.items.length;
    const depth = clamp(cfg.depth, 0, 1);
    const [bx0, by0, bx1, by1] = st.bbox;
    const cx = (bx0 + bx1) / 2;
    const cy = (by0 + by1) / 2;
    const half = st.size / 2;
    const introRunning = st.introStart >= 0;
    const elapsed = introRunning ? (now - st.introStart) / 1000 : 0;
    const spread = introRunning
      ? easeOutQuint(clamp(elapsed / INTRO_SPREAD, 0, 1))
      : 1;
    const appear = introRunning ? clamp(elapsed / INTRO_FADE, 0, 1) : 1;
    st.items.forEach((it, i) => {
      let u = p + offsetOf(i, count);
      if (introRunning) u = st.front + wrapSigned(u - st.front) * spread;
      const [x, y] = sample(lut, u);
      const d = clamp((y - st.yMid) / st.yHalf, -1, 1);
      const w = (d + 1) / 2;
      let scale = 1 + depth * (FRONT_GROW * w - BACK_SHRINK * (1 - w));
      let opacity = 1 - depth * BACK_DIM * (1 - w);
      if (introRunning) {
        scale *= 0.7 + 0.3 * appear;
        opacity *= appear * appear * (3 - 2 * appear);
      }
      const sx = (x - cx) * st.scale + st.width / 2 - half;
      const sy = (y - cy) * st.scale + st.height / 2 - half;
      const rot = cfg.alignToPath ? heading(lut, u) : 0;
      let z =
        depth > 0
          ? d <= 0
            ? 10 + Math.round((d + 1) * 80)
            : 110 + Math.round(d * 80)
          : 1;
      if (i === st.hoverIndex) z += 200;
      write(
        it,
        't',
        `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0px)${rot ? ` rotate(${rot.toFixed(2)}deg)` : ''} scale(${scale.toFixed(4)})`,
      );
      write(it, 'o', opacity > 0.999 ? '' : opacity.toFixed(3));
      write(it, 'z', String(z));
    });
    if (introRunning)
      applyDash(easeOutQuint(clamp(elapsed / INTRO_SPREAD, 0, 1)));
  };

  const frame = (now: number) => {
    st.raf = 0;
    if (st.destroyed) return;
    const cfg = getConfig();
    const dt = st.last ? clamp((now - st.last) / 1000, 0, 0.1) : 0;
    st.last = now;
    let busy = false;
    if (
      st.lut &&
      st.scale &&
      st.introStart === -1 &&
      !st.introDone &&
      st.visible
    ) {
      if (cfg.intro && !st.reduced) {
        st.introStart = now;
      } else {
        st.introDone = true;
      }
      setIntroPending(false);
    }
    if (st.introStart >= 0) {
      if ((now - st.introStart) / 1000 >= INTRO_SPREAD) {
        st.introStart = -2;
        st.introDone = true;
        applyDash(1);
      } else {
        busy = true;
      }
    }
    const want =
      cfg.paused || st.reduced
        ? 0
        : st.hovered
          ? clamp(cfg.hoverSpeed, 0, 1)
          : 1;
    if (st.speed !== want) {
      st.speed += (want - st.speed) * (1 - Math.exp(-dt / 0.35));
      if (Math.abs(st.speed - want) < 0.002) st.speed = want;
      busy = true;
    }
    if (st.speed > 0 && cfg.duration > 0) {
      st.lap += (dt * st.speed) / cfg.duration;
      busy = true;
    }
    if (st.drag?.active) {
      busy = true;
    } else if (st.seek) {
      const seek = st.seek;
      seek.t = Math.min(1, seek.t + dt / seek.dur);
      const e =
        seek.t < 0.5 ? 4 * seek.t ** 3 : 1 - Math.pow(-2 * seek.t + 2, 3) / 2;
      st.manual = seek.from + seek.delta * e;
      if (seek.t >= 1) st.seek = null;
      busy = true;
    } else if (st.glide) {
      st.manual += st.glide * dt;
      st.glide *= Math.exp(-dt / 0.7);
      if (Math.abs(st.glide) < 0.0004) st.glide = 0;
      busy = true;
    }
    render(now);
    const whole = Math.floor(st.lap);
    if (whole) st.lap -= whole;
    if (!st.drag && !st.seek) st.manual -= Math.floor(st.manual);
    if (busy && st.visible && !st.destroyed)
      st.raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (st.raf || st.destroyed || !st.visible) return;
    st.last = 0;
    st.raf = requestAnimationFrame(frame);
  };

  const local = (e: PointerEvent): [number, number] => {
    const r = root.getBoundingClientRect();
    const k = root.offsetWidth ? r.width / root.offsetWidth || 1 : 1;
    return [(e.clientX - r.left) / k, (e.clientY - r.top) / k];
  };

  const dragRate = (): number => {
    const lut = st.lut;
    if (!lut || !st.scale) return 0;
    const a = sample(lut, st.front - 3 / SAMPLES);
    const b = sample(lut, st.front + 3 / SAMPLES);
    const along = ((b[0] - a[0]) / (6 / SAMPLES)) * st.scale;
    const floor = st.length * st.scale * 0.35;
    return Math.abs(along) < floor ? Math.sign(along || 1) * floor : along;
  };

  const itemIndex = (target: EventTarget | null): number => {
    const el =
      target instanceof Element ? target.closest('[data-orbit-item]') : null;
    return el && root.contains(el)
      ? Number(el.getAttribute('data-orbit-item'))
      : -1;
  };

  const bringToFront = (index: number) => {
    if (!st.lut || index < 0) return;
    const u = progress() + offsetOf(index, st.items.length);
    const delta = wrapSigned(st.front - u);
    st.glide = 0;
    st.seek = {
      from: st.manual,
      delta,
      t: 0,
      dur: 0.45 + Math.abs(delta) * 1.4,
    };
    wake();
  };

  const onEnter = () => {
    st.hovered = true;
    wake();
  };

  const onLeave = () => {
    st.hovered = false;
    st.hoverIndex = -1;
    wake();
  };

  const onOver = (e: PointerEvent) => {
    const index = itemIndex(e.target);
    if (index !== st.hoverIndex) {
      st.hoverIndex = index;
      if (st.lut) render(performance.now());
    }
  };

  const onDown = (e: PointerEvent) => {
    const cfg = getConfig();
    if (!cfg.draggable || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (e.target instanceof Element && e.target.closest('[data-orbit-center]'))
      return;
    const [x, y] = local(e);
    st.drag = {
      id: e.pointerId,
      x,
      y,
      active: false,
      samples: [],
      rate: dragRate(),
      anchor: 0,
      manual: 0,
    };
  };

  const onMove = (e: PointerEvent) => {
    const d = st.drag;
    if (!d || e.pointerId !== d.id) return;
    const [x, y] = local(e);
    const along = x - d.x;
    if (!d.active) {
      if (Math.abs(along) < DRAG_THRESHOLD) return;
      if (Math.abs(y - d.y) > Math.abs(along)) {
        st.drag = null;
        return;
      }
      d.active = true;
      d.anchor = along;
      d.manual = st.manual;
      st.seek = null;
      st.glide = 0;
      try {
        root.setPointerCapture(e.pointerId);
      } catch {
        // Pointer already released; dragging still works without capture.
      }
      setDragging(true);
    }
    if (d.rate) st.manual = d.manual + (along - d.anchor) / d.rate;
    const now = performance.now();
    d.samples.push([now, along]);
    while (d.samples.length > 2 && now - (d.samples[0]?.[0] ?? now) > 100)
      d.samples.shift();
    wake();
  };

  const endDrag = (e: PointerEvent, cancelled: boolean) => {
    const d = st.drag;
    if (!d || e.pointerId !== d.id) return;
    st.drag = null;
    if (!d.active) return;
    setDragging(false);
    try {
      root.releasePointerCapture(e.pointerId);
    } catch {
      // Capture already lost.
    }
    const now = performance.now();
    st.suppressUntil = now + 400;
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    if (!cancelled && first && last && d.samples.length > 1 && d.rate) {
      const [t0, a0] = first;
      const [t1, a1] = last;
      if (t1 > t0 && now - t1 < 80)
        st.glide = clamp((((a1 - a0) / (t1 - t0)) * 1000) / d.rate, -3, 3);
    }
    wake();
  };

  const activate = (index: number) => {
    const cfg = getConfig();
    if (index < 0) return;
    if (cfg.clickToFront) bringToFront(index);
    cfg.onItemClick?.(index, cfg.sources[index] ?? '');
  };

  const onClick = (e: MouseEvent) => {
    if (performance.now() < st.suppressUntil) {
      e.preventDefault();
      e.stopPropagation();
      st.suppressUntil = 0;
      return;
    }
    activate(itemIndex(e.target));
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const index = itemIndex(e.target);
    if (index < 0) return;
    e.preventDefault();
    activate(index);
  };

  const onFocus = (e: FocusEvent) => {
    const index = itemIndex(e.target);
    if (
      index >= 0 &&
      getConfig().clickToFront &&
      e.target instanceof Element &&
      e.target.matches(':focus-visible')
    )
      bringToFront(index);
  };

  const resize = () => {
    layout();
    render(performance.now());
    wake();
  };

  const refresh = () => {
    collect();
    build();
    layout();
    render(performance.now());
    wake();
  };

  const destroy = () => {
    st.destroyed = true;
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = 0;
  };

  const setVisible = (visible: boolean) => {
    st.visible = visible;
    if (visible) wake();
  };

  const setReduced = (reduced: boolean) => {
    st.reduced = reduced;
    wake();
  };

  return {
    refresh,
    wake,
    resize,
    destroy,
    setVisible,
    setReduced,
    onEnter,
    onLeave,
    onOver,
    onDown,
    onMove,
    onUp: (e) => endDrag(e, false),
    onCancel: (e) => endDrag(e, true),
    onClick,
    onKey,
    onFocus,
  };
}
