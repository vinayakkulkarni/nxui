import { paintBack, rasterize } from './folder-glass';
import {
  BOOK_ANGLES,
  DROP_TURN,
  FLAP_ANGLES,
  LAYERS,
  STEP,
  TAU,
  chain,
  clamp,
  move,
  multiply,
  placeBook,
  placeFlap,
  stretch,
  toCss,
  turnX,
  turnY,
  turnZ,
} from './folder-math';
import type {
  FolderBounds,
  FolderDragState,
  FolderEngine,
  FolderEngineOptions,
  FolderEngineState,
  FolderGlassRenderer,
  FolderItemMatrix,
  FolderItemState,
  FolderPhase,
  FolderSceneLayer,
  FolderSettings,
  FolderSlot,
  FolderSpring,
} from './types';

const spring = (value: number): FolderSpring => ({ value, velocity: 0 });

const snap = (item: FolderSpring, value: number) => {
  item.value = value;
  item.velocity = 0;
};

const integrate = (
  item: FolderSpring,
  target: number,
  omega: number,
  zeta: number,
  dt: number,
) => {
  const k = omega * omega;
  const d = 2 * zeta * omega;
  const steps = Math.max(1, Math.ceil(dt / STEP));
  const step = dt / steps;
  for (let i = 0; i < steps; i++) {
    item.velocity += (k * (target - item.value) - d * item.velocity) * step;
    item.value += item.velocity * step;
  }
  return Math.abs(target - item.value) > 0.01 || Math.abs(item.velocity) > 0.01;
};

const velocityOf = (samples: number[][]) => {
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (samples.length < 2 || !first || !last) return [0, 0];
  const span = Math.max(0.016, ((last[0] ?? 0) - (first[0] ?? 0)) / 1000);
  return [
    ((last[1] ?? 0) - (first[1] ?? 0)) / span,
    ((last[2] ?? 0) - (first[2] ?? 0)) / span,
  ];
};

const itemAt = (event: Event, root: HTMLElement) => {
  const target =
    event.target instanceof Element
      ? event.target.closest('[data-folder-item]')
      : null;
  return target && root.contains(target) ? target : null;
};

