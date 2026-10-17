<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createGlareEngine, glareGradient } from './glare-engine';
  import type { GlareEngine, GlareHoverProps, GlareSettings } from './types';

  const props = withDefaults(defineProps<GlareHoverProps>(), {
    width: 'auto',
    height: 'auto',
    background: 'transparent',
    borderRadius: '10px',
    borderColor: 'transparent',
    glareColor: '#ffffff',
    glareOpacity: 0.5,
    glareAngle: -45,
    glareSize: 30,
    softness: 0.6,
    variant: 'streak',
    blendMode: 'screen',
    rimGlint: true,
    mode: 'hover',
    transitionDuration: 650,
    interval: 3,
    playOnce: false,
    intro: false,
    class: '',
  });

  const rootRef = ref<HTMLDivElement>();
  const glareRef = ref<HTMLSpanElement>();
  const bandRef = ref<HTMLSpanElement>();
  const rimRef = ref<HTMLSpanElement>();
  const reducedMotion = usePreferredReducedMotion();
  let engine: GlareEngine | null = null;

  function settings(): GlareSettings {
    return {
      glareAngle: props.glareAngle,
      glareSize: props.glareSize,
      transitionDuration: props.transitionDuration,
      interval: props.interval,
      playOnce: props.playOnce,
      intro: props.intro,
      reduce: reducedMotion.value === 'reduce',
    };
  }

  function bands(): HTMLElement[] {
    const list: HTMLElement[] = [];
    if (bandRef.value) list.push(bandRef.value);
    if (rimRef.value) list.push(rimRef.value);
    return list;
  }

  function build() {
    engine?.destroy();
    engine = null;
    if (!rootRef.value || !glareRef.value) return;
    engine = createGlareEngine(
      { root: rootRef.value, glare: glareRef.value, bands },
      props.mode,
      settings,
    );
  }

  onMounted(build);
  watch([() => props.mode, reducedMotion], build);
  watch(
    [() => props.glareAngle, () => props.glareSize, () => props.rimGlint],
    () => engine?.measure(),
    { flush: 'post' },
  );
  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  const glare = computed(() =>
    glareGradient(
      props.glareColor,
      props.glareOpacity,
      props.variant,
      props.softness,
    ),
  );
  const rim = computed(() =>
    glareGradient(
      props.glareColor,
      Math.min(1, props.glareOpacity * 1.8),
      props.variant,
      props.softness,
    ),
  );
  const cssVars = computed(() => ({
    '--gh-width': props.width,
    '--gh-height': props.height,
    '--gh-bg': props.background,
    '--gh-br': props.borderRadius,
    '--gh-border': props.borderColor,
    '--gh-glare': glare.value,
    '--gh-rim': rim.value,
    '--gh-blend': props.blendMode,
  }));
</script>

<template>
  <div ref="rootRef" :class="cn('glare-hover', props.class)" :style="cssVars">
    <slot></slot>
    <span ref="glareRef" class="glare-hover__glare" aria-hidden="true">
      <span ref="bandRef" class="glare-hover__band"></span>
      <span v-if="rimGlint" class="glare-hover__rim">
        <span
          ref="rimRef"
          class="glare-hover__band glare-hover__band--rim"
        ></span>
      </span>
    </span>
  </div>
</template>

<style scoped>
  .glare-hover {
    position: relative;
    display: inline-grid;
    vertical-align: top;
    place-items: center;
    width: var(--gh-width);
    height: var(--gh-height);
    background: var(--gh-bg);
    border: 1px solid var(--gh-border);
    border-radius: var(--gh-br);
    overflow: hidden;
    isolation: isolate;
  }

  .glare-hover__glare {
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: inherit;
    opacity: 0;
    mix-blend-mode: var(--gh-blend);
    pointer-events: none;
  }

  .glare-hover__band {
    position: absolute;
    top: 50%;
    left: 50%;
    background: var(--gh-glare);
    will-change: transform;
  }

  .glare-hover__rim {
    position: absolute;
    inset: 0;
    padding: 1px;
    border-radius: inherit;
    -webkit-mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
    -webkit-mask-clip: content-box, border-box;
    -webkit-mask-composite: xor;
    mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
    mask-clip: content-box, border-box;
    mask-composite: exclude;
  }

  .glare-hover__band--rim {
    background: var(--gh-rim);
  }
</style>
