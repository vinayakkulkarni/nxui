<script setup lang="ts">
  import { computed, ref } from 'vue';
  import type { NodeCanvasBarsProps } from './types';

  const props = withDefaults(defineProps<NodeCanvasBarsProps>(), {
    class: '',
  });

  const WIDTH = 200;
  const HEIGHT = 64;
  const GAP = 4.5;
  const SEGMENT_GAP = 1.5;

  const hovered = ref<number | null>(null);

  const max = computed(() =>
    Math.max(
      1,
      ...props.bars.map((bar) =>
        bar.reduce((sum, segment) => sum + segment.value, 0),
      ),
    ),
  );

  const columns = computed(() => {
    const count = Math.max(1, props.bars.length);
    const barWidth = (WIDTH - GAP * (count - 1)) / count;
    return props.bars.map((bar, i) => {
      const total = bar.reduce((sum, segment) => sum + segment.value, 0);
      let y = HEIGHT;
      const rects = bar.map((segment, j) => {
        const h = Math.max(
          1.5,
          (segment.value / max.value) * HEIGHT - SEGMENT_GAP,
        );
        y -= h + (j === 0 ? 0 : SEGMENT_GAP);
        return { key: j, y, height: h, color: segment.color };
      });
      return {
        index: i,
        x: i * (barWidth + GAP),
        width: barWidth,
        total,
        rects,
      };
    });
  });

  function onEnter(index: number): void {
    hovered.value = index;
  }

  function onLeave(): void {
    hovered.value = null;
  }
</script>

<template>
  <svg
    role="img"
    :aria-label="props.label"
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    preserveAspectRatio="none"
    :class="['block size-full overflow-visible', props.class]"
  >
    <g
      v-for="column in columns"
      :key="column.index"
      :data-bar="column.index"
      class="transition-opacity"
      :opacity="hovered === null || hovered === column.index ? 1 : 0.35"
      @pointerenter="onEnter(column.index)"
      @pointerleave="onLeave"
    >
      <title>{{ `Hour ${column.index + 1}: ${column.total} stops` }}</title>
      <rect
        :x="column.x"
        y="0"
        :width="column.width"
        :height="HEIGHT"
        fill="transparent"
      />
      <rect
        v-for="rect in column.rects"
        :key="rect.key"
        :x="column.x"
        :y="rect.y"
        :width="column.width"
        :height="rect.height"
        rx="1.5"
        :fill="rect.color"
      />
    </g>
  </svg>
</template>
