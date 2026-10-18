<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    buildGrid,
    clamp,
    hash,
    orderOf,
    PATTERNS,
    pixelPath,
    smoothstep,
    STEP,
  } from './pixel-swap';
  import type {
    PixelSwapEngine,
    PixelSwapMode,
    PixelSwapPoint,
    PixelSwapProps,
    PixelSwapSettings,
  } from './types';

  const props = withDefaults(defineProps<PixelSwapProps>(), {
    pattern: 'pointer',
    pixelSize: 48,
    gap: 0,
    pixelRadius: 0,
    pixelScale: 0,
    pixelSpin: 0,
    duration: 400,
    pixelDuration: 350,
    randomness: 0.2,
    bounce: 0.3,
    trigger: 'hover',
    intro: true,
    initialActive: false,
    active: undefined,
    aspectRatio: '16 / 10',
    class: '',
  });

  const emit = defineEmits<{
    /** Fired when the trigger asks to swap. Pairs with `v-model:active`. */
    'update:active': [active: boolean];
    /** Fired when a swap finishes. */
    complete: [active: boolean];
  }>();

  const reducedMotion = usePreferredReducedMotion();

  const controlled = computed(() => props.active !== undefined);
  const shown = ref(props.active ?? props.initialActive);

  const rootRef = ref<HTMLDivElement | null>(null);
  const firstLayer = ref<HTMLDivElement | null>(null);
  const secondLayer = ref<HTMLDivElement | null>(null);

  const settings = computed<PixelSwapSettings>(() => ({
    pattern: PATTERNS.includes(props.pattern) ? props.pattern : 'pointer',
    pixelSize: Math.max(8, Math.round(props.pixelSize)),
    gap: Math.max(0, props.gap),
    pixelRadius: clamp(props.pixelRadius, 0, 50),
    pixelScale: clamp(props.pixelScale, 0, 0.9),
    pixelSpin: (clamp(props.pixelSpin, -360, 360) * Math.PI) / 180,
    duration: Math.max(0, props.duration),
    pixelDuration: Math.max(60, props.pixelDuration),
    randomness: clamp(props.randomness, 0, 1),
    bounce: clamp(props.bounce, 0, 1),
  }));

  let current = shown.value;
  let desired = shown.value;
  let lastPoint: PixelSwapPoint | null = null;
  let engine: PixelSwapEngine | null = null;
  let waiting = false;
  let raf = 0;

  function setLayer(index: number, visible: boolean, clip: string) {
    const layer = index === 0 ? firstLayer.value : secondLayer.value;
    if (!layer) return;
    layer.setAttribute('data-visible', String(visible));
    layer.style.clipPath = clip;
  }

  function settle(target: boolean) {
    setLayer(1, target, '');
    setLayer(0, !target, '');
    current = target;
    shown.value = target;
    emit('complete', target);
  }

  function finish() {
    if (!engine) return;
    engine.running = false;
    rootRef.value?.removeAttribute('data-swapping');
    if (engine.mode === 'intro') {
      setLayer(0, !current, '');
      engine.mode = 'swap';
      if (desired !== current) request(desired, lastPoint);
      return;
    }
    settle(engine.desired === 1);
  }

  function frame(now: number) {
    raf = 0;
    if (!engine) return;
    const s = settings.value;
    const grid = engine.grid;
    const { value, velocity, flipAt, target } = engine;
    const elapsed = clamp((now - engine.last) / 1000, 0, 1 / 20);
    engine.last = now;
    const omega = (Math.PI * 2) / (s.pixelDuration / 1000);
    const zeta = clamp(1 - s.bounce, 0.15, 1);
    const steps = Math.max(1, Math.ceil(elapsed / STEP));
    const dt = elapsed / steps;
    const pop = s.pixelScale;
    const half = grid.size / 2;
    const cover = grid.gap / 2 + 0.5;
    let moving = false;
    let path = '';

    for (let i = 0; i < grid.count; i++) {
      const flip = flipAt[i] ?? 0;
      if (now >= flip && target[i] !== engine.desired) {
        target[i] = engine.desired;
        if (engine.desired === 1 && (value[i] ?? 0) < pop) value[i] = pop;
      }
      let x = value[i] ?? 0;
      let v = velocity[i] ?? 0;
      const goal = target[i] ?? 0;
      for (let n = 0; n < steps; n++) {
        v += (-omega * omega * (x - goal) - 2 * zeta * omega * v) * dt;
        x += v * dt;
      }
      if (goal === 0 && x <= pop) {
        x = 0;
        v = 0;
      }
      if (Math.abs(x - goal) > 0.001 || Math.abs(v) > 0.01 || now < flip) {
        moving = true;
      } else {
        x = goal;
        v = 0;
      }
      value[i] = x;
      velocity[i] = v;
      if (x <= 0.002) continue;
      const grow = smoothstep(0.6, 0.93, x);
      const size = Math.min(x * 1.08, 1.25) * (half + cover * grow);
      const radius = Math.min(size, (s.pixelRadius / 50) * size * (1 - grow));
      path += pixelPath(
        grid.cx[i] ?? 0,
        grid.cy[i] ?? 0,
        size,
        radius,
        s.pixelSpin * (1 - x),
      );
    }

    const layer = engine.mode === 'intro' ? 0 : 1;
    setLayer(layer, path !== '', path ? `path('${path}')` : '');

    if (moving) raf = requestAnimationFrame(frame);
    else finish();
  }

  function launch(
    mode: PixelSwapMode,
    to: boolean,
    point: PixelSwapPoint | null,
  ): boolean {
    const root = rootRef.value;
    const s = settings.value;
    const width = root?.clientWidth ?? 0;
    const height = root?.clientHeight ?? 0;
    if (!root || reducedMotion.value === 'reduce' || !width || !height) {
      return false;
    }

    const now = performance.now();
    if (!engine?.running) {
      const grid = buildGrid(width, height, s.pixelSize, s.gap);
      const start = mode === 'intro' ? 0 : current ? 1 : 0;
      engine = {
        mode,
        grid,
        value: new Float32Array(grid.count).fill(start),
        velocity: new Float32Array(grid.count),
        flipAt: new Float64Array(grid.count),
        target: new Uint8Array(grid.count).fill(start),
        desired: start,
        last: now,
        running: true,
      };
    }
    const active = engine;
    active.desired = to ? 1 : 0;
    const grid = active.grid;
    const orders = new Float32Array(grid.count);
    let first = Infinity;
    for (let i = 0; i < grid.count; i++) {
      const order =
        orderOf(grid, i, s.pattern, point) * (1 - s.randomness) +
        hash(i) * s.randomness;
      orders[i] = order;
      const settled =
        active.target[i] === active.desired &&
        Math.abs((active.value[i] ?? 0) - active.desired) < 0.001;
      if (!settled) first = Math.min(first, order);
    }
    if (first === Infinity) first = 0;
    for (let i = 0; i < grid.count; i++) {
      active.flipAt[i] =
        now + Math.max(0, (orders[i] ?? 0) - first) * s.duration;
    }
    root.setAttribute('data-swapping', '');
    if (mode === 'swap') setLayer(0, true, '');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
    return true;
  }

  function request(to: boolean, point: PixelSwapPoint | null) {
    if (waiting || (engine?.running && engine.mode === 'intro')) return;
    if (!engine?.running && current === to) return;
    if (launch('swap', to, point)) return;
    settle(to);
  }

  function ask(next: boolean, point: PixelSwapPoint | null) {
    desired = next;
    lastPoint = point;
    emit('update:active', next);
    if (!controlled.value) request(next, point);
  }

  let cleanupIntro: (() => void) | null = null;

  onMounted(() => {
    if (!props.intro || current) return;
    const images = [
      ...(firstLayer.value?.querySelectorAll('img') ?? []),
    ].filter((image) => !image.complete);
    let started = false;
    let timer = 0;
    const begin = () => {
      if (started) return;
      started = true;
      window.clearTimeout(timer);
      waiting = false;
      if (launch('intro', true, null)) return;
      setLayer(0, true, '');
      if (desired !== current) request(desired, lastPoint);
    };
    setLayer(0, false, '');
    if (!images.length) {
      begin();
      return;
    }
    waiting = true;
    let left = images.length;
    const settleImage = () => {
      left -= 1;
      if (left <= 0) begin();
    };
    images.forEach((image) => {
      image.addEventListener('load', settleImage, { once: true });
      image.addEventListener('error', settleImage, { once: true });
    });
    timer = window.setTimeout(begin, 3000);
    cleanupIntro = () => {
      started = true;
      window.clearTimeout(timer);
      waiting = false;
      images.forEach((image) => {
        image.removeEventListener('load', settleImage);
        image.removeEventListener('error', settleImage);
      });
    };
  });

  watch(
    () => props.active,
    (next) => {
      if (next === undefined) return;
      desired = next;
      request(next, lastPoint);
    },
  );

  onBeforeUnmount(() => {
    cleanupIntro?.();
    cancelAnimationFrame(raf);
    raf = 0;
    if (engine) engine.running = false;
  });

  function pointOf(event: MouseEvent): PixelSwapPoint | null {
    const rect = rootRef.value?.getBoundingClientRect();
    if (
      !rect ||
      (event.detail === 0 && event.clientX === 0 && event.clientY === 0)
    ) {
      return null;
    }
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerEnter(event: PointerEvent) {
    if (props.trigger !== 'hover' || event.pointerType === 'touch') return;
    ask(true, pointOf(event));
  }

  function onPointerLeave(event: PointerEvent) {
    if (props.trigger !== 'hover' || event.pointerType === 'touch') return;
    ask(false, pointOf(event));
  }

  function onClick(event: MouseEvent) {
    if (props.trigger === 'click') {
      ask(!desired, pointOf(event));
      return;
    }
    if (props.trigger !== 'hover') return;
    const touch =
      event instanceof PointerEvent && event.pointerType === 'touch';
    if (event.detail === 0 || touch) ask(!desired, pointOf(event));
  }

  function onFocus(event: FocusEvent) {
    const root = rootRef.value;
    if (props.trigger !== 'hover' || !root || event.target !== root) return;
    if (root.matches(':focus-visible')) ask(true, null);
  }

  function onBlur() {
    if (props.trigger === 'hover') ask(false, null);
  }

  function onKeydown(event: KeyboardEvent) {
    if (props.trigger !== 'click') return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    ask(!desired, null);
  }

  const interactive = computed(() => props.trigger !== 'none');
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('pixel-swap', props.class)"
    :style="{ aspectRatio: props.aspectRatio }"
    :data-active="shown ? '' : undefined"
    :tabindex="interactive ? 0 : undefined"
    :role="props.trigger === 'click' ? 'button' : undefined"
    :aria-pressed="props.trigger === 'click' ? shown : undefined"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @click="onClick"
    @focus="onFocus"
    @blur="onBlur"
    @keydown="onKeydown"
  >
    <div
      ref="firstLayer"
      class="pixel-swap__layer"
      :style="{ zIndex: 0 }"
      :data-visible="String(!shown)"
      :aria-hidden="shown"
    >
      <slot name="first" />
    </div>
    <div
      ref="secondLayer"
      class="pixel-swap__layer"
      :style="{ zIndex: 1 }"
      :data-visible="String(shown)"
      :aria-hidden="!shown"
    >
      <slot name="second" />
    </div>
  </div>
</template>

<style scoped>
  .pixel-swap {
    position: relative;
    width: 100%;
    overflow: hidden;
    isolation: isolate;
    outline: none;
  }

  .pixel-swap:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }

  .pixel-swap__layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .pixel-swap__layer[data-visible='false'] {
    visibility: hidden;
  }
</style>
