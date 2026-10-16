<script setup lang="ts" generic="T extends ShredderItem">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    useId,
    watch,
  } from 'vue';
  import {
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    ENTER,
    FOLLOW,
    HYSTERESIS,
    OVER,
    SETTLE,
    SLIT,
    STACK_C,
    STACK_K,
    STAGGER,
    TUG,
    TUG_DECAY,
    DEG,
    clamp,
    dataUrl,
    ease,
    flat,
    middle,
    paintStrip,
    pick,
    shape,
    side,
    smooth,
    snapshot,
    spring,
  } from './shredder-engine';
  import type { ComponentPublicInstance } from 'vue';
  import type {
    ShredderDrag,
    ShredderDragPhase,
    ShredderEmits,
    ShredderFeed,
    ShredderItem,
    ShredderKey,
    ShredderMetrics,
    ShredderPoint,
    ShredderProps,
    ShredderShift,
    ShredderSim,
    ShredderSlots,
    ShredderTexture,
  } from './types';

  const props = withDefaults(defineProps<ShredderProps<T>>(), {
    items: () => [],
    width: 340,
    height: 460,
    inset: 14,
    gap: 10,
    slitHeight: 4,
    fallHeight: 140,
    feedSpeed: 180,
    bite: 18,
    autoFeed: true,
    stripWidth: 10,
    curl: 1,
    autoAnimate: false,
    loop: false,
    loopAfterDelete: false,
    dragTilt: 6,
    lift: 1.02,
    slitColor: '#3f3f46',
    color: '#f5f5f5',
    disabled: false,
    class: '',
  });

  const emit = defineEmits<ShredderEmits<T>>();
  defineSlots<ShredderSlots<T>>();

  const hintId = useId();
  const motion = usePreferredReducedMotion();
  const reduced = (): boolean => motion.value === 'reduce';

  const order = ref<ShredderKey[]>(props.items.map((item) => item.id));
  const sorted = computed<T[]>(() => {
    const rank = new Map<ShredderKey, number>(
      order.value.map((id, i) => [id, i]),
    );
    const weight = (item: T): number =>
      rank.get(item.id) ?? order.value.length + props.items.indexOf(item);
    return [...props.items].sort((a, b) => weight(a) - weight(b));
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const slitRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const slotEls = new Map<ShredderKey, HTMLLIElement>();
  const itemEls = new Map<ShredderKey, HTMLDivElement>();
  const slotRefs = new Map<
    ShredderKey,
    (el: Element | ComponentPublicInstance | null) => void
  >();
  const itemRefs = new Map<
    ShredderKey,
    (el: Element | ComponentPublicInstance | null) => void
  >();

  function slotRef(key: ShredderKey) {
    let fn = slotRefs.get(key);
    if (!fn) {
      fn = (el) => {
        if (el instanceof HTMLLIElement) slotEls.set(key, el);
        else slotEls.delete(key);
      };
      slotRefs.set(key, fn);
    }
    return fn;
  }

  function itemRef(key: ShredderKey) {
    let fn = itemRefs.get(key);
    if (!fn) {
      fn = (el) => {
        if (el instanceof HTMLDivElement) itemEls.set(key, el);
        else itemEls.delete(key);
      };
      itemRefs.set(key, fn);
    }
    return fn;
  }

  const sim: ShredderSim<T> = {
    raf: 0,
    last: 0,
    t: 0,
    drag: null,
    feeds: [],
    strips: [],
    shifts: new Map(),
    tops: new Map(),
    timers: new Set(),
    dpr: 1,
    cw: 0,
    ch: 0,
  };

  // A commit re-renders the list; the layout pass waits for the patch.
  let pendingReflow = false;

  function measure(): ShredderMetrics | null {
    const root = rootRef.value;
    if (!root) return null;
    const r = root.getBoundingClientRect();
    const k = r.width / root.offsetWidth || 1;
    const lip = props.height - props.fallHeight - props.slitHeight;
    return {
      left: r.left,
      top: r.top,
      k,
      rw: root.offsetWidth,
      lip,
      exit: lip + props.slitHeight,
    };
  }

  function at(el: Element, m: ShredderMetrics): ShredderPoint {
    const r = el.getBoundingClientRect();
    return { x: (r.left - m.left) / m.k, y: (r.top - m.top) / m.k };
  }

  function local(e: PointerEvent, m: ShredderMetrics): ShredderPoint {
    return { x: (e.clientX - m.left) / m.k, y: (e.clientY - m.top) / m.k };
  }

  const { pause, resume } = useRafFn(({ timestamp }) => step(timestamp), {
    immediate: false,
  });

  function run(): void {
    if (sim.raf) return;
    sim.raf = 1;
    sim.last = performance.now();
    resume();
  }

  function stop(): void {
    sim.raf = 0;
    pause();
  }

  function later(ms: number, fn: () => void): void {
    const id = setTimeout(() => {
      sim.timers.delete(id);
      fn();
    }, ms);
    sim.timers.add(id);
  }

  const slotOf = (key: ShredderKey) => slotEls.get(key);
  function isLive(key: ShredderKey): boolean {
    const slot = slotOf(key);
    return !!slot && slot.dataset.gone === undefined;
  }
  const liveKeys = (): ShredderKey[] =>
    sorted.value.map((item) => item.id).filter(isLive);
  function goneKeys(): ShredderKey[] {
    return sorted.value
      .map((item) => item.id)
      .filter((key) => {
        const slot = slotOf(key);
        return !!slot && slot.dataset.gone !== undefined;
      });
  }

  function shiftOf(slot: HTMLLIElement): ShredderShift {
    let sh = sim.shifts.get(slot);
    if (!sh) {
      sh = { el: slot, y: 0, v: 0, target: 0, delay: 0, item: null };
      sim.shifts.set(slot, sh);
    }
    return sh;
  }

  function settle(
    origin: HTMLLIElement | null,
    entering: Set<HTMLLIElement> | null,
  ): void {
    const m = measure();
    if (!m) return;
    const next = new Map<HTMLLIElement, number>();
    const still = reduced();
    const active = sim.drag ? sim.drag.slot : null;
    const slots = sorted.value.map((item) => slotOf(item.id));
    const from = origin ? slots.indexOf(origin) : -1;
    let born = 0;
    sorted.value.forEach((item, idx) => {
      const slot = slots[idx];
      if (!slot) return;
      const sh = sim.shifts.get(slot);
      const top = at(slot, m).y - (sh ? sh.y : 0);
      const prev = sim.tops.get(slot);
      next.set(slot, top);
      if (slot === active || still) return;
      const fresh =
        (entering && entering.has(slot)) ||
        (prev === undefined && sim.tops.size > 0);
      if (fresh) {
        const rec = shiftOf(slot);
        const el = itemEls.get(item.id) || null;
        rec.y = -ENTER;
        rec.v = 0;
        rec.target = 0;
        rec.delay = born * 0.05;
        rec.item = el;
        born += 1;
        if (el) el.style.opacity = '0';
        slot.style.transform = `translateY(${rec.y}px)`;
        return;
      }
      if (prev === undefined) return;
      const delta = prev - top;
      if (Math.abs(delta) < 0.5) return;
      const rec = shiftOf(slot);
      rec.y += delta;
      if (from >= 0) rec.delay = Math.max(0, from - 1 - idx) * STAGGER;
      slot.style.transform = `translateY(${rec.y}px)`;
    });
    sim.tops = next;
    run();
  }

  function reflow(
    mutate: () => boolean,
    origin?: HTMLLIElement | null,
    entering?: Set<HTMLLIElement> | null,
  ): void {
    const changed = mutate();
    if (changed) {
      pendingReflow = true;
      void nextTick(() => {
        pendingReflow = false;
        settle(origin || null, entering || null);
      });
      return;
    }
    settle(origin || null, entering || null);
  }

  function arrange(key: ShredderKey, index: number): ShredderKey[] {
    const ids = sorted.value.map((item) => item.id).filter((id) => id !== key);
    const live = ids.filter(isLive);
    let anchor = 0;
    if (index < live.length) anchor = ids.indexOf(live[index]!);
    else if (live.length) anchor = ids.indexOf(live[live.length - 1]!) + 1;
    ids.splice(anchor, 0, key);
    return ids;
  }

  function commit(ids: ShredderKey[]): boolean {
    const same = ids.every((id, i) => id === sorted.value[i]?.id);
    if (same) return false;
    order.value = ids;
    return true;
  }

  function revive(keys: ShredderKey[], index?: number): void {
    if (sim.drag) {
      later(300, () => revive(keys, index));
      return;
    }
    const entering = new Set<HTMLLIElement>();
    reflow(
      () => {
        let changed = false;
        if (index !== undefined && keys.length === 1)
          changed = commit(arrange(keys[0]!, index));
        keys.forEach((key) => {
          const slot = slotOf(key);
          const el = itemEls.get(key);
          if (!slot || slot.dataset.gone === undefined) return;
          delete slot.dataset.gone;
          slot.style.height = '';
          slot.style.marginBottom = '';
          if (el) {
            el.style.visibility = '';
            el.style.transform = '';
            delete el.dataset.state;
          }
          entering.add(slot);
        });
        return changed;
      },
      null,
      entering,
    );
  }

  function afterShred(key: ShredderKey): void {
    if (props.loopAfterDelete) {
      later(700, () =>
        revive([key], Math.floor(Math.random() * (liveKeys().length + 1))),
      );
    } else if (props.loop && liveKeys().length === 0) {
      later(900, () => revive(goneKeys()));
    }
  }

  function collapse(f: ShredderFeed<T>): void {
    f.consumed = true;
    f.el.style.visibility = 'hidden';
    delete f.slot.dataset.active;
    sim.shifts.forEach((sh) => {
      sh.target = 0;
    });
    reflow(() => {
      f.slot.dataset.gone = '';
      f.slot.style.height = '0px';
      f.slot.style.marginBottom = '0px';
      return false;
    }, f.slot);
    emit('shred', f.item);
    afterShred(f.key);
  }

  function consumeNow(
    key: ShredderKey,
    item: T,
    el: HTMLDivElement,
    slot: HTMLLIElement,
  ): void {
    collapse({
      key,
      item,
      el,
      slot,
      W: 0,
      H: 0,
      rx: 0,
      ry: 0,
      tx: 0,
      tilt: 0,
      lift: 1,
      v: 0,
      age: 0,
      tex: null,
      ts: 1,
      consumed: false,
      strips: 0,
    });
    run();
  }

  function grab(d: ShredderDrag<T>, m: ShredderMetrics): void {
    sim.drag = null;
    sim.shifts.forEach((sh) => {
      sh.target = 0;
    });
    if (reduced()) {
      consumeNow(d.key, d.item, d.el, d.slot);
      return;
    }
    const over = d.ry + d.H - m.lip;
    const ry = over > props.bite * 1.5 ? m.lip + props.bite * 1.5 - d.H : d.ry;
    const lo = props.inset - SLIT;
    const hi = m.rw - props.inset + SLIT - d.W;
    const n = Math.max(1, Math.round(d.W / Math.max(4, props.stripWidth)));
    const sw = Math.floor(d.W / n);
    const f: ShredderFeed<T> = {
      key: d.key,
      item: d.item,
      el: d.el,
      slot: d.slot,
      W: d.W,
      H: d.H,
      rx: d.rx,
      ry,
      tx: clamp(d.rx, Math.min(lo, hi), Math.max(lo, hi)),
      tilt: d.tilt,
      lift: d.lift,
      v: props.feedSpeed * TUG,
      age: 0,
      tex: null,
      ts: 1,
      consumed: false,
      strips: n,
    };
    let settled = false;
    const use = ({ tex, scale }: ShredderTexture) => {
      if (settled) return;
      settled = true;
      f.tex = tex;
      f.ts = scale;
      run();
    };
    d.snap.then(use, () => use(flat(d.W, d.H, d.fill)));
    later(400, () => use(flat(d.W, d.H, d.fill)));
    d.el.dataset.state = 'feed';
    sim.feeds.push(f);
    for (let i = 0; i < n; i += 1) {
      sim.strips.push({
        feed: f,
        x: i * sw,
        w: i === n - 1 ? d.W - sw * (n - 1) : sw,
        H: d.H,
        phase: 'attached',
        curl: side() * pick(0.35, 0.9) * DEG * props.curl,
        amp: pick(1.5, 4) * DEG * props.curl,
        freq: (Math.PI * 2) / pick(34, 60),
        wave: pick(0, Math.PI * 2),
        rA: Math.random(),
        rB: Math.random(),
        speed: 0,
        splay: 0,
        core: 1,
        rest: 0,
        alpha: 1,
        th: 0,
        ax: 0,
        ay: 0,
        vx: 0,
        vy: 0,
        hang: 0,
        pts: [],
      });
    }
  }

  function place(d: ShredderDrag<T>, sp: ShredderPoint): void {
    d.el.style.transform = `translate(${d.rx - sp.x}px, ${d.ry - sp.y}px) rotate(${d.tilt}deg) scale(${d.lift})`;
  }

  function aim(d: ShredderDrag<T>, m: ShredderMetrics): void {
    const rows: { slot: HTMLLIElement; mid: number }[] = [];
    sorted.value.forEach((item) => {
      if (item.id === d.key) return;
      const slot = slotOf(item.id);
      if (!slot || slot.dataset.gone !== undefined) return;
      const top = sim.tops.get(slot);
      if (top === undefined) return;
      rows.push({ slot, mid: top + slot.offsetHeight / 2 });
    });
    let j = -1;
    if (d.moved && d.ry + d.H < m.lip - 8) {
      const cy = d.ry + d.H / 2;
      let n = 0;
      rows.forEach((row) => {
        if (row.mid < cy) n += 1;
      });
      if (d.j >= 0 && n !== d.j) {
        const edge = rows[n > d.j ? n - 1 : n];
        if (edge && Math.abs(edge.mid - cy) < HYSTERESIS) n = d.j;
      }
      j = n;
    }
    if (j === d.j) return;
    d.j = j;
    rows.forEach((row, k) => {
      shiftOf(row.slot).target = j >= 0 && k < j ? -(d.H + props.gap) : 0;
    });
  }

  function drop(d: ShredderDrag<T>): void {
    const live = liveKeys().filter((key) => key !== d.key);
    const index = clamp(d.j >= 0 ? d.j : d.from, 0, live.length);
    sim.shifts.forEach((sh) => {
      sh.target = 0;
    });
    let changed = false;
    reflow(() => {
      changed = commit(arrange(d.key, index));
      d.slot.style.height = `${d.H}px`;
      d.slot.style.marginBottom = '';
      return changed;
    });
    d.phase = 'return';
    if (changed) emit('reorder', sorted.value);
  }

  function tickDrag(dt: number, m: ShredderMetrics): void {
    const d = sim.drag;
    if (!d) return;
    if (!d.el.isConnected) {
      sim.drag = null;
      return;
    }
    const sp = at(d.slot, m);
    const ceiling = m.lip + props.bite - d.H;
    if (d.phase === 'drag') {
      d.tx = d.px - d.gx;
      d.ty = Math.min(d.py - d.gy, ceiling);
      if (!d.moved && Math.hypot(d.px - d.ox, d.py - d.oy) > 6) d.moved = true;
      aim(d, m);
    } else if (d.phase === 'carry') {
      d.tx = (m.rw - d.W) / 2;
      d.ty = ceiling;
    } else {
      d.tx = sp.x;
      d.ty = sp.y;
    }
    const omega = d.phase === 'drag' ? FOLLOW : SETTLE;
    [d.rx, d.vx] = spring(d.rx, d.vx, d.tx, dt, omega);
    [d.ry, d.vy] = spring(d.ry, d.vy, d.ty, dt, omega);
    const lean =
      d.phase === 'drag'
        ? clamp(d.vx * 0.012, -props.dragTilt, props.dragTilt)
        : 0;
    d.tilt = ease(d.tilt, lean, dt, 0.09);
    d.lift = ease(d.lift, d.phase === 'return' ? 1 : props.lift, dt, 0.12);
    const over = d.ry + d.H - m.lip;
    const bites = d.phase === 'carry' || (d.phase === 'drag' && props.autoFeed);
    if (bites && over >= props.bite - 0.5) {
      grab(d, m);
      return;
    }
    place(d, sp);
    const still =
      Math.abs(d.rx - d.tx) < 0.2 &&
      Math.abs(d.ry - d.ty) < 0.2 &&
      Math.abs(d.vy) < 2 &&
      Math.abs(d.vx) < 2;
    if (
      d.phase === 'return' &&
      still &&
      Math.abs(d.lift - 1) < 0.002 &&
      Math.abs(d.tilt) < 0.05
    ) {
      d.el.style.transform = '';
      delete d.el.dataset.state;
      delete d.slot.dataset.active;
      d.slot.style.height = '';
      sim.drag = null;
    }
  }

  function tickFeeds(dt: number, m: ShredderMetrics): boolean {
    let pulling = false;
    for (let i = sim.feeds.length - 1; i >= 0; i -= 1) {
      const f = sim.feeds[i]!;
      if (!f.consumed) {
        if (!f.el.isConnected) {
          sim.feeds.splice(i, 1);
          continue;
        }
        pulling = true;
        const sp = at(f.slot, m);
        if (f.tex) {
          f.age += dt;
          f.v =
            props.feedSpeed * (1 + (TUG - 1) * Math.exp(-f.age / TUG_DECAY));
          f.ry += f.v * dt;
        }
        f.rx = ease(f.rx, f.tx, dt, 0.1);
        f.tilt = ease(f.tilt, 0, dt, 0.08);
        f.lift = ease(f.lift, 1, dt, 0.1);
        if (f.ry >= m.lip) {
          collapse(f);
        } else {
          const jitter = Math.sin(sim.t * 150) * 0.5;
          f.el.style.transform = `translate(${f.rx - sp.x + jitter}px, ${f.ry - sp.y}px) rotate(${f.tilt}deg) scale(${f.lift})`;
        }
      } else {
        f.ry += f.v * dt;
        if (f.strips === 0) sim.feeds.splice(i, 1);
      }
    }
    return pulling;
  }

  function tickShifts(dt: number): boolean {
    let moving = false;
    sim.shifts.forEach((sh, el) => {
      if (!el.isConnected) {
        sim.shifts.delete(el);
        return;
      }
      if (sh.delay > 0) {
        sh.delay -= dt;
        moving = true;
        return;
      }
      if (sh.item) {
        const item = sh.item;
        item.style.transition = 'opacity 280ms ease';
        item.style.opacity = '';
        later(320, () => {
          item.style.transition = '';
        });
        sh.item = null;
      }
      const n = Math.ceil(dt * 240);
      const h = dt / n;
      for (let k = 0; k < n; k += 1) {
        sh.v += (-STACK_K * (sh.y - sh.target) - STACK_C * sh.v) * h;
        sh.y += sh.v * h;
      }
      if (Math.abs(sh.y - sh.target) < 0.15 && Math.abs(sh.v) < 4) {
        sh.y = sh.target;
        sh.v = 0;
        if (sh.target === 0) {
          el.style.transform = '';
          sim.shifts.delete(el);
        } else {
          el.style.transform = `translateY(${sh.y}px)`;
        }
      } else {
        el.style.transform = `translateY(${sh.y}px)`;
        moving = true;
      }
    });
    return moving;
  }

  function tickStrips(
    dt: number,
    m: ShredderMetrics,
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ): boolean {
    let moving = false;
    const dpr = sim.dpr;
    if (sim.strips.length) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    for (let i = sim.strips.length - 1; i >= 0; i -= 1) {
      const st = sim.strips[i]!;
      const f = st.feed;
      let len = st.H;
      if (st.phase === 'attached') {
        const top = f.ry - m.exit;
        st.hang = top + st.H;
        if (st.hang <= 0) {
          moving = true;
          continue;
        }
        st.ax = f.rx + st.x + st.w / 2;
        st.th = Math.sin(sim.t * 6 + st.wave) * 0.03 * smooth(st.hang / 40);
        if (top >= 0) {
          st.phase = 'free';
          st.ay = top;
          st.vy = f.v;
          st.vx = pick(-20, 20);
          st.speed = 150 + st.rA * 230;
          st.splay = (st.rA - 0.5) * 320;
          st.rest = side() * pick(0.15, 0.6);
          f.strips -= 1;
        } else {
          st.ay = 0;
          len = st.hang;
        }
      }
      if (st.phase === 'free') {
        const tear = Math.pow(
          clamp(middle(st.pts) / props.fallHeight, 0, 1),
          1.2,
        );
        const breath =
          0.85 + 0.15 * Math.sin(sim.t * (1 + st.rB * 2) + st.rA * 6.2832);
        st.vy = ease(st.vy, st.speed * breath, dt, 0.25);
        st.vx = ease(
          st.vx,
          st.splay * tear + (st.ax - m.rw / 2) * 0.25,
          dt,
          0.4,
        );
        st.ax += st.vx * dt;
        st.ay += st.vy * dt;
        st.th = ease(st.th, st.rest, dt, 0.5);
        st.core = 1 - smooth(tear / 0.85) * (0.8 - st.rA * 0.16);
        shape(st, st.H, sim.t, tear);
        st.alpha = 1 - smooth((tear - 0.6) / 0.4);
        if (st.alpha <= 0.01 || (st.pts[1] ?? 0) > props.fallHeight) {
          sim.strips.splice(i, 1);
          continue;
        }
      } else {
        st.core = 1;
        shape(st, len, sim.t, 0);
        st.alpha = 1;
      }
      paintStrip(ctx, st, len, dpr);
      moving = true;
    }
    return moving;
  }

  function tick(now: number): void {
    const canvas = canvasRef.value;
    const ctx = canvas?.getContext('2d');
    const m = measure();
    if (!canvas || !ctx || !m) {
      stop();
      return;
    }
    const dt = clamp((now - sim.last) / 1000, 0, 0.05);
    sim.last = now;
    sim.t += dt;
    tickDrag(dt, m);
    const pulling = tickFeeds(dt, m);
    const shifting = tickShifts(dt);
    const falling = tickStrips(dt, m, ctx, canvas);
    const slit = slitRef.value;
    if (slit) {
      slit.style.transform = pulling
        ? `translate(${Math.sin(sim.t * 140) * 0.5}px, ${Math.cos(sim.t * 97) * 0.35}px)`
        : '';
    }
    if (!(sim.drag || sim.feeds.length || shifting || falling)) stop();
  }

  function step(now: number): void {
    try {
      tick(now);
    } catch (err) {
      stop();
      throw err;
    }
  }

  function begin(
    item: T,
    phase: ShredderDragPhase,
    e: PointerEvent | null,
  ): void {
    const key = item.id;
    const el = itemEls.get(key);
    const slot = slotOf(key);
    if (
      props.disabled ||
      sim.drag ||
      !el ||
      !slot ||
      slot.dataset.gone !== undefined
    )
      return;
    if (sim.feeds.some((f) => f.key === key)) return;
    const m = measure();
    if (!m) return;
    const sp = at(slot, m);
    const W = slot.offsetWidth;
    const H = slot.offsetHeight;
    const p = e ? local(e, m) : { x: sp.x, y: sp.y };
    const first = el.firstElementChild;
    const face = first instanceof HTMLElement ? first : el;
    const fill = getComputedStyle(face).backgroundColor;
    const snap = snapshot(el, W, H);
    snap.catch(() => {});
    const d: ShredderDrag<T> = {
      key,
      item,
      el,
      slot,
      W,
      H,
      rx: sp.x,
      ry: sp.y,
      tx: sp.x,
      ty: sp.y,
      vx: 0,
      vy: 0,
      tilt: 0,
      lift: 1,
      gx: p.x - sp.x,
      gy: p.y - sp.y,
      px: p.x,
      py: p.y,
      ox: p.x,
      oy: p.y,
      moved: false,
      from: liveKeys().indexOf(key),
      j: -1,
      phase,
      id: e ? e.pointerId : null,
      snap,
      fill:
        fill === 'rgba(0, 0, 0, 0)' || fill === 'transparent'
          ? 'rgba(127, 127, 127, 0.35)'
          : fill,
    };
    sim.drag = d;
    sim.shifts.delete(slot);
    slot.style.transform = '';
    reflow(() => {
      slot.dataset.active = '';
      el.dataset.state = 'drag';
      slot.style.height = '0px';
      slot.style.marginBottom = '0px';
      return false;
    }, slot);
    place(d, at(slot, m));
    run();
  }

  function onDown(e: PointerEvent, item: T): void {
    if (e.button !== 0) return;
    const target = e.currentTarget;
    if (target instanceof HTMLElement) {
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // pointer may already be released
      }
    }
    begin(item, 'drag', e);
  }

  function onMove(e: PointerEvent): void {
    const d = sim.drag;
    if (!d || d.id !== e.pointerId) return;
    const m = measure();
    if (!m) return;
    const p = local(e, m);
    d.px = p.x;
    d.py = p.y;
  }

  function onUp(e: PointerEvent): void {
    const d = sim.drag;
    if (!d || d.id !== e.pointerId) return;
    d.id = null;
    const target = e.currentTarget;
    if (target instanceof HTMLElement) {
      try {
        if (target.hasPointerCapture(e.pointerId))
          target.releasePointerCapture(e.pointerId);
      } catch {
        // capture already gone
      }
    }
    const m = measure();
    if (!m) return;
    if (d.ry + d.H > m.lip + 0.5) grab(d, m);
    else drop(d);
    run();
  }

  function onKey(e: KeyboardEvent, item: T): void {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    e.preventDefault();
    if (e.repeat) return;
    const key = item.id;
    if (reduced()) {
      const el = itemEls.get(key);
      const slot = slotOf(key);
      if (
        props.disabled ||
        !el ||
        !slot ||
        slot.dataset.gone !== undefined ||
        sim.feeds.some((f) => f.key === key)
      )
        return;
      consumeNow(key, item, el, slot);
      return;
    }
    begin(item, 'carry', null);
  }

  function fit(): void {
    const root = rootRef.value;
    const canvas = canvasRef.value;
    if (!root || !canvas) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const cw = root.offsetWidth + OVER * 2;
    const ch = props.fallHeight;
    if (cw === sim.cw && ch === sim.ch && dpr === sim.dpr) return;
    if (sim.cw) sim.tops = new Map();
    sim.cw = cw;
    sim.ch = ch;
    sim.dpr = dpr;
    canvas.width = Math.ceil(cw * dpr);
    canvas.height = Math.ceil(ch * dpr);
  }

  useResizeObserver(rootRef, fit);
  watch(() => props.fallHeight, fit);

  let preloadTimer: ReturnType<typeof setTimeout> | undefined;
  function preload(): void {
    clearTimeout(preloadTimer);
    preloadTimer = setTimeout(() => {
      itemEls.forEach((el) => {
        el.querySelectorAll('img').forEach((img) => {
          dataUrl(img.currentSrc || img.src).catch(() => {});
        });
      });
    }, 300);
  }
  watch(() => props.items, preload);

  function idle(): boolean {
    return (
      !sim.drag &&
      sim.feeds.length === 0 &&
      sim.strips.length === 0 &&
      sim.shifts.size === 0
    );
  }

  function nextLive(): T | null {
    const list = sorted.value;
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const item = list[i]!;
      if (isLive(item.id)) return item;
    }
    return null;
  }

  function autoPlay(onCleanup: (fn: () => void) => void): void {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });
    const play = async () => {
      await wait(900);
      while (alive) {
        while (alive && !idle()) await wait(120);
        if (!alive) break;
        const item = nextLive();
        if (!item) {
          await wait(1100);
          if (!alive) break;
          revive(goneKeys());
          await wait(1200);
          continue;
        }
        if (!props.disabled) begin(item, 'carry', null);
        await wait(700);
      }
    };
    void play();
    onCleanup(() => {
      alive = false;
      clearTimeout(timer);
    });
  }

  onUpdated(() => {
    if (!pendingReflow) settle(null, null);
  });

  onMounted(() => {
    settle(null, null);
    fit();
    preload();
    watch(
      () => props.autoAnimate,
      (on, _prev, onCleanup) => {
        if (on) autoPlay(onCleanup);
      },
      { immediate: true },
    );
  });

  onBeforeUnmount(() => {
    stop();
    clearTimeout(preloadTimer);
    sim.timers.forEach((id) => clearTimeout(id));
    sim.timers.clear();
  });

  const rootStyle = computed(() => ({
    '--sh-w': `${props.width}px`,
    '--sh-h': `${props.height}px`,
    '--sh-inset': `${props.inset}px`,
    '--sh-gap': `${props.gap}px`,
    '--sh-slit-h': `${props.slitHeight}px`,
    '--sh-fall': `${props.fallHeight}px`,
    '--sh-slit-inset': `${Math.max(0, props.inset - SLIT)}px`,
    '--sh-over': `${OVER}px`,
    '--sh-slit': props.slitColor,
    '--sh-ink': props.color,
  }));
