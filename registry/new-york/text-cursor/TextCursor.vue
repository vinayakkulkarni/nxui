<script setup lang="ts">
  import { computed, onBeforeUnmount, useTemplateRef, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { createTextCursor } from './text-cursor-engine';
  import type { TextCursorProps, TextCursorSettings } from './types';

  const props = withDefaults(defineProps<TextCursorProps>(), {
    text: 'Hello',
    mode: 'stamp',
    spacing: 88,
    maxPoints: 7,
    followMouseDirection: true,
    randomFloat: true,
    exitDuration: 0.5,
    removalInterval: 30,
    shrink: 0.5,
    fade: 0.6,
    smoothing: 0.3,
    popIn: true,
    keepUpright: true,
    hideCursor: false,
    color: 'currentColor',
    fontSize: 28,
    fontWeight: 600,
    fontFamily: 'inherit',
    class: '',
  });

  const rootRef = useTemplateRef<HTMLElement>('root');
  const layerRef = useTemplateRef<HTMLElement>('layer');
  const motion = usePreferredReducedMotion();

  function settings(): TextCursorSettings {
    return {
      spacing: props.spacing,
      maxPoints: props.maxPoints,
      fontSize: props.fontSize,
      followMouseDirection: props.followMouseDirection,
      randomFloat: props.randomFloat,
      exitDuration: props.exitDuration,
      removalInterval: props.removalInterval,
      shrink: props.shrink,
      fade: props.fade,
      smoothing: props.smoothing,
      popIn: props.popIn,
      keepUpright: props.keepUpright,
    };
  }

  // Ribbon re-measures glyph widths and chain rebuilds its links when these change.
  const layout = computed(() => {
    if (props.mode === 'ribbon') {
      return `${props.spacing}|${props.fontSize}|${props.fontWeight}|${props.fontFamily}`;
    }
    return props.mode === 'chain' ? String(props.maxPoints) : '';
  });

  let dispose: (() => void) | null = null;

  watch(
    [rootRef, layerRef, () => props.mode, () => props.text, layout, motion],
    () => {
      dispose?.();
      dispose = null;
      const root = rootRef.value;
      const layer = layerRef.value;
      if (!root || !layer) return;
      dispose = createTextCursor({
        root,
        layer,
        text: props.text,
        mode: props.mode,
        reduced: motion.value === 'reduce',
        settings,
      });
    },
    { flush: 'post' },
  );

  onBeforeUnmount(() => dispose?.());

  const layerStyle = computed(() => ({
    color: props.color,
    fontSize: `${props.fontSize}px`,
    fontWeight: props.fontWeight,
    fontFamily: props.fontFamily,
  }));
</script>

<template>
  <div
    ref="root"
    :class="['text-cursor', props.class]"
    :style="{ cursor: hideCursor ? 'none' : undefined }"
  >
    <div
      ref="layer"
      class="text-cursor__layer"
      aria-hidden="true"
      :style="layerStyle"
    ></div>
  </div>
</template>

<style scoped>
  .text-cursor {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .text-cursor__layer {
    position: absolute;
    inset: 0;
    overflow: hidden;
    line-height: 1;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .text-cursor__layer :deep(.text-cursor__item) {
    position: absolute;
    top: 0;
    left: 0;
    white-space: pre;
    will-change: transform, opacity;
  }
</style>
