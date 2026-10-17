<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    onWatcherCleanup,
    ref,
    watch,
  } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import Matter from 'matter-js';
  import type { ComponentPublicInstance } from 'vue';
  import type {
    FolderFloatEntry,
    FolderFloatProps,
    FolderFloatSize,
    FolderFloatWorld,
  } from './types';
  import { jitter, layout } from './folder-float-layout';

  const { Bodies, Body, Composite, Engine } = Matter;

  const DRAG_MIN = 4;
  const ZONE_PAD = 8;
  const WALL = 80;

  const props = withDefaults(defineProps<FolderFloatProps>(), {
    items: () => [
      'Try a warmer palette',
      'Tighten the spacing',
      'Logo feels small',
      'Love the new hero',
    ],
    label: 'Design feedback',
    sublabel: '',
    trigger: 'hover',
    defaultOpen: false,
    closeOnSelect: true,
    physics: true,
    drift: 0.5,
    folderColor: '#3f3f46',
    frontColor: '#52525b',
    paperColor: '#f5f5f5',
    itemColor: '#f5f5f5',
    itemTextColor: '#18181b',
    labelColor: '#f5f5f5',
    width: 200,
    height: 148,
    radius: 14,
    spread: 180,
    lift: 26,
    tilt: 8,
    flapAngle: 34,
    restAngle: 16,
    openDuration: 520,
    stagger: 45,
    bounce: 0.3,
    class: '',
  });

  const emit = defineEmits<{
    select: [value: string, index: number];
    'update:open': [open: boolean];
  }>();

  const open = ref(props.defaultOpen);
  const popped = ref(-1);
  const live = ref(false);
  const sizes = ref<FolderFloatSize[]>([]);
  const anchor = ref<HTMLElement | null>(null);
  const pills: Array<HTMLButtonElement | null> = [];
  const motionPref = usePreferredReducedMotion();
  const reduce = computed(() => motionPref.value === 'reduce');

  const world: FolderFloatWorld = {
    engine: null,
    bodies: [],
    phases: [],
    sizes: [],
    raf: 0,
    last: 0,
    t0: 0,
    drag: null,
    zone: null,
  };
  let popTimer: ReturnType<typeof setTimeout> | undefined;
  let liveTimer: ReturnType<typeof setTimeout> | undefined;

  const list = computed<FolderFloatEntry[]>(() =>
    props.items.map((item) =>
      typeof item === 'string' ? { label: item, value: item } : item,
    ),
  );
  const n = computed(() => list.value.length);
  const sub = computed(
    () => props.sublabel || `${n.value} ${n.value === 1 ? 'note' : 'notes'}`,
  );
  const pos = computed(() =>
    layout(list.value, props.spread, props.lift, props.tilt, sizes.value),
  );
  const labelsKey = computed(() =>
    list.value.map((item) => item.label).join('|'),
  );

  function setPill(i: number, el: Element | ComponentPublicInstance | null) {
    pills[i] = el instanceof HTMLButtonElement ? el : null;
  }

  function pillRef(i: number) {
    return (el: Element | ComponentPublicInstance | null) => setPill(i, el);
  }

  function writeRest() {
    if (world.engine) return;
    pos.value.forEach((p, i) => {
      const el = pills[i];
      if (!el) return;
      el.style.setProperty('--x', `${p.x.toFixed(1)}px`);
      el.style.setProperty('--y', `${p.y.toFixed(1)}px`);
    });
  }

  function measure() {
    const next: FolderFloatSize[] = [];
    for (let i = 0; i < n.value; i += 1) {
      const el = pills[i];
      if (!el) return;
      next.push({ w: el.offsetWidth, h: el.offsetHeight });
    }
    const prev = sizes.value;
    const same =
      prev.length === next.length &&
      prev.every((s, i) => s.w === next[i]?.w && s.h === next[i]?.h);
    if (!same) sizes.value = next;
  }

  watch(pos, writeRest, { flush: 'post' });
  watch([n, labelsKey], () => nextTick(measure), { flush: 'post' });

  onMounted(() => {
    measure();
    writeRest();
    void document.fonts?.ready.then(measure);
  });

  function stopPhysics() {
    clearTimeout(liveTimer);
    cancelAnimationFrame(world.raf);
    world.raf = 0;
    if (world.engine) {
      world.bodies.forEach((b, i) => {
        const el = pills[i];
        const size = world.sizes[i];
        if (!el || !size) return;
        el.style.setProperty('--x', `${b.position.x.toFixed(1)}px`);
        el.style.setProperty(
          '--y',
          `${(b.position.y - size.h / 2).toFixed(1)}px`,
        );
      });
      Composite.clear(world.engine.world, false, true);
      Engine.clear(world.engine);
      world.engine = null;
    }
    world.bodies = [];
    world.drag = null;
    live.value = false;
  }

  function tick(now: number) {
    const engine = world.engine;
    if (!engine) return;
    const dt = world.last ? Math.min(1000 / 60, now - world.last) : 16;
    world.last = now;
    const t = (now - world.t0) / 1000;
    const k = props.drift * 0.00005 * Math.min(1, t / 2);
    world.bodies.forEach((b, i) => {
      if (world.drag && world.drag.i === i) return;
      const ph = world.phases[i] ?? 0;
      Body.applyForce(b, b.position, {
        x: Math.sin(t * 0.9 + ph) * k * b.mass,
        y: Math.cos(t * 1.3 + ph * 1.7) * k * b.mass,
      });
    });
    Engine.update(engine, dt);
    world.bodies.forEach((b, i) => {
      const el = pills[i];
      const size = world.sizes[i];
      if (!el || !size) return;
      el.style.setProperty('--x', `${b.position.x.toFixed(1)}px`);
      el.style.setProperty(
        '--y',
        `${(b.position.y - size.h / 2).toFixed(1)}px`,
      );
    });
    world.raf = requestAnimationFrame(tick);
  }

  function startPhysics() {
    if (world.engine) return;
    const els = pills.slice(0, n.value);
    if (els.length < n.value || els.some((el) => !el)) return;
    const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0.001 } });
    engine.enableSleeping = false;
    world.engine = engine;
    world.sizes = els.map((el) => ({
      w: el?.offsetWidth ?? 0,
      h: el?.offsetHeight ?? 0,
    }));
    const rest = pos.value;
    const ys = rest.map((p) => p.y);
    const zone = {
      left: -props.spread - ZONE_PAD,
      right: props.spread + ZONE_PAD,
      top: Math.min(...ys) - ZONE_PAD,
      bottom: -props.lift + Math.max(...world.sizes.map((s) => s.h)),
    };
    world.zone = zone;
    world.phases = rest.map((_, i) => jitter(i) * Math.PI * 2);
    world.bodies = world.sizes.map((s, i) =>
      Bodies.rectangle(rest[i]?.x ?? 0, (rest[i]?.y ?? 0) + s.h / 2, s.w, s.h, {
        chamfer: { radius: Math.min(s.h / 2 - 1, 16) },
        restitution: 0.55,
        friction: 0,
        frictionAir: 0.08,
        inertia: Infinity,
      }),
    );
    const cx = (zone.left + zone.right) / 2;
    const cy = (zone.top + zone.bottom) / 2;
    const zw = zone.right - zone.left + 2 * WALL;
    const zh = zone.bottom - zone.top + 2 * WALL;
    const walls = [
      Bodies.rectangle(cx, zone.top - WALL / 2, zw, WALL, { isStatic: true }),
      Bodies.rectangle(cx, zone.bottom + WALL / 2, zw, WALL, {
        isStatic: true,
      }),
      Bodies.rectangle(zone.left - WALL / 2, cy, WALL, zh, { isStatic: true }),
      Bodies.rectangle(zone.right + WALL / 2, cy, WALL, zh, { isStatic: true }),
    ];
    Composite.add(engine.world, [...world.bodies, ...walls]);
    world.last = 0;
    world.t0 = performance.now();
    live.value = true;
    world.raf = requestAnimationFrame(tick);
  }

  function set(next: boolean) {
    if (!next) stopPhysics();
    if (open.value === next) return;
    open.value = next;
    emit('update:open', next);
  }

  watch(
    [
      open,
      () => props.physics,
      () => props.openDuration,
      () => props.stagger,
      n,
      reduce,
    ],
    () => {
      clearTimeout(liveTimer);
      if (!open.value || !props.physics || reduce.value) {
        stopPhysics();
        writeRest();
        return;
      }
      liveTimer = setTimeout(
        startPhysics,
        props.openDuration + (n.value - 1) * props.stagger + 80,
      );
      onWatcherCleanup(() => clearTimeout(liveTimer));
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    clearTimeout(popTimer);
    stopPhysics();
  });

  function pick(item: FolderFloatEntry, i: number) {
    emit('select', item.value, i);
    clearTimeout(popTimer);
    popped.value = i;
    popTimer = setTimeout(() => (popped.value = -1), 320);
    if (props.closeOnSelect) set(false);
  }

  function pointerAt(e: PointerEvent) {
    const r = anchor.value?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 };
  }

  function indexOf(e: Event): number {
    const el = e.currentTarget;
    return el instanceof HTMLElement ? Number(el.dataset.index) : -1;
  }

  function onItemDown(e: PointerEvent) {
    const i = indexOf(e);
    if (!world.engine || e.button !== 0) return;
    const b = world.bodies[i];
    if (!b) return;
    const p = pointerAt(e);
    world.drag = {
      i,
      id: e.pointerId,
      dx: b.position.x - p.x,
      dy: b.position.y - p.y,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
    };
    try {
      pills[i]?.setPointerCapture(e.pointerId);
    } catch {
      // capture is best effort
    }
  }

  function onItemMove(e: PointerEvent) {
    const i = indexOf(e);
    const d = world.drag;
    if (!d || d.i !== i || d.id !== e.pointerId) return;
    const el = pills[i];
    if (
      !d.moved &&
      Math.hypot(e.clientX - d.sx, e.clientY - d.sy) >= DRAG_MIN
    ) {
      d.moved = true;
      el?.setAttribute('data-drag', '');
    }
    if (!d.moved) return;
    const b = world.bodies[i];
    const size = world.sizes[i];
    const z = world.zone;
    if (!b || !size || !z) return;
    const p = pointerAt(e);
    const x = Math.min(
      z.right - size.w / 2,
      Math.max(z.left + size.w / 2, p.x + d.dx),
    );
    const y = Math.min(
      z.bottom - size.h / 2,
      Math.max(z.top + size.h / 2, p.y + d.dy),
    );
    Body.setVelocity(b, {
      x: (x - b.position.x) * 0.6,
      y: (y - b.position.y) * 0.6,
    });
    Body.setPosition(b, { x, y });
  }

  function onItemUp(e: PointerEvent) {
    const i = indexOf(e);
    const d = world.drag;
    if (!d || d.i !== i || d.id !== e.pointerId) return;
    world.drag = null;
    const el = pills[i];
    el?.removeAttribute('data-drag');
    try {
      el?.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
    const item = list.value[i];
    if (!d.moved && e.type === 'pointerup' && item) pick(item, i);
  }

  function onItemClick(e: MouseEvent) {
    const i = indexOf(e);
    const item = list.value[i];
    if (item && (!live.value || e.detail === 0)) pick(item, i);
  }

  function onEnter() {
    if (props.trigger === 'hover') set(true);
  }

  function onLeave() {
    if (props.trigger === 'hover' && !world.drag) set(false);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open.value) {
      e.stopPropagation();
      set(false);
    }
  }

  function onToggle() {
    set(!open.value);
  }

  const rootStyle = computed<Record<string, string>>(() => ({
    '--ff-w': `${props.width}px`,
    '--ff-h': `${props.height}px`,
    '--ff-r': `${props.radius}px`,
    '--ff-back': props.folderColor,
    '--ff-front': props.frontColor,
    '--ff-paper': props.paperColor,
    '--ff-item': props.itemColor,
    '--ff-item-ink': props.itemTextColor,
    '--ff-label': props.labelColor,
    '--ff-spread': `${props.spread}px`,
    '--ff-lift': `${props.lift}px`,
    '--ff-angle': `${props.flapAngle}deg`,
    '--ff-rest': `${props.restAngle}deg`,
    '--ff-open': `${props.openDuration}ms`,
    '--ff-close': `${Math.round(props.openDuration * 0.6)}ms`,
    '--ff-stagger': `${props.stagger}ms`,
    '--ff-n': String(n.value),
    '--ff-spring': `cubic-bezier(0.34, ${(1 + props.bounce * 1.9).toFixed(2)}, 0.64, 1)`,
  }));

  function itemStyle(i: number): Record<string, string> {
    return {
      '--i': String(i),
      '--r': `${(pos.value[i]?.r ?? 0).toFixed(2)}deg`,
    };
  }
