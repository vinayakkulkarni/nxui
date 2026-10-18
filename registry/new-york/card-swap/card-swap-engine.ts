import type {
  CardSwapBounds,
  CardSwapEngine,
  CardSwapEngineOptions,
  CardSwapSettings,
} from './types';

const CARD_SWAP_PERSPECTIVE = 900;
const TAU = Math.PI * 2;
const STEP = 1 / 240;
const PAD = 32;
const AXES = ['x', 'y', 'z', 'r', 'p'] as const;
const DOWN = { x: 0, y: 1 };

type Axis = (typeof AXES)[number];
type Pose = Record<Axis, number>;
type Phase = 'rest' | 'exit' | 'enter' | 'drag';

interface Vec {
  x: number;
  y: number;
}

interface DeckCard extends Pose {
  el: HTMLElement | null;
  shade: HTMLElement | null;
  index: number;
  pos: number;
  from: number;
  hold: number;
  nudge: number;
  phase: Phase;
  dir: Vec;
  tilt: number;
  top: number;
  under: boolean;
  v: Pose;
}

interface DragState {
  id: number;
  index: number;
  startX: number;
  startY: number;
  active: boolean;
  samples: { x: number; y: number; t: number }[];
}

interface ShiftOptions {
  dir?: Vec;
  tilt?: number;
  velocity?: Vec;
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function stackBounds(options: {
  width: number;
  height: number;
  cardDistance: number;
  verticalDistance: number;
  depth: number;
  skewAmount: number;
  visible: number;
  hoverSpread: number;
}): CardSwapBounds {
  const { width, height, cardDistance, verticalDistance, depth, visible } =
    options;
  const slope = Math.tan((options.skewAmount * Math.PI) / 180);
  const spread = 1 + Math.max(0, options.hoverSpread);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < visible; i++) {
    const scale = CARD_SWAP_PERSPECTIVE / (CARD_SWAP_PERSPECTIVE + i * depth);
    for (const u of [-width / 2, width / 2]) {
      for (const v of [-height / 2, height / 2]) {
        const x = (i * cardDistance * spread + u) * scale;
        const y = (-i * verticalDistance * spread + v + u * slope) * scale;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return {
    width: Math.ceil(maxX - minX + PAD * 2),
    height: Math.ceil(maxY - minY + PAD * 2),
    originX: PAD - minX,
    originY: PAD - minY,
  };
}

const zeroPose = (): Pose => ({ x: 0, y: 0, z: 0, r: 0, p: 0 });

function swapIndexOf(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element
    ? target.closest<HTMLElement>('[data-swap-index]')
    : null;
}

export function createCardSwapEngine(
  options: CardSwapEngineOptions,
): CardSwapEngine {
  const { root, stage, count, reduce, getSettings } = options;
  const now = performance.now();
  const s0 = getSettings();

  const deck: DeckCard[] = Array.from({ length: count }, (_, index) => ({
    el: options.getSlot(index),
    shade: options.getShade(index),
    index,
    pos: index,
    from: index,
    hold: 0,
    nudge: 0,
    phase: 'rest',
    dir: { x: 0, y: 1 },
    tilt: 0,
    top: 0,
    under: false,
    ...zeroPose(),
    v: zeroPose(),
  }));

  const state = {
    order: deck.map((card) => card.index),
    raf: 0,
    last: 0,
    timer: 0,
    queue: [] as number[],
    layers: 0,
    scale: 1,
    hovered: false,
    overCard: false,
    inView: true,
    drag: null as DragState | null,
    spread: 0,
    spreadV: 0,
    px: 0,
    py: 0,
    pvx: 0,
    pvy: 0,
    tx: 0,
    ty: 0,
    dragged: false,
    autoplay: s0.autoplay,
    delay: s0.delay,
  };

  const cardAt = (position: number): DeckCard | undefined =>
    deck[state.order[position] ?? -1];

  const slot = (position: number, s: CardSwapSettings): Pose => {
    const q = Math.min(position, s.visible);
    const spread = 1 + state.spread;
    return {
      x: q * s.dx * spread,
      y: -q * s.dy * spread,
      z: -q * s.dz,
      r: 0,
      p: q,
    };
  };

  const clearance = (s: CardSwapSettings, dir: Vec) =>
    Math.abs(dir.x) * s.width + Math.abs(dir.y) * s.height + 12;

  const targetOf = (card: DeckCard, s: CardSwapSettings, time: number) => {
    if (card.phase === 'exit') {
      const base = slot(0, s);
      const reach = clearance(s, card.dir) * 1.3;
      return {
        x: base.x + card.dir.x * reach,
        y: base.y + card.dir.y * reach,
        z: base.z,
        r: card.tilt,
        p: 0,
      };
    }
    if (card.phase === 'enter') {
      const base = slot(0, s);
      return {
        x: base.x,
        y: base.y + clearance(s, DOWN) * 1.3,
        z: base.z,
        r: 0,
        p: card.p,
      };
    }
    const position = (time < card.hold ? card.from : card.pos) + card.nudge;
    return slot(Math.max(0, position), s);
  };

  const layerOf = (card: DeckCard) => {
    if (card.top) return 1000 + card.top;
    if (card.under) return 1;
    return 10 + (count - card.pos) * 2;
  };

  const write = (card: DeckCard, s: CardSwapSettings) => {
    const { el, shade } = card;
    if (!el) return;
    el.style.transform = `translate3d(${card.x.toFixed(2)}px, ${card.y.toFixed(2)}px, ${card.z.toFixed(2)}px) rotate(${card.r.toFixed(3)}deg) skewY(${s.skew}deg)`;
    el.style.zIndex = String(layerOf(card));
    const fade = clamp(s.visible - card.p, 0, 1);
    el.style.opacity = fade < 1 ? fade.toFixed(3) : '';
    el.style.visibility = fade <= 0.001 ? 'hidden' : '';
    if (shade) {
      const depthT = clamp(card.p / Math.max(1, s.visible - 1), 0, 1);
      shade.style.opacity = (s.dim * 0.62 * depthT).toFixed(3);
    }
    let cursor = '';
    if (card.phase === 'drag') cursor = 'grabbing';
    else if (card.pos > 0) cursor = 'pointer';
    else if (s.draggable) cursor = 'grab';
    el.style.cursor = cursor;
    if (card.pos === 0) el.setAttribute('data-front', '');
    else el.removeAttribute('data-front');
  };

  const writeStage = (s: CardSwapSettings) => {
    const ox = s.bounds.originX + state.px;
    const oy = s.bounds.originY + state.py;
    stage.style.perspectiveOrigin = `${ox.toFixed(2)}px ${oy.toFixed(2)}px`;
  };

  const integrate = (
    card: DeckCard,
    target: Pose,
    omega: number,
    zeta: number,
    dt: number,
  ) => {
    const k = omega * omega;
    const d = 2 * zeta * omega;
    const steps = Math.max(1, Math.ceil(dt / STEP));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      for (const axis of AXES) {
        const velocity =
          card.v[axis] +
          (k * (target[axis] - card[axis]) - d * card.v[axis]) * h;
        card.v[axis] = velocity;
        card[axis] += velocity * h;
      }
    }
  };

  const scalar = (
    value: number,
    velocity: number,
    target: number,
    omega: number,
    zeta: number,
    dt: number,
  ): [number, number] => {
    const k = omega * omega;
    const d = 2 * zeta * omega;
    const steps = Math.max(1, Math.ceil(dt / STEP));
    const h = dt / steps;
    let x = value;
    let v = velocity;
    for (let i = 0; i < steps; i++) {
      v += (k * (target - x) - d * v) * h;
      x += v * h;
    }
    return [x, v];
  };

  const frame = (time: number) => {
    state.raf = 0;
    const s = getSettings();
    const dt = state.last ? Math.min(0.05, (time - state.last) / 1000) : 1 / 60;
    state.last = time;
    const restOmega = TAU * 1.7 * s.speed;
    const restZeta = reduce ? 1 : 1 - 0.72 * s.bounce;
    const exitOmega = TAU * 1.9 * s.speed;
    let busy = false;

    const spreadTarget = state.hovered && !reduce ? s.hoverSpread : 0;
    [state.spread, state.spreadV] = scalar(
      state.spread,
      state.spreadV,
      spreadTarget,
      TAU * 1.4,
      0.9,
      dt,
    );
    [state.px, state.pvx] = scalar(
      state.px,
      state.pvx,
      reduce ? 0 : state.tx,
      TAU * 1.1,
      1,
      dt,
    );
    [state.py, state.pvy] = scalar(
      state.py,
      state.pvy,
      reduce ? 0 : state.ty,
      TAU * 1.1,
      1,
      dt,
    );
    if (
      Math.abs(state.spread - spreadTarget) > 0.0005 ||
      Math.abs(state.spreadV) > 0.0005 ||
      Math.abs(state.px - state.tx) > 0.05 ||
      Math.abs(state.py - state.ty) > 0.05 ||
      Math.abs(state.pvx) + Math.abs(state.pvy) > 0.05
    ) {
      busy = true;
    }
    writeStage(s);

    for (const card of deck) {
      if (card.phase === 'drag') {
        busy = true;
        write(card, s);
        continue;
      }
      const target = targetOf(card, s, time);
      const moving = card.phase === 'exit' || card.phase === 'enter';
      integrate(
        card,
        target,
        moving ? exitOmega : restOmega,
        moving ? 1 : restZeta,
        dt,
      );
      if (card.phase === 'exit') {
        const base = slot(0, s);
        const travelled =
          (card.x - base.x) * card.dir.x + (card.y - base.y) * card.dir.y;
        if (travelled >= clearance(s, card.dir)) {
          card.phase = 'rest';
          card.top = 0;
          card.hold = 0;
        }
      } else if (card.phase === 'enter') {
        const base = slot(0, s);
        if (card.y - base.y >= clearance(s, DOWN)) {
          card.phase = 'rest';
          card.under = false;
          card.hold = 0;
        }
      }
      if (card.hold > time || card.phase !== 'rest') busy = true;
      for (const axis of AXES) {
        const limit = axis === 'p' ? 0.001 : 0.02;
        if (
          Math.abs(target[axis] - card[axis]) > limit ||
          Math.abs(card.v[axis]) > limit
        ) {
          busy = true;
        }
      }
      write(card, s);
    }

    if (busy) {
      state.raf = requestAnimationFrame(frame);
    } else {
      state.last = 0;
      for (const card of deck) {
        if (card.top && card.phase === 'rest') card.top = 0;
      }
    }
  };

  const wake = () => {
    if (!state.raf) state.raf = requestAnimationFrame(frame);
  };

  const paused = () => {
    const s = getSettings();
    return (
      !s.autoplay ||
      count < 2 ||
      (s.pauseOnHover && state.overCard) ||
      state.drag !== null ||
      !state.inView ||
      document.visibilityState === 'hidden'
    );
  };

  const schedule = () => {
    clearTimeout(state.timer);
    state.timer = 0;
    if (paused()) return;
    state.timer = window.setTimeout(
      () => {
        state.timer = 0;
        shift(1);
      },
      Math.max(400, getSettings().delay),
    );
  };

  const settleOrder = (time: number, stagger: number) => {
    state.order.forEach((index, position) => {
      const card = deck[index];
      if (!card || card.pos === position) return;
      card.from = card.pos;
      card.pos = position;
      card.hold = time + Math.max(0, position) * stagger;
    });
  };

  function shift(direction: number, shiftOptions: ShiftOptions = {}) {
    if (count < 2) return;
    const s = getSettings();
    const time = performance.now();
    const stagger = 0.05 / s.speed;
    if (direction > 0) {
      const front = cardAt(0);
      if (!front) return;
      state.order = [...state.order.slice(1), front.index];
      settleOrder(time, stagger * 1000);
      front.phase = 'exit';
      front.dir = shiftOptions.dir ?? DOWN;
      front.tilt = shiftOptions.tilt ?? 0;
      front.top = ++state.layers;
      front.under = false;
      front.nudge = 0;
      front.hold = 0;
      if (shiftOptions.velocity) {
        front.v.x = shiftOptions.velocity.x;
        front.v.y = shiftOptions.velocity.y;
      }
    } else {
      const back = cardAt(count - 1);
      if (!back) return;
      state.order = [back.index, ...state.order.slice(0, count - 1)];
      settleOrder(time, stagger * 1000);
      back.phase = 'enter';
      back.top = 0;
      back.under = true;
      back.nudge = 0;
      back.hold = 0;
    }
    deck.forEach((card) => {
      if (card.phase === 'rest') card.nudge = 0;
    });
    options.onChange(state.order[0] ?? 0);
    wake();
    schedule();
  }

  const goTo = (position: number) => {
    state.queue.forEach((id) => clearTimeout(id));
    state.queue = [];
    const gap = 110 / getSettings().speed;
    for (let i = 0; i < position; i++) {
      state.queue.push(window.setTimeout(() => shift(1), i * gap));
    }
  };

  const fit = () => {
    const s = getSettings();
    const w = root.clientWidth;
    const h = root.clientHeight;
    const scale = Math.min(
      1,
      w / s.bounds.width,
      h > 0 ? h / s.bounds.height : 1,
    );
    state.scale = scale > 0 ? scale : 1;
    stage.style.transform = `translate(-50%, -50%) scale(${state.scale.toFixed(4)})`;
  };

  const local = (event: PointerEvent) => {
    const box = root.getBoundingClientRect();
    return {
      x: event.clientX - box.left,
      y: event.clientY - box.top,
      w: box.width,
      h: box.height,
    };
  };

  const onMove = (event: PointerEvent) => {
    const s = getSettings();
    if (event.pointerType !== 'touch') {
      const point = local(event);
      const nx = clamp((point.x / Math.max(1, point.w)) * 2 - 1, -1, 1);
      const ny = clamp((point.y / Math.max(1, point.h)) * 2 - 1, -1, 1);
      state.tx = nx * s.parallax * 0.35 * s.bounds.width;
      state.ty = ny * s.parallax * 0.35 * s.bounds.height;
      state.hovered = true;
      const overCard = swapIndexOf(event.target) !== null;
      if (overCard !== state.overCard) {
        state.overCard = overCard;
        schedule();
      }
      wake();
    }
    const drag = state.drag;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = (event.clientX - drag.startX) / state.scale;
    const dy = (event.clientY - drag.startY) / state.scale;
    const card = deck[drag.index];
    if (!card) return;
    if (!drag.active) {
      if (Math.hypot(dx, dy) < 5) return;
      drag.active = true;
      state.dragged = true;
      card.phase = 'drag';
      card.v = zeroPose();
      root.setPointerCapture?.(event.pointerId);
      root.style.cursor = 'grabbing';
    }
    const base = slot(0, s);
    card.x = base.x + dx;
    card.y = base.y + dy;
    card.z = base.z;
    card.r = clamp(dx * 0.035, -9, 9);
    card.p = 0;
    const time = performance.now();
    drag.samples.push({ x: card.x, y: card.y, t: time });
    while (
      drag.samples.length > 2 &&
      time - (drag.samples[0]?.t ?? time) > 90
    ) {
      drag.samples.shift();
    }
    const progress = clamp(
      Math.hypot(dx, dy) / (Math.min(s.width, s.height) * 0.3),
      0,
      1,
    );
    const next = cardAt(1);
    if (next && next.phase === 'rest') next.nudge = -0.22 * progress;
    wake();
  };

  const onLeave = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    if (state.drag?.active) return;
    state.hovered = false;
    state.overCard = false;
    state.tx = 0;
    state.ty = 0;
    schedule();
    wake();
  };

  const onDown = (event: PointerEvent) => {
    const s = getSettings();
    state.dragged = false;
    if (!s.draggable || event.button > 0 || count < 2) return;
    const target = swapIndexOf(event.target);
    if (!target || !root.contains(target)) return;
    const index = Number(target.getAttribute('data-swap-index'));
    if (index !== state.order[0] || deck[index]?.phase !== 'rest') return;
    state.drag = {
      id: event.pointerId,
      index,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      samples: [],
    };
    schedule();
  };

  const onUp = (event: PointerEvent) => {
    const drag = state.drag;
    if (!drag || drag.id !== event.pointerId) return;
    state.drag = null;
    root.style.cursor = '';
    if (!drag.active) {
      schedule();
      return;
    }
    root.releasePointerCapture?.(event.pointerId);
    const s = getSettings();
    const card = deck[drag.index];
    if (!card) return;
    const base = slot(0, s);
    const first = drag.samples[0];
    const lastSample = drag.samples[drag.samples.length - 1];
    const span =
      first && lastSample
        ? Math.max(0.016, (lastSample.t - first.t) / 1000)
        : 1;
    const velocity =
      first && lastSample && lastSample !== first
        ? {
            x: (lastSample.x - first.x) / span,
            y: (lastSample.y - first.y) / span,
          }
        : { x: 0, y: 0 };
    const offset = { x: card.x - base.x, y: card.y - base.y };
    const distance = Math.hypot(offset.x, offset.y);
    const fling = Math.hypot(velocity.x, velocity.y);
    const next = cardAt(1);
    if (next) next.nudge = 0;
    if (
      event.type !== 'pointercancel' &&
      (distance > Math.min(s.width, s.height) * 0.3 || fling > 700)
    ) {
      const aim = {
        x: offset.x + velocity.x * 0.12,
        y: offset.y + velocity.y * 0.12,
      };
      const length = Math.hypot(aim.x, aim.y) || 1;
      card.phase = 'rest';
      shift(1, {
        dir: { x: aim.x / length, y: aim.y / length },
        tilt: card.r,
        velocity,
      });
    } else {
      card.phase = 'rest';
      card.v.x = velocity.x;
      card.v.y = velocity.y;
      wake();
      schedule();
    }
  };

  const onClick = (event: MouseEvent) => {
    if (state.dragged) {
      state.dragged = false;
      return;
    }
    const target = swapIndexOf(event.target);
    if (!target || !root.contains(target)) return;
    const index = Number(target.getAttribute('data-swap-index'));
    options.onCardClick(index);
    const position = state.order.indexOf(index);
    if (position > 0) goTo(position);
  };

  const refresh = () => {
    const s = getSettings();
    deck.forEach((card) => {
      const el = options.getSlot(card.index);
      const shade = options.getShade(card.index);
      if (el === card.el && shade === card.shade) return;
      card.el = el;
      card.shade = shade;
      write(card, s);
    });
    if (s.autoplay !== state.autoplay || s.delay !== state.delay) {
      state.autoplay = s.autoplay;
      state.delay = s.delay;
      schedule();
    }
    fit();
    wake();
  };

  if (options.intro && !reduce) {
    deck.forEach((card) => {
      card.from = 0;
      card.hold = now + (card.pos * 70) / s0.speed;
    });
    stage.animate?.([{ opacity: 0 }, { opacity: 1 }], {
      duration: 420,
      easing: 'ease-out',
    });
  } else {
    deck.forEach((card) => {
      Object.assign(card, slot(card.pos, s0));
    });
  }
  fit();
  writeStage(s0);
  deck.forEach((card) => write(card, s0));
  wake();
  schedule();

  return {
    next: () => shift(1),
    prev: () => shift(-1),
    refresh,
    fit,
    setInView: (inView) => {
      state.inView = inView;
      schedule();
    },
    onMove,
    onLeave,
    onDown,
    onUp,
    onClick,
    onVisibility: schedule,
    destroy: () => {
      cancelAnimationFrame(state.raf);
      clearTimeout(state.timer);
      state.queue.forEach((id) => clearTimeout(id));
    },
  };
}
