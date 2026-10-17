<script setup lang="ts">
  import { onBeforeUnmount, ref, watch } from 'vue';
  import { animate } from 'motion-v';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { ARROW_UP, EASE_IN_OUT, SQUARE, pathAt } from './prompt-bar';
  import type { PromptBarGlyphProps } from './types';

  const props = defineProps<PromptBarGlyphProps>();

  const motion = usePreferredReducedMotion();
  const svgRef = ref<SVGSVGElement | null>(null);
  const pathRef = ref<SVGPathElement | null>(null);
  const initial = props.busy ? 1 : 0;
  const d = ref(pathAt(ARROW_UP, SQUARE, initial));
  let t = initial;
  let dir = props.busy ? 1 : -1;
  let controls: { stop: () => void } | null = null;

  function apply(v: number) {
    t = v;
    pathRef.value?.setAttribute('d', pathAt(ARROW_UP, SQUARE, v));
    const reduce = motion.value === 'reduce';
    const goo = reduce ? 0 : Math.sin(v * Math.PI);
    const sx = 1 - props.squash * goo;
    if (svgRef.value) {
      svgRef.value.style.transform = goo
        ? `rotate(${dir * props.tilt * goo}deg) scale(${sx}, ${1 / sx})`
        : '';
    }
  }

  watch(
    () => props.busy,
    (busy) => {
      const target = busy ? 1 : 0;
      dir = busy ? 1 : -1;
      controls?.stop();
      controls = null;
      if (t === target) return;
      if (motion.value === 'reduce') {
        apply(target);
        return;
      }
      controls = animate(t, target, {
        duration: props.morphDuration / 1000,
        ease: EASE_IN_OUT,
        onUpdate: apply,
      });
    },
  );

  onBeforeUnmount(() => controls?.stop());
</script>

<template>
  <svg
    ref="svgRef"
    class="prompt-bar__glyph"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="2"
    stroke-linejoin="round"
  >
    <path ref="pathRef" :d="d" />
  </svg>
</template>

<style scoped>
  .prompt-bar__glyph {
    display: block;
    width: 16px;
    height: 16px;
    transform-origin: 50% 50%;
  }
</style>
