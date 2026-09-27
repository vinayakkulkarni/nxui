<script setup lang="ts">
  import { computed } from 'vue';
  import {
    Chart,
    areaY,
    defineChart,
    lineY,
    scaleLinear,
    scalePoint,
  } from '../chart/chart-backend';
  import { useChartTween } from '../chart/use-chart-tween';
  import type { AreaChartProps } from './types';

  const props = withDefaults(defineProps<AreaChartProps>(), {
    color: 'var(--chart-1)',
    height: 240,
    strokeWidth: 2,
    grid: true,
    axes: true,
    ariaLabel: 'Area chart',
    class: '',
  });

  const progress = useChartTween(1, 1100);

  // A fixed domain keeps the axis still while the values rise into place.
  const domain = computed<[number, number]>(() => [
    Math.min(0, ...props.data.map((d) => d.value)),
    Math.max(1, ...props.data.map((d) => d.value)),
  ]);

  const rows = computed(() =>
    props.data.map((d) => ({
      label: d.label,
      value: d.value * progress.value,
    })),
  );

  const definition = computed(() => {
    const axis: false | undefined = props.axes ? undefined : false;
    return defineChart({
      marks: [
        areaY(rows.value, {
          x: 'label',
          y: 'value',
          fill: props.color,
          fillOpacity: 0.18,
        }),
        lineY(rows.value, {
          x: 'label',
          y: 'value',
          stroke: props.color,
          strokeWidth: props.strokeWidth,
        }),
      ],
      scales: {
        x: { scale: scalePoint, axis },
        y: {
          scale: scaleLinear().domain(domain.value),
          nice: true,
          grid: props.grid,
          axis,
        },
      },
    });
  });
</script>

<template>
  <Chart
    :definition="definition"
    :height="props.height"
    v-bind="{ ariaLabel: props.ariaLabel }"
    :class="`text-muted-foreground ${props.class}`.trim()"
  />
</template>
