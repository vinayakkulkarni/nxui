<script setup lang="ts">
  import { onMounted, ref, useTemplateRef, watch } from 'vue';
  import {
    useElementVisibility,
    useEventListener,
    useMediaQuery,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { createParticle, createShapes, lerp, random } from './fizzy';
  import type { FizzyButtonProps, FizzyParticle, FizzyState } from './types';

  const props = withDefaults(defineProps<FizzyButtonProps>(), {
    label: 'Make it happen',
    trigger: 'hover',
    proximity: 160,
    wakeMargin: 60,
    shape: 'mixed',
    count: 80,
    size: 1.5,
    variation: 0.65,
    drift: 1,
    spin: 1,
    crest: 1,
    restAlpha: 0.18,
    activeAlpha: 0.58,
    idleSpeed: 0.35,
    activeSpeed: 1.5,
    fillDuration: 0.7,
    debug: false,
    class: '',
  });

  const emit = defineEmits<{ click: [event: MouseEvent] }>();
  /** Toggle state when `trigger` is `toggle`. */
  const pressed = defineModel<boolean>('pressed', { default: false });

  const FADE_MS = 450;

  const wrap = useTemplateRef<HTMLElement>('wrap');
  const button = useTemplateRef<HTMLButtonElement>('button');
  const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
  const fillEl = useTemplateRef<HTMLElement>('fill');

  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const onScreen = useElementVisibility(button);

  const shapes = createShapes();
  let particles: FizzyParticle[] = [];
  let ctx: CanvasRenderingContext2D | null = null;

  const s: FizzyState = {
    w: 0,
    h: 0,
    cx: 0,
    cy: 0,
    radius: 0,
    pointer: null,
    hovered: false,
    focused: false,
    down: false,
    warm: false,
    visible: false,
    fill: 0,
    from: 0,
    target: 0,
    started: 0,
    fadeUntil: 0,
    time: 0,
  };

  const near = ref(false);
  const active = ref(false);
  const ringStyle = ref<Record<string, string>>({});

  function sizeRings(): void {
    const reveal = s.radius + props.proximity;
    ringStyle.value = {
      '--reveal-diameter': `${reveal * 2}px`,
      '--wake-diameter': `${(reveal + props.wakeMargin) * 2}px`,
    };
  }

  function seed(): void {
    particles = Array.from({ length: props.count }, () =>
      createParticle(props.shape, props.spin),
    );
  }

  function applyFill(now: number): void {
    const p = reduced.value
      ? 1
      : Math.min(1, (now - s.started) / (props.fillDuration * 1000));
    const eased = p * p * (3 - 2 * p);
    s.fill = lerp(s.from, s.target, eased);
    if (fillEl.value) {
      fillEl.value.style.clipPath = `inset(${(1 - s.fill) * 100}% 0 0 0)`;
    }
  }

  function draw(now: number, dt: number): void {
    applyFill(now);
    s.time += dt;
    if (!ctx) return;
    const { w, h, fill } = s;
    ctx.clearRect(0, 0, w, h);
    const edge = h * (1 - fill);
    const unit = (props.size * Math.min(w, h)) / 36;
    const speed = lerp(props.idleSpeed, props.activeSpeed, fill);
    ctx.fillStyle = '#000';
    for (const p of particles) {
      p.y -= p.speed * speed * dt;
      p.rot += p.spin * props.spin * dt * (0.4 + fill);
      if (p.y < -0.1) {
        p.y = random(1.02, 1.25);
        p.x = Math.random();
      }
      const x =
        (p.x +
          Math.sin(s.time * p.freq + p.phase) * 0.05 * p.sway * props.drift) *
        w;
      const y = p.y * h;
      // Particles near the rising fill edge swell and brighten.
      const crest = Math.max(0, 1 - Math.abs(y - edge) / (h * 0.22));
      const alpha = Math.min(
        1,
        p.alpha * lerp(props.restAlpha, props.activeAlpha, fill) +
          crest * props.crest * (0.45 + fill * 0.55),
      );
      const scale =
        (1.2 * (1 + p.size * props.variation) + crest * props.crest * 1.1) *
        unit;
      if (y < -scale || y > h + scale || alpha <= 0.01) continue;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.rot);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      ctx.fill(shapes[props.shape === 'mixed' ? p.shape : props.shape]);
      ctx.restore();
    }
  }

  function shouldRun(now: number): boolean {
    return (
      !document.hidden &&
      onScreen.value &&
      !reduced.value &&
      (s.warm || s.visible || now < s.fadeUntil || s.fill !== s.target)
    );
  }

  const loop = useRafFn(
    ({ delta, timestamp }) => {
      draw(timestamp, Math.min(delta / 1000, 0.05));
      if (!shouldRun(timestamp)) loop.pause();
    },
    { immediate: false },
  );

  function schedule(): void {
    const now = performance.now();
    if (shouldRun(now)) {
      if (!loop.isActive.value) loop.resume();
    } else {
      loop.pause();
      if (reduced.value && !document.hidden && onScreen.value) draw(now, 0);
    }
  }

  function update(): void {
    const now = performance.now();
    const distance = s.pointer
      ? Math.hypot(s.pointer.x - s.cx, s.pointer.y - s.cy)
      : Infinity;
    const reveal = s.radius + props.proximity;
    const isNear = distance <= reveal;
    s.warm = distance <= reveal + props.wakeMargin;

    const isActive =
      props.trigger === 'toggle'
        ? pressed.value
        : s.hovered || s.focused || s.down;
    const isVisible = isNear || isActive || s.focused || s.down;

    if (s.visible && !isVisible) s.fadeUntil = now + FADE_MS;
    s.visible = isVisible;
    if (Number(isActive) !== s.target) {
      applyFill(now);
      s.from = s.fill;
      s.target = Number(isActive);
      s.started = now;
    }
    near.value = isVisible;
    active.value = isActive;
    schedule();
  }

  function measure(): void {
    const el = wrap.value;
    const cv = canvas.value;
    if (!el || !cv) return;
    const rect = el.getBoundingClientRect();
    s.cx = rect.left + rect.width / 2;
    s.cy = rect.top + rect.height / 2;
    s.radius = Math.hypot(rect.width, rect.height) / 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    s.w = rect.width;
    s.h = rect.height;
    if (cv.width !== width || cv.height !== height) {
      cv.width = width;
      cv.height = height;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeRings();
    update();
    draw(performance.now(), 0);
  }

  function release(): void {
    s.pointer = null;
    s.hovered = false;
    s.down = false;
    update();
  }

  // No target = window; VueUse skips registration during SSR.
  useEventListener('pointermove', (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    s.pointer = { x: event.clientX, y: event.clientY };
    update();
  });
  useEventListener('pointerup', () => {
    s.down = false;
    update();
  });
  useEventListener('pointercancel', release);
  useEventListener('blur', release);
  useEventListener('resize', measure);
  useEventListener('scroll', measure, { passive: true, capture: true });
  useEventListener(() => document, 'pointerleave', release);
  useEventListener(
    () => document,
    'visibilitychange',
    () => {
      if (document.hidden) release();
      else measure();
    },
  );
  useResizeObserver(wrap, measure);

  function onEnter(event: PointerEvent): void {
    if (event.pointerType !== 'touch') s.hovered = true;
    update();
  }

  function onLeave(): void {
    s.hovered = false;
    update();
  }

  function onDown(): void {
    s.down = true;
    update();
  }

  function onFocus(): void {
    s.focused = button.value?.matches(':focus-visible') ?? false;
    update();
  }

  function onBlur(): void {
    s.focused = false;
    update();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      s.focused = true;
      update();
    }
  }

  function onClick(event: MouseEvent): void {
    if (props.trigger === 'toggle') pressed.value = !pressed.value;
    emit('click', event);
  }

  watch([pressed, reduced, onScreen], update);
  watch([() => props.count, () => props.shape], () => {
    seed();
    draw(performance.now(), 0);
  });
  watch(
    [() => props.proximity, () => props.wakeMargin, () => props.trigger],
    () => {
      sizeRings();
      update();
    },
  );

  onMounted(() => {
    ctx = canvas.value?.getContext('2d') ?? null;
    seed();
    measure();
  });