</script>

<template>
  <div
    :class="['folder-float', props.class]"
    :data-open="open ? '' : undefined"
    :data-live="live ? '' : undefined"
    :data-physics="physics ? '' : undefined"
    :data-trigger="trigger"
    :style="rootStyle"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @keydown="onKeyDown"
  >
    <div ref="anchor" class="folder-float__items">
      <button
        v-for="(item, i) in list"
        :key="`${item.value}-${i}`"
        :ref="pillRef(i)"
        type="button"
        class="folder-float__item"
        :data-index="i"
        :tabindex="open ? 0 : -1"
        :aria-hidden="!open"
        :data-pop="popped === i ? '' : undefined"
        :style="itemStyle(i)"
        @pointerdown="onItemDown"
        @pointermove="onItemMove"
        @pointerup="onItemUp"
        @pointercancel="onItemUp"
        @click="onItemClick"
      >
        <span class="folder-float__drift">{{ item.label }}</span>
      </button>
    </div>
    <div class="folder-float__folder">
      <span class="folder-float__back" aria-hidden="true" />
      <span class="folder-float__paper" aria-hidden="true" />
      <span class="folder-float__front" aria-hidden="true">
        <span class="folder-float__label">{{ label }}</span>
        <span class="folder-float__sub">{{ sub }}</span>
      </span>
      <button
        type="button"
        class="folder-float__trigger"
        :aria-expanded="open"
        :aria-label="`${label}, ${sub}`"
        @click="onToggle"
      />
    </div>
  </div>
