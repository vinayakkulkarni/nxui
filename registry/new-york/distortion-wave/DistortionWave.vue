<script setup lang="ts">
  import { computed, nextTick, onMounted, ref, useSlots, watch } from 'vue';
  import { useIdle } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { useWaveEngine } from './use-wave-engine';
  import type {
    DistortionWaveExpose,
    DistortionWavePlayOptions,
    DistortionWaveProps,
  } from './types';

  const props = withDefaults(defineProps<DistortionWaveProps>(), {
    revealed: undefined,
    source: undefined,
    colors: 'prism',
    duration: 1.6,
    returnDuration: 0.9,
    refraction: 1,
    aberration: 1,
    lean: 0.2,
    sparks: true,
    radius: undefined,
    motion: 'auto',
    class: '',
  });

  const emit = defineEmits<{
    'update:revealed': [revealed: boolean];
    start: [revealed: boolean];
    finish: [revealed: boolean];
  }>();

  const slots = useSlots();
  const root = ref<HTMLElement | null>(null);
  const first = ref<HTMLElement | null>(null);
  const next = ref<HTMLElement | null>(null);
  const canvas = ref<HTMLCanvasElement | null>(null);
  const two = computed(() => Boolean(slots.revealed));

  const engine = useWaveEngine(
    props,
    { root, first, next, canvas },
    (revealed) => {
      emit('finish', revealed);
      if (props.revealed !== revealed) emit('update:revealed', revealed);
    },
  );
  const { shown, fading } = engine;

  watch(
    () => props.revealed,
    (value) => {
      if (value === undefined) return;
      emit('start', value);
      void engine.go(value ? 1 : 0);
    },
  );

  const { idle } = useIdle(400);
  onMounted(() => {
    void nextTick(() => engine.prewarm());
  });
  watch(idle, (value) => {
    if (value) engine.prewarm();
  });

  function play(options?: DistortionWavePlayOptions) {
    emit('start', true);
    engine.play(options);
  }

  function reverse() {
    emit('start', false);
    void engine.go(0);
  }

  defineExpose<DistortionWaveExpose>({
    play,
    reverse,
    reset: engine.reset,
    prepare: engine.prepare,
  });

  const layer = 'col-start-1 row-start-1 min-h-0 min-w-0 isolate';
  const fadeClass = computed(() =>
    fading.value ? 'transition-opacity duration-300 ease-out' : '',
  );
  const firstHidden = computed(() => two.value && shown.value === 1);
</script>

<template>
  <div
    ref="root"
    data-distortion-wave=""
    :class="cn('relative grid isolate', props.class)"
  >
    <div
      ref="first"
      data-wave-layer="first"
      :class="[
        layer,
        fadeClass,
        firstHidden && 'pointer-events-none opacity-0',
      ]"
      :inert="firstHidden || undefined"
      :aria-hidden="firstHidden || undefined"
    >
      <slot />
    </div>
    <div
      v-if="two"
      ref="next"
      data-wave-layer="revealed"
      :class="[
        layer,
        fadeClass,
        shown === 0 && 'pointer-events-none opacity-0',
      ]"
      :inert="shown === 0 || undefined"
      :aria-hidden="shown === 0 || undefined"
    >
      <slot name="revealed" />
    </div>
    <canvas
      ref="canvas"
      data-wave-skip=""
      aria-hidden="true"
      class="pointer-events-none absolute z-1 hidden"
    />
    <div
      v-if="$slots.overlay"
      data-wave-skip=""
      class="pointer-events-none relative z-2 col-start-1 row-start-1 min-h-0 min-w-0 *:pointer-events-auto"
    >
      <slot name="overlay" />
    </div>
  </div>
</template>