</script>

<template>
  <div
    ref="wrap"
    :class="['fizzy-wrap relative isolate inline-block', props.class]"
    :style="ringStyle"
  >
    <template v-if="props.debug">
      <div aria-hidden="true" class="fizzy-ring fizzy-ring--wake" />
      <div aria-hidden="true" class="fizzy-ring fizzy-ring--reveal" />
    </template>
    <button
      ref="button"
      type="button"
      :class="['fizzy-button', { 'is-near': near, 'is-active': active }]"
      :aria-pressed="props.trigger === 'toggle' ? pressed : undefined"
      @pointerenter="onEnter"
      @pointerleave="onLeave"
      @pointerdown="onDown"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeydown"
      @click="onClick"
    >
      <canvas ref="canvas" class="fizzy-button__canvas" aria-hidden="true" />
      <span class="fizzy-button__label"
        ><slot>{{ props.label }}</slot></span
      >
      <span ref="fill" class="fizzy-button__fill" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
  .fizzy-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: var(--reveal-diameter);
    aspect-ratio: 1;
    border-radius: 50%;
    pointer-events: none;
    z-index: -1;
  }

  .fizzy-ring--reveal {
    background: color-mix(in srgb, #62bca4 7%, transparent);
    border: 1px dashed color-mix(in srgb, #62bca4 65%, transparent);
  }

  .fizzy-ring--wake {
    width: var(--wake-diameter);
    background: color-mix(in srgb, #a38bce 3%, transparent);
    border: 1px dashed color-mix(in srgb, #a38bce 45%, transparent);
  }

  .fizzy-button {
    position: relative;
    isolation: isolate;
    display: grid;
    place-items: center;
    appearance: none;
    border: 0;
    margin: 0;
    padding: 1.05em 2.4em;
    border-radius: 999px;
    background: #fff;
    color: #000;
    font-family: inherit;
    font-size: clamp(1rem, 0.6rem + 1.6vw, 1.5rem);
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1;
    cursor: pointer;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    transition:
      box-shadow 0.4s ease,
      transform 0.4s ease;
    box-shadow:
      0 1px 1px #0003,
      0 12px 30px -12px #0009;
  }

  .fizzy-button:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }

  .fizzy-button:active {
    transform: translateY(1px) scale(0.99);
  }

  .fizzy-button__canvas {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.45s ease;
  }

  .fizzy-button.is-near .fizzy-button__canvas,
  .fizzy-button.is-active .fizzy-button__canvas {
    opacity: 1;
  }

  .fizzy-button__label {
    grid-area: 1 / 1;
    position: relative;
    z-index: 2;
    pointer-events: none;
  }

  /* White + difference inverts everything beneath it as the fill rises. */
  .fizzy-button__fill {
    position: absolute;
    inset: 1px;
    z-index: 3;
    background: #fff;
    mix-blend-mode: difference;
    pointer-events: none;
    border-radius: 999px;
    clip-path: inset(100% 0 0 0);
  }

  @media (prefers-reduced-motion: reduce) {
    .fizzy-button,
    .fizzy-button__canvas {
      transition: none;
    }

    .fizzy-button:active {
      transform: none;
    }
  }
</style>