</template>

<style scoped>
  .folder-float {
    --ff-tab: 14px;
    --ff-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    display: inline-block;
    width: var(--ff-w);
    padding-top: var(--ff-tab);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
  }

  .folder-float__folder {
    position: relative;
    width: var(--ff-w);
    height: var(--ff-h);
  }

  .folder-float__back {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: var(--ff-r);
    background: var(--ff-back);
    transform: perspective(600px) rotateX(8deg);
    transform-origin: 50% 100%;
  }

  .folder-float__back::before {
    content: '';
    position: absolute;
    top: calc(-1 * var(--ff-tab));
    left: 0;
    width: 42%;
    height: calc(var(--ff-tab) + var(--ff-r));
    border-radius: var(--ff-r) var(--ff-r) 0 0;
    background: inherit;
  }

  .folder-float__paper {
    position: absolute;
    top: 10%;
    z-index: 1;
    right: 8%;
    left: 8%;
    height: 50%;
    border-radius: 6px;
    background: var(--ff-paper);
    opacity: 0;
    transform: translateY(10px);
    transition:
      transform var(--ff-close) var(--ff-ease-out),
      opacity var(--ff-close) ease;
  }

  .folder-float__front {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 5px;
    height: 76%;
    padding: 14px 16px;
    box-sizing: border-box;
    border-radius: var(--ff-r);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--ff-front) 92%, #fff),
      var(--ff-front) 60%
    );
    color: var(--ff-label);
    box-shadow: 0 -10px 24px rgba(0, 0, 0, 0.28);
    transform: perspective(600px) rotateX(calc(-1 * var(--ff-rest)));
    transform-origin: 50% 100%;
    transition: transform var(--ff-open) var(--ff-ease-out);
  }

  .folder-float__label {
    font-size: 13px;
    font-weight: 500;
  }

  .folder-float__sub {
    font-size: 11px;
    opacity: 0.55;
  }

  .folder-float__trigger {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 3;
    height: 76%;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--ff-r);
    background: transparent;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .folder-float__trigger:focus-visible {
    box-shadow: 0 0 0 2px var(--ff-label);
  }

  .folder-float[data-open] .folder-float__front {
    transform: perspective(600px) rotateX(calc(-1 * var(--ff-angle)));
  }

  .folder-float[data-open] .folder-float__paper {
    opacity: 1;
    transform: translateY(0);
    transition:
      transform var(--ff-open) var(--ff-ease-out),
      opacity 200ms ease;
  }

  .folder-float__items {
    position: absolute;
    top: var(--ff-tab);
    left: 50%;
    z-index: 1;
    width: 0;
    height: 0;
  }

  .folder-float[data-open] .folder-float__items::before {
    content: '';
    position: absolute;
    top: calc(-1 * (var(--ff-lift) + 120px));
    left: calc(-1 * (var(--ff-spread) + 100px));
    width: calc(2 * var(--ff-spread) + 200px);
    height: calc(var(--ff-lift) + 120px);
  }

  .folder-float__item {
    --x: 0px;
    --y: 0px;

    position: absolute;
    top: 0;
    left: 50%;
    margin: 0;
    padding: 0 14px;
    height: 34px;
    border: 0;
    border-radius: 17px;
    background: var(--ff-item);
    color: var(--ff-item-ink);
    font: inherit;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);
    cursor: pointer;
    outline: none;
    opacity: 0;
    transform: translate(-50%, 44px) scale(0.6);
    transform-origin: 50% 50%;
    pointer-events: none;
    -webkit-tap-highlight-color: transparent;
    transition:
      transform var(--ff-close) var(--ff-ease-out)
        calc((var(--ff-n) - 1 - var(--i)) * var(--ff-stagger) * 0.5),
      opacity 160ms ease
        calc(
          (var(--ff-n) - 1 - var(--i)) * var(--ff-stagger) * 0.5 +
            var(--ff-close) * 0.45
        ),
      scale 160ms var(--ff-ease-out);
  }

  .folder-float__item:focus-visible {
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.14),
      0 0 0 2px var(--ff-label);
  }

  .folder-float[data-open] .folder-float__item {
    opacity: 1;
    transform: translate(calc(-50% + var(--x)), var(--y)) rotate(var(--r))
      scale(1);
    pointer-events: auto;
    transition:
      transform var(--ff-open) var(--ff-spring)
        calc(var(--i) * var(--ff-stagger)),
      opacity 160ms ease calc(var(--i) * var(--ff-stagger)),
      scale 160ms var(--ff-ease-out);
  }

  .folder-float[data-live] .folder-float__item {
    cursor: grab;
    transition: scale 160ms var(--ff-ease-out);
  }

  .folder-float__item[data-drag] {
    cursor: grabbing;
  }

  @media (hover: hover) and (pointer: fine) {
    .folder-float[data-open] .folder-float__item:hover {
      scale: 1.05;
    }
  }

  .folder-float[data-open] .folder-float__item:active {
    scale: 0.97;
  }

  .folder-float__item[data-pop] {
    animation: folder-float-pop 320ms var(--ff-ease-out);
  }

  .folder-float__drift {
    display: block;
    animation: folder-float-drift 3.2s ease-in-out infinite;
    animation-delay: calc(var(--i) * -0.7s);
    animation-play-state: paused;
  }

  .folder-float[data-open] .folder-float__drift {
    animation-play-state: running;
  }

  .folder-float[data-physics] .folder-float__drift,
  .folder-float[data-live] .folder-float__drift {
    animation: none;
  }

  @keyframes folder-float-drift {
    0%,
    100% {
      translate: 0 0;
    }

    50% {
      translate: 0 -3px;
    }
  }

  @keyframes folder-float-pop {
    30% {
      scale: 1.1;
    }

    100% {
      scale: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .folder-float__front,
    .folder-float__paper {
      transition: opacity 200ms ease;
    }

    .folder-float[data-open] .folder-float__front {
      transform: perspective(600px) rotateX(calc(-1 * var(--ff-rest)));
    }

    .folder-float__paper {
      transform: none !important;
    }

    .folder-float__item {
      transition: opacity 200ms ease;
    }

    .folder-float[data-open] .folder-float__item {
      transition: opacity 200ms ease calc(var(--i) * var(--ff-stagger));
    }

    .folder-float__drift {
      animation: none;
    }
  }
</style>
