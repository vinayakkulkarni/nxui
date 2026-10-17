<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createFadeEngine } from './fade-engine';
  import type { FadeContentProps } from './types';

  const props = withDefaults(defineProps<FadeContentProps>(), {
    container: null,
    effect: 'fade',
    blur: false,
    duration: 1,
    ease: 'power2.out',
    delay: 0,
    threshold: 0.1,
    initialOpacity: 0,
    stagger: 0,
    staggerFrom: 'start',
    trigger: 'scroll',
    once: true,
    exit: false,
    scrub: false,
    disappearAfter: 0,
    disappearDuration: 0.5,
    disappearEase: 'power2.in',
    class: '',
  });

  const emit = defineEmits<{
    start: [];
    complete: [];
    'disappearance-complete': [];
  }>();

  const rootRef = ref<HTMLDivElement>();
  const reducedMotion = usePreferredReducedMotion();
  let cleanup: (() => void) | null = null;

  function resolveScroller(): HTMLElement | null {
    const source = props.container;
    if (!source) return null;
    if (typeof source === 'string') {
      const found = document.querySelector(source);
      return found instanceof HTMLElement ? found : null;
    }
    return source;
  }

  function setup() {
    cleanup?.();
    cleanup = null;
    const el = rootRef.value;
    if (!el) return;
    cleanup = createFadeEngine({
      el,
      scroller: resolveScroller(),
      effect: props.effect,
      blur: props.blur === true ? 10 : Math.max(Number(props.blur) || 0, 0),
      duration: props.duration,
      ease: props.ease,
      delay: props.delay,
      threshold: props.threshold,
      initialOpacity: props.initialOpacity,
      stagger: props.stagger,
      staggerFrom: props.staggerFrom,
      trigger: props.trigger,
      once: props.once,
      exit: props.exit,
      scrub: props.scrub,
      disappearAfter: props.disappearAfter,
      disappearDuration: props.disappearDuration,
      disappearEase: props.disappearEase,
      reduce: reducedMotion.value === 'reduce',
      onStart: () => emit('start'),
      onComplete: () => emit('complete'),
      onDisappearanceComplete: () => emit('disappearance-complete'),
    });
  }

  onMounted(setup);

  watch(
    [
      () => props.container,
      () => props.effect,
      () => props.blur,
      () => props.duration,
      () => props.ease,
      () => props.delay,
      () => props.threshold,
      () => props.initialOpacity,
      () => props.stagger,
      () => props.staggerFrom,
      () => props.trigger,
      () => props.once,
      () => props.exit,
      () => props.scrub,
      () => props.disappearAfter,
      () => props.disappearDuration,
      () => props.disappearEase,
      reducedMotion,
    ],
    setup,
    { flush: 'post' },
  );

  onBeforeUnmount(() => {
    cleanup?.();
    cleanup = null;
  });
</script>

<template>
  <div ref="rootRef" :class="cn(props.class)" style="visibility: hidden">
    <slot></slot>
  </div>
</template>
