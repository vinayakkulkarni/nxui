<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    QUALITY,
    clamp,
    createSplashFluid,
    parseColor,
  } from './splash-fluid';
  import type { SplashCursorProps, SplashFluid, SplashSettings } from './types';

  const props = withDefaults(defineProps<SplashCursorProps>(), {
    colors: () => ['#4f8cff', '#2dd4bf', '#ffd166'],
    rainbow: true,
    colorSpeed: 1,
    intensity: 1,
    size: 1,
    force: 1,
    swirl: 3,
    trail: 1,
    momentum: 1,
    shading: 1,
    glow: 0,
    quality: 'high',
    clickSplash: true,
    intro: true,
    contained: false,
    theme: 'dark',
    zIndex: 50,
    class: '',
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  const settings = computed<SplashSettings>(() => ({
    palette: (props.colors.length ? props.colors : ['#ffffff']).map(parseColor),
    rainbow: props.rainbow,
    colorSpeed: Math.max(0, props.colorSpeed),
    intensity: Math.max(0, props.intensity),
    size: Math.max(0.05, props.size),
    force: Math.max(0, props.force),
    swirl: Math.max(0, props.swirl),
    trail: Math.max(0.05, props.trail),
    momentum: Math.max(0.05, props.momentum),
    shading: clamp(props.shading, 0, 1),
    glow: clamp(props.glow, 0, 1),
    quality: props.quality in QUALITY ? props.quality : 'high',
    clickSplash: props.clickSplash,
    contained: props.contained,
    light: props.theme === 'light',
  }));

  let fluid: SplashFluid | null = null;
  const getSettings = () => settings.value;

  function start(intro: boolean) {
    fluid?.dispose();
    fluid = null;
    if (!canvasRef.value) return;
    fluid = createSplashFluid(canvasRef.value, getSettings, intro, onRestored);
  }

  function onRestored() {
    start(props.intro);
  }

  let restoreParent: (() => void) | null = null;

  function syncParentPosition(contained: boolean) {
    restoreParent?.();
    restoreParent = null;
    const parent = rootRef.value?.parentElement;
    if (!contained || !parent) return;
    if (getComputedStyle(parent).position !== 'static') return;
    const previous = parent.style.position;
    parent.style.position = 'relative';
    restoreParent = () => {
      parent.style.position = previous;
    };
  }

  onMounted(() => {
    syncParentPosition(props.contained);
    start(props.intro);
  });

  watch(
    () => props.contained,
    (contained) => syncParentPosition(contained),
  );

  onBeforeUnmount(() => {
    fluid?.dispose();
    fluid = null;
    restoreParent?.();
    restoreParent = null;
  });

  const passive = { passive: true };

  function onPointerMove(event: PointerEvent) {
    if (event.pointerType !== 'touch')
      fluid?.track(`p${event.pointerId}`, event.clientX, event.clientY);
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType !== 'touch')
      fluid?.press(event.clientX, event.clientY);
  }

  function onTouchStart(event: TouchEvent) {
    Array.from(event.changedTouches).forEach((touch) => {
      fluid?.release(`t${touch.identifier}`);
      fluid?.track(`t${touch.identifier}`, touch.clientX, touch.clientY);
      fluid?.press(touch.clientX, touch.clientY);
    });
  }

  function onTouchMove(event: TouchEvent) {
    Array.from(event.changedTouches).forEach((touch) => {
      fluid?.track(`t${touch.identifier}`, touch.clientX, touch.clientY);
    });
  }

  function onTouchEnd(event: TouchEvent) {
    Array.from(event.changedTouches).forEach((touch) => {
      fluid?.release(`t${touch.identifier}`);
    });
  }

  function onLeave() {
    fluid?.leave();
  }

  useEventListener('pointermove', onPointerMove, passive);
  useEventListener('pointerdown', onPointerDown, passive);
  useEventListener('touchstart', onTouchStart, passive);
  useEventListener('touchmove', onTouchMove, passive);
  useEventListener('touchend', onTouchEnd, passive);
  useEventListener('touchcancel', onTouchEnd, passive);
  onMounted(() => {
    useEventListener(document.documentElement, 'pointerleave', onLeave);
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('splash-cursor', props.class)"
    :style="{ zIndex: props.zIndex }"
    :data-contained="props.contained ? '' : undefined"
    aria-hidden="true"
  >
    <canvas ref="canvasRef" class="splash-cursor__canvas" />
  </div>
</template>

<style scoped>
  .splash-cursor {
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  .splash-cursor[data-contained] {
    position: absolute;
  }

  .splash-cursor__canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
