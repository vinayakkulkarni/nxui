<script setup lang="ts">
  // Hand-rolled SVG host mirroring <Chart> from @tanstack/vue-charts: same
  // props, same `ts-chart` class hooks, server-rendered SVG, and responsive
  // width measured from the container.
  import { computed, useTemplateRef } from 'vue';
  import { useElementSize } from '@vueuse/core';
  import { compileScene } from './chart-scene';
  import type { ChartProps } from './types';

  // `class` and `style` are declared props, typed as in TanStack Charts
  // (`class` is a string), so misuse fails here exactly as it would there.
  defineOptions({ inheritAttrs: false });
  const props = defineProps<ChartProps>();

  const host = useTemplateRef<HTMLDivElement>('host');
  const { width: measured } = useElementSize(host);

  const width = computed(() => {
    if (props.width) return props.width;
    if (measured.value > 0) return measured.value;
    return props.initialWidth ?? 300;
  });
  const height = computed(() => {
    if (props.height) return props.height;
    if (props.aspectRatio) return width.value / props.aspectRatio;
    return 240;
  });
  const scene = computed(() =>
    compileScene(props.definition, width.value, height.value),
  );
</script>

<template>
  <div
    ref="host"
    :class="['ts-chart-host', props.class]"
    :style="[
      {
        width: props.width ? `${props.width}px` : '100%',
        height: `${height}px`,
      },
      props.style,
    ]"
  >
    <svg
      class="ts-chart"
      width="100%"
      height="100%"
      :viewBox="`0 0 ${scene.width} ${scene.height}`"
      role="img"
      aria-roledescription="chart"
      :aria-label="props.ariaLabel"
      :aria-description="props.ariaDescription"
      style="display: block; overflow: visible"
    >
      <g class="ts-chart__grid" aria-hidden="true">
        <line
          v-for="line in scene.grid"
          :key="line.key"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          stroke="currentColor"
          stroke-opacity="0.12"
          shape-rendering="crispEdges"
        />
      </g>
      <g class="ts-chart__marks" aria-hidden="true">
        <path
          v-for="path in scene.paths"
          :key="path.key"
          :class="path.className"
          :d="path.d"
          :fill="path.fill"
          :fill-opacity="path.fillOpacity"
          :stroke="path.stroke"
          :stroke-opacity="path.strokeOpacity"
          :stroke-width="path.strokeWidth"
          :stroke-dasharray="path.strokeDasharray"
          :opacity="path.opacity"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      </g>
      <g class="ts-chart__axis" aria-hidden="true">
        <text
          v-for="tick in scene.ticks"
          :key="tick.key"
          :x="tick.x"
          :y="tick.y"
          :text-anchor="tick.anchor"
          fill="currentColor"
          fill-opacity="0.6"
          font-size="11"
        >
          {{ tick.text }}
        </text>
      </g>
    </svg>
  </div>
</template>