</script>

<template>
  <div
    ref="rootRef"
    :class="['shredder', props.class]"
    :data-disabled="disabled ? '' : undefined"
    :style="rootStyle"
  >
    <span :id="hintId" class="sr-only">
      Drag a row into the slit, or press Delete, to shred it. Drag a row up or
      down to reorder.
    </span>
    <ul class="shredder__list">
      <li
        v-for="(item, index) in sorted"
        :key="item.id"
        :ref="slotRef(item.id)"
        class="shredder__slot"
      >
        <div
          :ref="itemRef(item.id)"
          class="shredder__item"
          :tabindex="disabled ? -1 : 0"
          :aria-disabled="disabled || undefined"
          :aria-describedby="hintId"
          @pointerdown="onDown($event, item)"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
          @lostpointercapture="onUp"
          @keydown="onKey($event, item)"
          @dragstart.prevent
        >
          <slot :item="item" :index="index" />
        </div>
      </li>
    </ul>
    <div ref="slitRef" class="shredder__slit" aria-hidden="true" />
    <div class="shredder__fall" aria-hidden="true">
      <canvas ref="canvasRef" class="shredder__canvas" />
    </div>
  </div>
</template>

<style scoped>
  .shredder {
    position: relative;
    width: min(var(--sh-w), 100%);
    height: var(--sh-h);
    color: var(--sh-ink);
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
  }

  .shredder[data-disabled] {
    opacity: 0.6;
  }

  .shredder__list {
    position: absolute;
    right: 0;
    bottom: calc(var(--sh-fall) + var(--sh-slit-h));
    left: 0;
    z-index: 1;
    margin: 0;
    padding: 0 var(--sh-inset);
    list-style: none;
    clip-path: inset(-9999px -9999px 0 -9999px);
  }

  .shredder__slot {
    position: relative;
    margin-bottom: var(--sh-gap);
  }

  .shredder__slot[data-active] {
    z-index: 2;
  }

  .shredder__slot[data-gone] {
    pointer-events: none;
  }

  .shredder__item {
    position: relative;
    outline: none;
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    transform-origin: 50% 50%;
  }

  .shredder__item:focus-visible {
    outline: 2px solid color-mix(in oklab, currentColor 70%, transparent);
    outline-offset: 2px;
    border-radius: 12px;
  }

  .shredder__slot[data-active] .shredder__item {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    will-change: transform, filter;
    filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
    transition: filter 240ms ease;
  }

  .shredder__item[data-state='drag'] {
    cursor: grabbing;
    filter: drop-shadow(0 14px 22px rgba(0, 0, 0, 0.22));
  }

  .shredder__item[data-state='feed'] {
    cursor: default;
    pointer-events: none;
  }

  .shredder[data-disabled] .shredder__item {
    cursor: default;
  }

  .shredder__slit {
    position: absolute;
    right: var(--sh-slit-inset);
    bottom: var(--sh-fall);
    left: var(--sh-slit-inset);
    z-index: 3;
    height: var(--sh-slit-h);
    border-radius: 999px;
    background: var(--sh-slit);
    will-change: transform;
  }

  .shredder__fall {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    height: var(--sh-fall);
    pointer-events: none;
  }

  .shredder__canvas {
    display: block;
    position: absolute;
    top: 0;
    left: calc(-1 * var(--sh-over));
    width: calc(100% + var(--sh-over) * 2);
    height: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    .shredder__slot[data-active] .shredder__item {
      transition: none;
    }
  }
</style>