/** Spring physics engine for the folder: front flap/cover, desk tilt, pages, drag and drop, intro. */
export const createFolderEngine = (
  options: FolderEngineOptions,
): FolderEngine => {
  const { elements, settings, reduce } = options;
  const root = elements.root;

  const state: FolderEngineState = {
    raf: 0,
    last: 0,
    ready: false,
    hovered: false,
    pressed: false,
    pointerX: 0,
    pointerY: 0,
    deskX: 0,
    deskY: 0,
    hoveredItem: -1,
    phase: 'rest',
    previous: 'rest',
    changedAt: 0,
    front: spring(0),
    rx: spring(0),
    ry: spring(0),
    lift: spring(0),
    squash: spring(1),
    items: [],
    focus: -1,
    drag: null,
    receiving: false,
    receiveUntil: 0,
    suppressClick: false,
    dropCount: 0,
    intro: { phase: 'done', start: 0, opening: false },
    anchor: spring(0),
    appear: 1,
    content: { key: '', entries: null, renderer: null },
  };

  const syncOutside = () => {
    const list: number[] = [];
    state.items.forEach((item, index) => {
      if (item.place === 'out') list.push(index);
    });
    options.setOutside(list);
  };

  const ensureItems = (n: number) => {
    while (state.items.length < n) {
      state.items.push({
        x: spring(0),
        y: spring(0),
        z: spring(0),
        r: spring(0),
        ry: spring(0),
        s: spring(1),
        hover: spring(0),
        mx: spring(0),
        my: spring(0),
        alpha: spring(1),
        place: 'inside',
        rank: 0,
        layer: 'inside',
        elevated: false,
        insertUntil: 0,
        insertFrom: null,
        outX: 0,
        outY: 0,
        outR: 0,
        outS: 1,
        outOrder: 0,
        localX: 0,
        localY: 0,
        fresh: true,
      });
    }
    if (state.items.length > n) {
      state.items.length = n;
      if (state.focus >= n) state.focus = -1;
      syncOutside();
    }
  };

  const shiftOf = () => {
    const { g } = settings();
    return g.book ? (g.w / 2) * clamp(-state.front.value / 180, 0, 1) : 0;
  };

  const toDesk = (clientX: number, clientY: number) => {
    const box = root.getBoundingClientRect();
    const kx = root.offsetWidth / (box.width || 1);
    const ky = root.offsetHeight / (box.height || 1);
    return [(clientX - box.left) * kx, (clientY - box.top) * ky] as const;
  };

  const clipBounds = (): FolderBounds => {
    const box = root.getBoundingClientRect();
    let left = 0;
    let top = 0;
    let right = window.innerWidth;
    let bottom = window.innerHeight;
    for (
      let node = root.parentElement;
      node && node !== document.body;
      node = node.parentElement
    ) {
      const computed = getComputedStyle(node);
      if (
        /hidden|clip|auto|scroll/.test(
          `${computed.overflowX} ${computed.overflowY}`,
        )
      ) {
        const rect = node.getBoundingClientRect();
        left = Math.max(left, rect.left);
        top = Math.max(top, rect.top);
        right = Math.min(right, rect.right);
        bottom = Math.min(bottom, rect.bottom);
        break;
      }
    }
    const kx = root.offsetWidth / (box.width || 1);
    const ky = root.offsetHeight / (box.height || 1);
    return {
      left: (left - box.left) * kx,
      top: (top - box.top) * ky,
      right: (right - box.left) * kx,
      bottom: (bottom - box.top) * ky,
    };
  };

  const overFolder = (x: number, y: number) => {
    const { g } = settings();
    const shift = shiftOf();
    if (g.book) {
      const left = state.front.value < -90 ? shift - g.w : shift;
      return (
        x >= left && x <= shift + g.w && y >= g.tabH * 0.5 && y <= g.tabH + g.h
      );
    }
    return x >= 0 && x <= g.w && y >= 0 && y <= g.tabH + g.h;
  };

  const inPocket = (item: FolderItemState) => {
    const { g } = settings();
    const halfW = (g.docW * item.s.value) / 2;
    const halfH = (g.docH * item.s.value) / 2;
    if (g.book) {
      if (state.front.value < -60) return false;
      const shift = shiftOf();
      return (
        item.x.value - halfW < shift + g.w &&
        item.x.value + halfW > shift &&
        item.y.value + halfH > g.tabH &&
        item.y.value - halfH < g.tabH + g.h
      );
    }
    if (state.front.value < -45) return false;
    return (
      item.y.value + halfH > g.frontTop + 4 * g.scale &&
      item.x.value + halfW > 0 &&
      item.x.value - halfW < g.w
    );
  };

  const phaseOf = (s: FolderSettings, time: number): FolderPhase => {
    if (s.open) return 'open';
    if (state.receiving || time < state.receiveUntil) return 'receive';
    if (s.peek && state.hovered && !state.drag?.active) return 'peek';
    return 'rest';
  };

  const place = (
    rank: number,
    inside: number,
    phase: FolderPhase,
    s: FolderSettings,
  ) => {
    if (s.g.book) return placeBook(rank, inside, phase, s.layout, s.g);
    const pointer = state.hovered ? ((state.pointerX + 1) / 2) * s.g.w : null;
    return placeFlap(rank, inside, phase, s.layout, s.g, pointer);
  };

  const approach = (
    item: FolderItemState,
    slot: FolderSlot,
    s: FolderSettings,
  ): FolderSlot => {
    const { g } = s;
    if (item.insertFrom === 'side') {
      return { ...slot, x: Math.max(slot.x, g.w + g.docW * 0.54 * slot.s) };
    }
    return {
      ...slot,
      y: Math.min(slot.y, g.frontTop - g.docH * 0.5 * slot.s - 8 * g.scale),
    };
  };

  const invalidate = () => {
    state.content.key = '';
    wake();
  };

  const refreshContent = (renderer: FolderGlassRenderer, s: FolderSettings) => {
    if (
      state.content.key === s.content &&
      state.content.entries === s.entries &&
      state.content.renderer === renderer
    ) {
      return;
    }
    state.content = { key: s.content, entries: s.entries, renderer };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const keys = new Set(['back']);
    renderer.upload('back', paintBack(s.g, s.insideTop, s.insideBottom, dpr));
    for (let index = 0; index < s.count; index++) {
      const node = elements.item(index);
      if (!node) continue;
      const key = `item-${index}`;
      keys.add(key);
      let result = rasterize(node, dpr, false);
      try {
        renderer.upload(key, result.canvas);
      } catch {
        result = rasterize(node, dpr, true);
        renderer.upload(key, result.canvas);
      }
      result.pending.forEach((image) =>
        image.addEventListener('load', invalidate, { once: true }),
      );
    }
    renderer.prune(keys);
  };

  const write = () => {
    const s = settings();
    const { w, h, tabH, frontTop, frontH, docW, docH, scale } = s.g;
    const isBook = s.g.book;
    const pivotX = w / 2;
    const pivotY = tabH + h / 2;
    const theta = state.front.value;
    const angle = (theta * Math.PI) / 180;
    const unfold = isBook ? clamp(-theta / 180, 0, 1) : 0;
    const shift = (w / 2) * unfold * (1 - state.anchor.value);
    const zoom =
      (1 + state.lift.value * 0.012) *
      state.squash.value *
      (0.94 + 0.06 * state.appear);
    root.style.opacity = state.appear < 0.999 ? state.appear.toFixed(3) : '';
    const desk = chain(
      move(pivotX, pivotY),
      turnX(state.rx.value),
      turnY(state.ry.value),
      stretch(zoom, zoom),
      move(-pivotX, -pivotY),
    );
    const folder = multiply(desk, move(shift, 0));
    const flipped = isBook && theta < -90;
    const frontZ = flipped ? '3' : '40';

    const back = elements.back();
    if (back) {
      back.style.transform = toCss(folder);
      back.style.setProperty('--folder-gutter', unfold.toFixed(3));
      back.style.setProperty(
        '--folder-label',
        (isBook ? 1 : 1 - clamp((-theta - 18) / 26, 0, 1)).toFixed(3),
      );
    }

    const frontMatrix = isBook
      ? chain(folder, move(0, frontTop, 2 * scale * (1 - unfold)), turnY(theta))
      : chain(
          folder,
          move(0, tabH + h, 2 * scale),
          turnX(theta),
          move(0, -frontH),
        );
    const facing = isBook
      ? Math.sin(angle) * -0.42 + Math.cos(angle) * 0.9
      : Math.sin(angle) * 0.5 + Math.cos(angle) * 0.86;
    const light = (flipped ? -facing : facing) / (isBook ? 0.9 : 0.86);
    const glint = clamp((light - 1) * 0.9, 0, 0.18);
    const dim = clamp((1 - light) * (isBook ? 0.5 : 0.22), 0, 0.5);

    const front = elements.front();
    if (front) {
      front.style.transform = toCss(frontMatrix);
      front.style.zIndex = frontZ;
      front.dataset.face = flipped ? 'inner' : 'outer';
      front.style.setProperty('--folder-glint', glint.toFixed(3));
      front.style.setProperty('--folder-dim', dim.toFixed(3));
    }

    const rise = isBook ? Math.max(0, Math.sin(-angle)) : 0;
    const ground = elements.ground();
    if (ground) {
      ground.style.transform = toCss(
        multiply(folder, move(0, isBook ? tabH : tabH + h)),
      );
      ground.style.opacity = (0.75 + state.lift.value * 0.25).toFixed(3);
    }
    const cast = elements.cast();
    if (cast) {
      cast.style.transform = toCss(
        chain(
          folder,
          move(w * rise * 0.12, frontTop + h * rise * 0.04),
          stretch(Math.cos(angle), 1),
        ),
      );
      cast.style.opacity = (flipped ? 1 - rise * 0.7 : 0).toFixed(3);
    }
    const shade = elements.shade();
    if (shade) {
      const edge = w * Math.cos(angle) + w * rise * 0.36;
      shade.style.transform = toCss(
        chain(
          folder,
          move(0, frontTop + h * rise * 0.03),
          stretch(edge / w, 1),
        ),
      );
      shade.style.zIndex = edge > 0 ? '39' : '2';
      shade.style.opacity = (clamp(rise * 4, 0, 1) * (1 - rise * 0.45)).toFixed(
        3,
      );
    }

    const outs = state.items
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.item.layer === 'out')
      .sort((a, b) => a.item.outOrder - b.item.outOrder)
      .map((entry) => entry.index);
    const matrices: FolderItemMatrix[] = [];
    state.items.forEach((item, index) => {
      const node = elements.item(index);
      const z = 3 * scale + item.z.value + item.hover.value * 26 * scale;
      const matrix = chain(
        desk,
        move(item.x.value + item.mx.value, item.y.value + item.my.value, z),
        turnY(item.ry.value),
        turnZ(item.r.value),
        stretch(item.s.value, item.s.value),
        move(-docW / 2, -docH / 2),
      );
      let layer = 10 + s.count - item.rank;
      if (
        item.layer === 'inside' &&
        state.phase === 'open' &&
        state.hoveredItem === index
      )
        layer = 30;
      if (item.layer === 'out') layer = LAYERS.out + outs.indexOf(index);
      if (item.layer === 'drag') layer = LAYERS.drag;
      if (item.layer === 'focus') layer = LAYERS.focus;
      matrices.push({
        index,
        matrix,
        layer,
        alpha: clamp(item.alpha.value, 0, 1),
        inside: item.layer === 'inside',
      });
      if (!node) return;
      node.style.transform = toCss(matrix);
      node.style.zIndex = String(layer);
      node.style.setProperty(
        '--folder-lift',
        clamp(item.hover.value, 0, 2.4).toFixed(3),
      );
      node.style.opacity =
        item.alpha.value < 0.995
          ? Math.max(0, item.alpha.value).toFixed(3)
          : '';
    });

    const canvas = elements.canvas();
    const renderer = elements.renderer();
    if (!canvas || !renderer || !s.glass) return;
    canvas.style.zIndex = frontZ;
    refreshContent(renderer, s);
    const layers: FolderSceneLayer[] = [];
    if (!flipped) {
      layers.push({
        key: 'back',
        matrix: folder,
        width: w,
        height: tabH + h,
        alpha: 1,
      });
      matrices
        .filter((entry) => entry.inside)
        .sort((a, b) => a.layer - b.layer)
        .forEach((entry) =>
          layers.push({
            key: `item-${entry.index}`,
            matrix: entry.matrix,
            width: docW,
            height: docH,
            alpha: entry.alpha,
          }),
        );
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.render({
      dpr,
      depth: s.depth,
      origin: [pivotX, pivotY],
      view: s.view,
      layers,
      glass: {
        matrix: frontMatrix,
        width: w,
        height: frontH,
        radii: isBook ? [0, s.g.r, s.g.r, 0] : [s.g.r, s.g.r, s.g.r, s.g.r],
        spine: isBook ? w * 2 : 0,
        bleed: flipped ? 2 : 0,
        morph: isBook ? clamp((unfold - 0.55) / 0.45, 0, 1) ** 2 : 0,
        insideTop: s.insideTone[0] ?? [0, 0, 0],
        insideBottom: s.insideTone[1] ?? [0, 0, 0],
        tabRatio: tabH / (tabH + h),
        gutter: [12 * scale, isBook ? 0.12 * unfold : 0],
        bevel: 12 * scale,
        strength: 14 * scale,
        split: 0.26,
        lens: 0.02,
        frost: s.frost * 6 * scale,
        tint: [
          (s.tint[0] ?? 0) / 255,
          (s.tint[1] ?? 0) / 255,
          (s.tint[2] ?? 0) / 255,
          s.light ? 0.1 : 0.14,
        ],
        haze: 0.04 + s.frost * 0.1,
        dim: dim * 0.8,
        glint,
        shine: s.light ? 0.72 : 0.85,
        light: flipped ? [0.55, -0.83] : [-0.55, -0.83],
      },
    });
  };

  const frame = (now: number) => {
    state.raf = 0;
    const s = settings();
    const { g } = s;
    const still = reduce();
    ensureItems(s.count);
    const time = now / 1000;
    const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
    state.last = now;
    const zeta = still ? 1 : 1 - 0.72 * s.bounce;
    const frontOmega = TAU * (g.book ? 1.55 : 2) * s.speed;
    const itemOmega = TAU * 2.1 * s.speed;
    const soft = TAU * 1.6 * s.speed;
    const phase = phaseOf(s, time);
    if (phase !== state.phase) {
      state.previous = state.phase;
      state.phase = phase;
      state.changedAt = now;
    }
    const elapsed = (now - state.changedAt) / 1000;
    let busy = time < state.receiveUntil;

    const ranks: number[] = [];
    state.items.forEach((item, index) => {
      if (item.place === 'inside') ranks.push(index);
    });
    const inside = ranks.length;
    ranks.forEach((index, rank) => {
      const item = state.items[index];
      if (item) item.rank = rank;
    });
    if (
      state.focus >= 0 &&
      phase !== 'open' &&
      state.items[state.focus]?.place === 'inside'
    )
      state.focus = -1;

    const intro = state.intro;
    if (!state.ready) intro.opening = s.open;
    if (
      intro.phase === 'run' &&
      !intro.opening &&
      (s.open || state.drag?.active)
    )
      intro.phase = 'done';
    const introTime = intro.phase === 'run' ? time - intro.start : 0;
    const staged = intro.phase !== 'done' && !intro.opening;
    const closeAt = (0.16 + inside * 0.085 + 0.3) / s.speed;
    const holding = staged && introTime < closeAt;
    const dropAt = (rank: number) =>
      (0.16 + (inside - 1 - rank) * 0.085) / s.speed;
    const introPose = (item: FolderItemState, slot: FolderSlot): FolderSlot =>
      g.book
        ? { ...slot, r: slot.r + (item.rank % 2 ? 7 : -6), s: slot.s * 1.12 }
        : {
            ...slot,
            y: slot.y - (g.h * 0.8 + g.docH * 0.5),
            r: slot.r + (item.rank % 2 ? 9 : -7),
          };
    if (intro.phase === 'run') {
      busy = true;
      if (introTime > (intro.opening ? 1.4 : closeAt + 1) / s.speed)
        intro.phase = 'done';
    }
    const appear =
      intro.phase === 'wait'
        ? 0
        : intro.phase === 'run'
          ? clamp(introTime / (0.34 / s.speed), 0, 1)
          : 1;
    state.appear = 1 - (1 - appear) ** 3;

    const closing = state.previous === 'open' && phase !== 'open';
    const frontDelay =
      closing && !still
        ? ((g.book ? 0.1 : 0.06) + 0.035 * inside) / s.speed
        : 0;
    const frontPhase = elapsed < frontDelay ? state.previous : phase;
    const frontTarget = holding
      ? g.book
        ? -150
        : -42
      : (g.book ? BOOK_ANGLES : FLAP_ANGLES)[frontPhase];

    if (!state.ready) {
      state.ready = true;
      const opening = intro.phase !== 'done' && intro.opening;
      if (opening) {
        state.phase = 'rest';
        state.previous = 'rest';
      }
      snap(state.front, opening ? 0 : frontTarget);
      snap(state.anchor, staged ? 1 : 0);
      state.items.forEach((item) => {
        const slot = place(item.rank, inside, opening ? 'rest' : phase, s);
        const target = staged ? introPose(item, slot) : slot;
        snap(item.x, target.x);
        snap(item.y, target.y);
        snap(item.z, target.z);
        snap(item.r, target.r);
        snap(item.ry, target.ry);
        snap(item.s, target.s);
        snap(item.alpha, staged ? 0 : 1);
        snap(item.hover, staged && g.book ? 3 : 0);
        item.fresh = false;
      });
    }

    if (intro.phase === 'wait') {
      write();
      state.last = 0;
      return;
    }

    busy = integrate(state.front, frontTarget, frontOmega, zeta, dt) || busy;
    const restitution = 0.2 + 0.35 * s.bounce;
    if (g.book && state.front.value < -180) {
      state.front.value = -360 - state.front.value;
      state.front.velocity = -state.front.velocity * restitution;
    } else if (state.front.value > 0) {
      state.front.value = -state.front.value;
      state.front.velocity = -state.front.velocity * restitution;
    }
    if (elapsed < frontDelay) busy = true;
    busy = integrate(state.anchor, staged ? 1 : 0, frontOmega, 1, dt) || busy;

    const engaged = state.hovered && !still;
    busy =
      integrate(
        state.rx,
        engaged ? -state.pointerY * 8 * s.tilt : 0,
        soft,
        1,
        dt,
      ) || busy;
    busy =
      integrate(
        state.ry,
        engaged ? state.pointerX * 10 * s.tilt : 0,
        soft,
        1,
        dt,
      ) || busy;
    busy =
      integrate(
        state.lift,
        state.hovered && phase !== 'open' ? 1 : 0,
        soft,
        1,
        dt,
      ) || busy;
    busy =
      integrate(state.squash, state.pressed ? 0.975 : 1, TAU * 3.2, 0.6, dt) ||
      busy;

    const opening = phase === 'open' && state.previous !== 'open';
    const drag = state.drag?.active ? state.drag : null;
    const hover = state.hoveredItem;
    const hoveredState = state.items[hover];
    const hovering = !drag && hover >= 0 && hoveredState ? hoveredState : null;
    const lead =
      hovering && hovering.place === 'inside' && phase === 'open'
        ? place(hovering.rank, inside, 'open', s)
        : null;
    const focusScale = clamp(((g.tabH + g.h) * 1.18) / g.docH, 1.2, 2.2);
    const focusY = g.book ? g.tabH + g.h / 2 : g.tabH + g.h * 0.36;

    state.items.forEach((item, index) => {
      if (item.fresh) {
        const start = place(item.rank, inside, 'rest', s);
        snap(item.x, start.x);
        snap(item.y, start.y);
        snap(item.r, start.r);
        item.fresh = false;
      }
      let target: FolderSlot;
      let omega = itemOmega;
      let damping = zeta;
      let lift = 0;
      let fade = 1;
      let magnet = false;
      if (state.focus === index) {
        target = { x: g.w / 2, y: focusY, z: 0, r: 0, ry: 0, s: focusScale };
        lift = 2.4;
        item.layer = 'focus';
      } else if (drag && drag.index === index) {
        const [vx = 0] = velocityOf(drag.samples);
        target = {
          x: state.deskX + drag.grabX,
          y: state.deskY + drag.grabY,
          z: 0,
          r: clamp(vx * 0.012, -14, 14),
          ry: 0,
          s: drag.scale * 1.05,
        };
        omega = TAU * 5;
        damping = 0.78;
        lift = 1.4;
        if (!item.elevated && !inPocket(item)) item.elevated = true;
        item.layer = item.elevated ? 'drag' : 'inside';
      } else if (item.place === 'out') {
        target = {
          x: item.outX,
          y: item.outY,
          z: 0,
          r: item.outR,
          ry: 0,
          s: item.outS,
        };
        lift = hover === index ? 1 : 0.15;
        magnet = hover === index;
        item.layer = 'out';
      } else {
        const order = opening
          ? g.book
            ? inside - 1 - item.rank
            : item.rank
          : item.rank;
        const delay = still
          ? 0
          : opening
            ? ((g.book ? 0.16 : 0.05) + order * (g.book ? 0.055 : 0.045)) /
              s.speed
            : (order * 0.03) / s.speed;
        const active = elapsed >= delay ? phase : state.previous;
        target = place(item.rank, inside, active, s);
        if (elapsed < delay) busy = true;
        if (staged && introTime < dropAt(item.rank)) {
          target = introPose(item, target);
          fade = 0;
          lift = g.book ? 3 : 0;
          item.layer = 'inside';
        } else if (item.insertUntil > time) {
          busy = true;
          target = approach(item, target, s);
          item.layer = 'drag';
          lift = 0.6;
        } else {
          item.insertUntil = 0;
          item.elevated = false;
          item.layer = 'inside';
          if (lead && active === 'open') {
            if (hover === index) {
              target = {
                ...target,
                y: target.y - 6 * g.scale,
                r: target.r * 0.2,
                ry: 0,
                s: target.s * 1.05,
              };
              lift = 1;
              magnet = true;
            } else {
              const distance = target.x - lead.x;
              target = {
                ...target,
                x:
                  target.x +
                  Math.sign(distance) *
                    12 *
                    g.scale *
                    Math.max(0, 1 - Math.abs(distance) / (g.w * 1.1)),
              };
              lift = 0.2;
            }
          } else if (active === 'open') {
            lift = 0.2;
          }
        }
      }
      busy = integrate(item.x, target.x, omega, damping, dt) || busy;
      busy = integrate(item.y, target.y, omega, damping, dt) || busy;
      if (!g.book && item.layer === 'inside') {
        const tilt = (item.r.value * Math.PI) / 180;
        const reach =
          ((g.docW * Math.abs(Math.sin(tilt)) +
            g.docH * Math.abs(Math.cos(tilt))) *
            item.s.value) /
          2;
        const floor = g.tabH + g.h - 2 * g.scale - reach;
        if (item.y.value > floor) {
          item.y.value = floor;
          if (item.y.velocity > 0) item.y.velocity *= -0.25;
        }
      }
      busy = integrate(item.z, target.z, itemOmega, zeta, dt) || busy;
      busy = integrate(item.r, target.r, omega, damping, dt) || busy;
      busy = integrate(item.ry, target.ry, itemOmega, zeta, dt) || busy;
      busy = integrate(item.s, target.s, itemOmega, zeta, dt) || busy;
      busy = integrate(item.hover, lift, itemOmega, zeta, dt) || busy;
      busy = integrate(item.alpha, fade, TAU * 3 * s.speed, 1, dt) || busy;
      busy =
        integrate(
          item.mx,
          magnet ? item.localX * 7 * g.scale : 0,
          soft,
          0.85,
          dt,
        ) || busy;
      busy =
        integrate(
          item.my,
          magnet ? item.localY * 7 * g.scale : 0,
          soft,
          0.85,
          dt,
        ) || busy;
    });

    write();
    if (busy || drag) state.raf = requestAnimationFrame(frame);
    else state.last = 0;
  };

  function wake() {
    if (!state.raf) state.raf = requestAnimationFrame(frame);
  }

  const beginIntro = () => {
    if (state.intro.phase !== 'wait') return;
    state.intro.phase = 'run';
    state.intro.start = performance.now() / 1000;
    wake();
  };

  const waitForIntro = () => {
    state.intro.phase = 'wait';
    root.style.opacity = '0';
  };

  const updateReceiving = () => {
    const drag = state.drag;
    const item = drag ? state.items[drag.index] : null;
    state.receiving = Boolean(
      drag?.active &&
      item &&
      (item.place === 'out' || item.elevated) &&
      overFolder(state.deskX, state.deskY),
    );
  };

  const startDrag = (drag: FolderDragState) => {
    const item = state.items[drag.index];
    if (!item) return;
    drag.active = true;
    drag.grabX = item.x.value - drag.downX;
    drag.grabY = item.y.value - drag.downY;
    drag.scale = item.place === 'out' ? item.outS : item.s.value;
    drag.clip = clipBounds();
    state.suppressClick = true;
    if (state.focus === drag.index) state.focus = -1;
    item.elevated = item.place === 'out' || !inPocket(item);
    root.dataset.dragging = '';
  };

  const drop = (drag: FolderDragState, cancelled: boolean) => {
    const s = settings();
    const item = state.items[drag.index];
    const entry = s.entries[drag.index];
    state.receiving = false;
    delete root.dataset.dragging;
    if (!item || entry === undefined) return;
    const time = performance.now() / 1000;
    const [vx = 0, vy = 0] = cancelled ? [0, 0] : velocityOf(drag.samples);
    if (overFolder(state.deskX, state.deskY)) {
      const entering = item.place === 'out' || item.elevated;
      item.place = 'inside';
      if (entering && !reduce()) {
        item.insertUntil = time + 0.24 / s.speed;
        item.insertFrom = s.g.book
          ? state.front.value < -90
            ? null
            : 'side'
          : 'top';
        if (!item.insertFrom) item.insertUntil = 0;
        state.receiveUntil = item.insertUntil
          ? item.insertUntil + 0.14 / s.speed
          : 0;
      }
      item.elevated = false;
      syncOutside();
      options.onItemDrop(entry, drag.index, true);
      return;
    }
    const clip = drag.clip ?? clipBounds();
    const halfW = (s.g.docW * drag.scale) / 2;
    const halfH = (s.g.docH * drag.scale) / 2;
    const x = state.deskX + drag.grabX + clamp(vx, -2400, 2400) * 0.09;
    const y = state.deskY + drag.grabY + clamp(vy, -2400, 2400) * 0.09;
    item.place = 'out';
    item.elevated = true;
    const margin = 8 * s.g.scale;
    const reachX = halfW * 1.08 + margin;
    const reachY = halfH * 1.08 + margin;
    item.outX = clamp(
      x,
      clip.left + reachX,
      Math.max(clip.left + reachX, clip.right - reachX),
    );
    item.outY = clamp(
      y,
      clip.top + reachY,
      Math.max(clip.top + reachY, clip.bottom - reachY),
    );
    item.outR = clamp(
      item.r.value * 0.5 +
        clamp(vx, -2400, 2400) * 0.003 +
        (DROP_TURN[drag.index % 6] ?? 0) * 0.6,
      -12,
      12,
    );
    item.outS = drag.scale;
    state.dropCount += 1;
    item.outOrder = state.dropCount;
    syncOutside();
    options.onItemDrop(entry, drag.index, false);
  };

  const onMove = (event: PointerEvent) => {
    const drag = state.drag;
    if (drag && event.pointerId === drag.id) {
      const [x, y] = toDesk(event.clientX, event.clientY);
      state.deskX = x;
      state.deskY = y;
      const now = performance.now();
      drag.samples.push([now, x, y]);
      while (
        drag.samples.length > 2 &&
        now - (drag.samples[0]?.[0] ?? now) > 100
      )
        drag.samples.shift();
      if (!drag.active) {
        const threshold = event.pointerType === 'touch' ? 8 : 4;
        if (
          Math.hypot(
            event.clientX - drag.clientX,
            event.clientY - drag.clientY,
          ) > threshold
        )
          startDrag(drag);
      }
      if (drag.active) updateReceiving();
      wake();
    }
    if (event.pointerType === 'touch') return;
    const box = root.getBoundingClientRect();
    state.pointerX = clamp(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      -1.5,
      1.5,
    );
    state.pointerY = clamp(
      ((event.clientY - box.top) / box.height) * 2 - 1,
      -1.5,
      1.5,
    );
    const target = itemAt(event, root);
    const index = target ? Number(target.getAttribute('data-folder-item')) : -1;
    state.hoveredItem = index;
    if (target && index >= 0 && !state.drag?.active) {
      const rect = target.getBoundingClientRect();
      const item = state.items[index];
      if (item) {
        item.localX = clamp(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -1,
          1,
        );
        item.localY = clamp(
          ((event.clientY - rect.top) / rect.height) * 2 - 1,
          -1,
          1,
        );
      }
    }
    if (!state.hovered) {
      state.hovered = true;
      if (settings().openOn === 'hover') options.setOpen(true);
    }
    wake();
  };

  const onLeave = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || state.drag?.active) return;
    state.hovered = false;
    state.pressed = false;
    state.hoveredItem = -1;
    if (settings().openOn === 'hover') options.setOpen(false);
    wake();
  };

  const onDown = (event: PointerEvent) => {
    if (event.button > 0) return;
    state.suppressClick = false;
    const target = itemAt(event, root);
    if (target && settings().draggable) {
      const [x, y] = toDesk(event.clientX, event.clientY);
      state.deskX = x;
      state.deskY = y;
      state.drag = {
        index: Number(target.getAttribute('data-folder-item')),
        id: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        downX: x,
        downY: y,
        grabX: 0,
        grabY: 0,
        scale: 1,
        clip: null,
        active: false,
        samples: [[performance.now(), x, y]],
      };
      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        state.drag.id = event.pointerId;
      }
    } else {
      state.pressed = true;
    }
    wake();
  };

  const onUp = (event: PointerEvent) => {
    state.pressed = false;
    const drag = state.drag;
    if (drag && event.pointerId === drag.id) {
      state.drag = null;
      if (drag.active) drop(drag, event.type === 'pointercancel');
    }
    wake();
  };

  const onDocumentDown = (event: PointerEvent) => {
    if (event.target instanceof Node && root.contains(event.target)) return;
    const s = settings();
    if (state.focus >= 0) {
      state.focus = -1;
      wake();
    }
    if (s.open && s.closeOnOutsideClick) options.setOpen(false);
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    if (state.focus >= 0) {
      state.focus = -1;
      wake();
      return;
    }
    const s = settings();
    if (s.open && s.closeOnOutsideClick) options.setOpen(false);
  };

  return {
    wake,
    invalidate,
    consumeClick: () => {
      if (!state.suppressClick) return false;
      state.suppressClick = false;
      return true;
    },
    interactive: (index) =>
      settings().open ||
      state.items[index]?.place === 'out' ||
      state.focus === index,
    select: (index) => {
      const s = settings();
      const entry = s.entries[index];
      if (s.zoomOnClick) state.focus = state.focus === index ? -1 : index;
      if (entry !== undefined) options.onItemClick(entry, index);
      wake();
    },
    blur: () => {
      if (state.focus < 0) return false;
      state.focus = -1;
      wake();
      return true;
    },
    waitForIntro,
    beginIntro,
    onMove,
    onLeave,
    onDown,
    onUp,
    onDocumentDown,
    onKey,
    dispose: () => {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    },
  };
};
