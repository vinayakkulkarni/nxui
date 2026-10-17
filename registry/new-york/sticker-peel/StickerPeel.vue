<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { createStickerPeel } from './create-sticker-peel';
  import type {
    StickerEngine,
    StickerPeelEmits,
    StickerPeelProps,
  } from './types';

  const FINISHES = { gloss: 0, matte: 1, holo: 2 };
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const props = withDefaults(defineProps<StickerPeelProps>(), {
    width: 200,
    rotate: 0,
    peelDirection: 0,
    peelBackHoverPct: 25,
    peelBackActivePct: 40,
    curlRadius: 12,
    finish: 'gloss',
    backColor: '#d4d4d8',
    lightingIntensity: 0.5,
    shadowIntensity: 0.6,
    followPointer: true,
    draggable: true,
    swing: 1,
    friction: 0.5,
    bounce: 0.35,
    intro: true,
    initialPosition: 'center',
    class: '',
  });

  const emit = defineEmits<StickerPeelEmits>();
  const emitDragStart = () => emit('drag-start');
  const emitDragEnd = () => emit('drag-end');

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const hitRef = ref<HTMLDivElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed(() => ({
    imageSrc: props.imageSrc,
    width: Math.max(16, props.width),
    rotate: toRadians(props.rotate),
    peelDirection: toRadians(props.peelDirection),
    hoverPeel: clamp(props.peelBackHoverPct, 0, 100) / 100,
    activePeel: clamp(props.peelBackActivePct, 0, 100) / 100,
    curlRadius: Math.max(2, props.curlRadius),
    finish: FINISHES[props.finish] ?? 0,
    backColor: props.backColor,
    lighting: clamp(props.lightingIntensity, 0, 1),
    shadow: clamp(props.shadowIntensity, 0, 1),
    followPointer: props.followPointer,
    draggable: props.draggable,
    swing: clamp(props.swing, 0, 3),
    friction: clamp(props.friction, 0, 1),
    bounce: clamp(props.bounce, 0, 1),
    intro: props.intro,
    initialPosition: props.initialPosition,
    onDragStart: emitDragStart,
    onDragEnd: emitDragEnd,
    dpr: props.dpr,
    reducedMotion: reducedMotion.value === 'reduce',
  }));

  let engine: StickerEngine | null = null;

  onMounted(() => {
    if (!containerRef.value || !canvasRef.value || !hitRef.value) return;
    engine = createStickerPeel(
      containerRef.value,
      canvasRef.value,
      hitRef.value,
      () => settings.value,
    );
  });

  watch(settings, () => engine?.wake());

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="['sticker-peel', props.class]"
    :style="props.style"
  >
    <canvas ref="canvasRef" class="sticker-peel-canvas" aria-hidden="true" />
    <div ref="hitRef" class="sticker-peel-hit" />
  </div>
</template>

<style scoped>
  .sticker-peel {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
    will-change: transform;
  }

  .sticker-peel-canvas {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .sticker-peel-hit {
    position: absolute;
    left: 50%;
    top: 50%;
    pointer-events: auto;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
</style>
