<script setup lang="ts">
  import { computed } from 'vue';
  import type {
    PatternDonutPatternKind,
    PatternDonutPatternProps,
  } from './types';

  const props = withDefaults(defineProps<PatternDonutPatternProps>(), {
    size: 5.5,
    tint: 0.14,
  });

  // Dots and checker read better on a slightly larger tile than lines.
  const SCALE: Record<PatternDonutPatternKind, number> = {
    lines: 1,
    dots: 1.15,
    checker: 1.35,
    crosshatch: 1.2,
    grid: 1.2,
    stripes: 1,
  };
  const tile = computed(() => props.size * SCALE[props.kind]);
  const half = computed(() => tile.value / 2);
  const line = computed(() => tile.value * 0.36);
  const rotated = computed(
    () =>
      props.kind === 'lines' ||
      props.kind === 'checker' ||
      props.kind === 'crosshatch',
  );
</script>

<template>
  <pattern
    :id="props.id"
    patternUnits="userSpaceOnUse"
    :width="tile"
    :height="tile"
    :patternTransform="rotated ? 'rotate(-45)' : undefined"
  >
    <rect
      :width="tile"
      :height="tile"
      :fill="props.color"
      :fill-opacity="props.tint"
    />
    <template v-if="props.kind === 'lines'">
      <rect :width="line" :height="tile" :fill="props.color" />
    </template>
    <template v-else-if="props.kind === 'dots'">
      <circle :cx="half" :cy="half" :r="tile * 0.2" :fill="props.color" />
    </template>
    <template v-else-if="props.kind === 'checker'">
      <rect :width="half" :height="half" :fill="props.color" />
      <rect
        :x="half"
        :y="half"
        :width="half"
        :height="half"
        :fill="props.color"
      />
    </template>
    <template v-else-if="props.kind === 'crosshatch'">
      <rect :width="line" :height="tile" :fill="props.color" />
      <rect :width="tile" :height="line" :fill="props.color" />
    </template>
    <template v-else-if="props.kind === 'grid'">
      <rect :width="line * 0.7" :height="tile" :fill="props.color" />
      <rect :width="tile" :height="line * 0.7" :fill="props.color" />
    </template>
    <template v-else>
      <rect :width="tile" :height="line" :fill="props.color" />
    </template>
  </pattern>
</template>
