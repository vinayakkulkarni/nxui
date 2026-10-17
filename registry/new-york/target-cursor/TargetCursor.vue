<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
  } from 'vue';
  import { useEventListener, usePreferredReducedMotion } from '@vueuse/core';
  import { CORNER_ANGLES, createTargetCursor } from './target-cursor-engine';
  import type {
    TargetCursorEngine,
    TargetCursorProps,
    TargetCursorSettings,
  } from './types';

  const props = withDefaults(defineProps<TargetCursorProps>(), {
    targetSelector: '.cursor-target',
    cursorColor: '#ffffff',
    cursorColorOnTarget: undefined,
    spinDuration: 2,
    hoverDuration: 0.2,
    parallaxOn: true,
    hideDefaultCursor: true,
    size: 36,
    cornerSize: 12,
    thickness: 3,
    padding: 6,
    matchRadius: true,
    dotSize: 4,
    blendMode: 'difference',
    showLabel: true,
    clickEffect: true,
    container: null,
  });

  const rootRef = ref<HTMLElement>();
  const cornerRefs = ref<HTMLElement[]>([]);
  const dotRef = ref<HTMLElement>();
  const labelRef = ref<HTMLElement>();
  const finePointer = ref(false);
  const reducedMotion = usePreferredReducedMotion();
  let engine: TargetCursorEngine | null = null;

  function resolveContainer(): HTMLElement | null {
    const value = props.container;
    if (!value) return null;
    if (typeof value === 'string') {
      const found = document.querySelector(value);
      return found instanceof HTMLElement ? found : null;
    }
    return value;
  }

  const containerEl = computed(resolveContainer);

  function settings(): TargetCursorSettings {
    return {
      targetSelector: props.targetSelector,
      cursorColor: props.cursorColor,
      cursorColorOnTarget: props.cursorColorOnTarget,
      spinDuration: props.spinDuration,
      hoverDuration: Math.max(0.05, props.hoverDuration),
      parallaxOn: props.parallaxOn,
      hideDefaultCursor: props.hideDefaultCursor,
      size: Math.max(4, props.size),
      cornerSize: Math.max(2, props.cornerSize),
      thickness: Math.max(0.5, props.thickness),
      padding: props.padding,
      matchRadius: props.matchRadius,
      dotSize: Math.max(0, props.dotSize),
      showLabel: props.showLabel,
      clickEffect: props.clickEffect,
      container: containerEl.value,
      reduce: reducedMotion.value === 'reduce',
    };
  }

  function teardown() {
    engine?.destroy();
    engine = null;
  }

  async function build() {
    teardown();
    if (!finePointer.value) return;
    await nextTick();
    const root = rootRef.value;
    if (!root || engine) return;
    engine = createTargetCursor(
      {
        root,
        corners: cornerRefs.value,
        dot: dotRef.value ?? null,
        label: labelRef.value ?? null,
      },
      settings,
    );
  }

  onMounted(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    finePointer.value = query.matches;
    useEventListener(query, 'change', () => {
      finePointer.value = query.matches;
    });
  });

  watch(finePointer, build);

  watch(props, () => engine?.wake(), { flush: 'post' });

  onBeforeUnmount(teardown);
</script>

<template>
  <Teleport v-if="finePointer" to="body">
    <div
      ref="rootRef"
      class="target-cursor"
      :style="{ mixBlendMode: blendMode, opacity: 0 }"
      aria-hidden="true"
    >
      <span
        v-for="angle in CORNER_ANGLES"
        :key="angle"
        ref="cornerRefs"
        class="target-cursor__corner"
      ></span>
      <span ref="dotRef" class="target-cursor__dot"></span>
      <span ref="labelRef" class="target-cursor__label"></span>
    </div>
  </Teleport>
</template>

<style>
  .target-cursor {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    pointer-events: none;
  }

  .target-cursor__corner {
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
    border-style: solid;
    border-color: var(--target-cursor-color, #ffffff);
    transform-origin: 0 0;
    will-change: transform;
  }

  .target-cursor__dot {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 50%;
    background: var(--target-cursor-color, #ffffff);
    will-change: transform;
  }

  .target-cursor__label {
    position: absolute;
    top: 0;
    left: 0;
    color: var(--target-cursor-color, #ffffff);
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    opacity: 0;
    will-change: transform, opacity;
  }
</style>
