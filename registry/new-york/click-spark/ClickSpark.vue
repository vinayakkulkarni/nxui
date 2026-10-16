<script setup lang="ts">
  import { computed, onBeforeUnmount, useTemplateRef } from 'vue';
  import { useEventListener, usePreferredReducedMotion } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    EASINGS,
    MAX_BURSTS,
    SHAPES,
    channels,
    clamp,
    drawRing,
    drawSpark,
    drop,
    toColors,
  } from './click-spark-draw';
  import type {
    ClickSparkBurst,
    ClickSparkExposed,
    ClickSparkProps,
    ClickSparkSettings,
    Spark,
  } from './types';

  const props = withDefaults(defineProps<ClickSparkProps>(), {
    sparkColor: '#fff',
    sparkSize: 14,
    sparkRadius: 30,
    sparkCount: 8,
    sparkWidth: 2,
    duration: 500,
    easing: 'ease-out',
    extraScale: 1,
    shape: 'line',
    randomness: 0.2,
    gravity: 0,
    spread: 360,
    direction: 0,
    glow: 0,
    ring: false,
    layer: 'front',
    disabled: false,
    class: '',
  });

  const rootRef = useTemplateRef<HTMLDivElement>('root');
  const layerRef = useTemplateRef<HTMLSpanElement>('sparkLayer');
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<ClickSparkSettings>(() => ({
    colors: toColors(props.sparkColor),
    size: Math.max(0, props.sparkSize),
    radius: Math.max(0, props.sparkRadius) * Math.max(0, props.extraScale),
    count: clamp(Math.round(props.sparkCount), 1, 64),
    width: Math.max(0.5, props.sparkWidth),
    duration: Math.max(60, props.duration),
    ease: EASINGS[props.easing] ?? EASINGS['ease-out'],
    spring: props.easing === 'spring',
    shape: SHAPES.includes(props.shape) ? props.shape : 'line',
    randomness: clamp(props.randomness, 0, 1),
    gravity: Math.max(0, props.gravity),
    spread: clamp(props.spread, 0, 360),
    direction: props.direction,
    glow: clamp(props.glow, 0, 1),
    ring: props.ring,
    disabled: props.disabled,
  }));

  const bursts: ClickSparkBurst[] = [];
  let raf = 0;
  let lastPress = { time: -1e9, x: 0, y: 0 };

  function remove(burst: ClickSparkBurst) {
    burst.canvas.remove();
    const index = bursts.indexOf(burst);
    if (index >= 0) bursts.splice(index, 1);
  }

  function frame(now: number) {
    raf = 0;
    const reduced = reducedMotion.value === 'reduce';
    for (const burst of bursts.slice()) {
      const elapsed = now - burst.start;
      const ctx = burst.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, burst.canvas.width, burst.canvas.height);
      ctx.setTransform(
        burst.ratio,
        0,
        0,
        burst.ratio,
        -burst.left * burst.ratio,
        -burst.top * burst.ratio,
      );
      let alive = false;
      if (burst.settings.ring && drawRing(ctx, burst, elapsed, reduced))
        alive = true;
      for (const spark of burst.sparks) {
        if (drawSpark(ctx, burst, spark, elapsed, reduced)) alive = true;
      }
      ctx.globalAlpha = 1;
      if (!alive) remove(burst);
    }
    if (bursts.length) raf = requestAnimationFrame(frame);
  }

  function spawn(clientX: number, clientY: number) {
    const s = settings.value;
    const root = rootRef.value;
    const layer = layerRef.value;
    if (s.disabled || !root || !layer) return;
    const rect = root.getBoundingClientRect();
    const offset = Math.floor(Math.random() * s.colors.length);
    const full = s.spread >= 359.5;
    const arc = (s.spread * Math.PI) / 180;
    const heading = ((s.direction - 90) * Math.PI) / 180;
    let step = 0;
    if (full) step = (Math.PI * 2) / s.count;
    else if (s.count > 1) step = arc / (s.count - 1);
    const sparks: Spark[] = Array.from({ length: s.count }, (_, i) => {
      let base = heading;
      if (full) base = heading + step * i;
      else if (s.count > 1) base = heading - arc / 2 + step * i;
      const jitter = (Math.random() - 0.5) * s.randomness;
      return {
        angle: base + jitter * (step || arc || 1) * 0.9,
        reach: 1 + (Math.random() - 0.5) * 0.7 * s.randomness,
        scale: 1 + (Math.random() - 0.5) * 0.8 * s.randomness,
        life: 1 + (Math.random() - 0.5) * 0.5 * s.randomness,
        spin: Math.random() - 0.5,
        color: s.colors[(i + offset) % s.colors.length] ?? '#ffffff',
        clear: '',
        glow: 0,
      };
    });
    const longest = s.duration * (1 + 0.25 * s.randomness);
    const fall = drop(s, longest / 1000);
    const reach =
      s.radius * (1 + 0.35 * s.randomness) * (s.spring ? 1.15 : 1) +
      s.size * (1 + 0.4 * s.randomness) +
      s.width * (s.glow > 0 ? 6 : 2) +
      6;
    const box = {
      left: Math.max(clientX - reach, 0),
      top: Math.max(clientY - reach, 0),
      right: Math.min(clientX + reach, window.innerWidth),
      bottom: Math.min(clientY + reach + fall, window.innerHeight),
    };
    if (box.right - box.left < 1 || box.bottom - box.top < 1) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil((box.right - box.left) * ratio);
    canvas.height = Math.ceil((box.bottom - box.top) * ratio);
    Object.assign(canvas.style, {
      position: 'absolute',
      left: `${box.left - rect.left}px`,
      top: `${box.top - rect.top}px`,
      width: `${box.right - box.left}px`,
      height: `${box.bottom - box.top}px`,
      display: 'block',
      pointerEvents: 'none',
    });
    canvas.setAttribute('aria-hidden', 'true');
    layer.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.remove();
      return;
    }
    for (const spark of sparks) {
      const [r, g, b] = channels(ctx, spark.color);
      spark.clear = `rgba(${r}, ${g}, ${b}, 0)`;
      spark.glow =
        s.glow * (0.35 + 0.65 * ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255));
    }
    bursts.push({
      x: clientX,
      y: clientY,
      start: performance.now(),
      sparks,
      settings: { ...s },
      canvas,
      ctx,
      ratio,
      left: box.left,
      top: box.top,
    });
    while (bursts.length > MAX_BURSTS) {
      const oldest = bursts[0];
      if (!oldest) break;
      remove(oldest);
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    lastPress = {
      time: performance.now(),
      x: event.clientX,
      y: event.clientY,
    };
    spawn(event.clientX, event.clientY);
  }

  function onClick(event: MouseEvent) {
    if (event instanceof PointerEvent && event.pointerType === 'mouse') return;
    if (event.detail === 0) {
      const target =
        event.target instanceof Element ? event.target : rootRef.value;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      spawn(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return;
    }
    const recent =
      performance.now() - lastPress.time < 700 &&
      Math.hypot(event.clientX - lastPress.x, event.clientY - lastPress.y) < 12;
    if (!recent) spawn(event.clientX, event.clientY);
  }

  useEventListener(rootRef, 'pointerdown', onPointerDown);
  useEventListener(rootRef, 'click', onClick);

  function spark(x?: number, y?: number) {
    const root = rootRef.value;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    spawn(rect.left + (x ?? rect.width / 2), rect.top + (y ?? rect.height / 2));
  }

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    raf = 0;
    for (const burst of bursts.slice()) remove(burst);
  });

  defineExpose<ClickSparkExposed>({ spark });
</script>

<template>
  <div ref="root" :class="cn('relative isolate size-full', props.class)">
    <slot />
    <span
      ref="sparkLayer"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 overflow-visible"
      :class="layer === 'back' ? '-z-1' : 'z-1'"
    />
  </div>
</template>
