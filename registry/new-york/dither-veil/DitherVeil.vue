<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { cn } from '~/lib/utils';
  import { createDitherVeil, DEFAULT_SRC } from './dither-veil';
  import type {
    DitherVeilEngine,
    DitherVeilProps,
    DitherVeilSettings,
  } from './types';

  const props = withDefaults(defineProps<DitherVeilProps>(), {
    src: DEFAULT_SRC,
    fit: 'contain',
    pattern: 'floyd',
    pixelSize: 2,
    levels: 2,
    palette: 'duotone',
    inkColor: '#120f17',
    paperColor: '#f4f1ea',
    contrast: 1.15,
    brightness: 0,
    revealRadius: 200,
    softness: 0.6,
    linger: 1,
    rimColor: '#a78bfa',
    rim: 0,
    reverse: false,
    wander: false,
    clickBurst: true,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);

  const settings = computed<DitherVeilSettings>(() => ({
    src: props.src,
    fit: props.fit,
    pattern: props.pattern,
    pixelSize: props.pixelSize,
    levels: props.levels,
    palette: props.palette,
    inkColor: props.inkColor,
    paperColor: props.paperColor,
    contrast: props.contrast,
    brightness: props.brightness,
    revealRadius: props.revealRadius,
    softness: props.softness,
    linger: props.linger,
    rimColor: props.rimColor,
    rim: props.rim,
    reverse: props.reverse,
    wander: props.wander,
    clickBurst: props.clickBurst,
  }));

  let engine: DitherVeilEngine | null = null;

  function getSettings(): DitherVeilSettings {
    return settings.value;
  }

  function mount() {
    engine?.destroy();
    engine = containerRef.value
      ? createDitherVeil(containerRef.value, getSettings)
      : null;
  }

  onMounted(mount);

  watch(
    () => props.src,
    () => mount(),
  );
  watch(settings, () => engine?.wake());

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div ref="containerRef" :class="cn('dither-veil', props.class)" />
</template>

<style scoped>
  .dither-veil {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    touch-action: pan-y;
  }
</style>
