<script setup lang="ts">
  import { computed } from 'vue';
  import {
    Chart,
    areaY,
    defineChart,
    lineY,
    scaleLinear,
  } from '../chart/chart-backend';
  import { useChartTween } from '../chart/use-chart-tween';
  import type { SparklineProps } from './types';

  const props = withDefaults(defineProps<SparklineProps>(), {
    color: 'var(--chart-1)',
    height: 48,
    strokeWidth: 2,
    fill: true,
    ariaLabel: 'Trend',
    class: '',
  });

  const progress = useChartTween(1);

  const domain = computed<[number, number]>(() => {
    const min = Math.min(...props.data);
    const max = Math.max(...props.data);
    return min === max ? [min - 1, max + 1] : [min, max];
  });

  // Values rise from the floor of the domain, which stays fixed while they do.
  const rows = computed(() => {
    const [floor] = domain.value;
    return props.data.map((value, index) => ({
      index,
      value: floor + (value - floor) * progress.value,
    }));
  });

  const definition = computed(() =>
    defineChart({
      marks: [
        areaY(rows.value, {
          x: 'index',
          y: 'value',
          y1: domain.value[0],
          fill: props.color,
          fillOpacity: props.fill ? 0.14 : 0,
        }),
        lineY(rows.value, {
          x: 'index',
          y: 'value',
          stroke: props.color,
          strokeWidth: props.strokeWidth,
        }),
      ],
      scales: {
        x: { scale: scaleLinear, axis: false },
        y: { scale: scaleLinear().domain(domain.value), axis: false },
      },
    }),
  );
</script>

<template>
  <Chart
    :definition="definition"
    :height="props.height"
    v-bind="{ ariaLabel: props.ariaLabel }"
    :class="props.class"
  />
</template>
