<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { useRafFn } from '@vueuse/core';
  import { pointOnLoop } from './node-canvas-geometry';
  import type { NodeCanvasCursorProps } from './types';

  const props = defineProps<NodeCanvasCursorProps>();

  const progress = ref(0);
  const mounted = ref(false);
  let startedAt = 0;

  const { pause, resume } = useRafFn(
    ({ timestamp }) => {
      if (!startedAt) startedAt = timestamp;
      progress.value =
        (timestamp - startedAt) / (props.cursor.duration ?? 9000);
    },
    { immediate: false },
  );

  onMounted(() => {
    mounted.value = true;
    if (!props.still) resume();
  });

  watch(
    () => props.still,
    (still) => {
      if (still) pause();
      else resume();
    },
  );

  const point = computed(() =>
    pointOnLoop(
      props.cursor.path,
      mounted.value && !props.still ? progress.value : 0,
    ),
  );
</script>

<template>
  <div
    :data-cursor-id="props.cursor.id"
    class="pointer-events-none absolute top-0 left-0 z-20 will-change-transform"
    :style="{ transform: `translate(${point.x}px, ${point.y}px)` }"
  >
    <span
      aria-hidden="true"
      class="block size-4.5 drop-shadow-[0_1px_1px_rgb(0_0_0/0.5)]"
    >
      <span
        class="block size-full [clip-path:polygon(0_0,100%_45%,55%_57%,42%_100%)]"
        :style="{ backgroundColor: props.cursor.color }"
      />
    </span>
    <span
      class="absolute top-4 left-3.5 rounded-lg px-2 py-0.5 text-sm font-medium whitespace-nowrap text-black shadow-md"
      :style="{ backgroundColor: props.cursor.color }"
    >
      {{ props.cursor.name }}
    </span>
  </div>
</template>
