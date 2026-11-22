<script setup lang="ts">
  import { computed } from 'vue';
  import type { AuraSpeedTestSpectrumProps } from './types';

  const props = defineProps<AuraSpeedTestSpectrumProps>();

  const PITCH = 8;

  const width = computed(() => props.levels.length * PITCH);
  const height = computed(() => props.rows * PITCH);
  const rowIndexes = computed(() =>
    Array.from({ length: props.rows }, (_, r) => r),
  );
  const last = computed(() => props.levels.length - 1);

  function cx(col: number): number {
    return col * PITCH + PITCH / 2;
  }

  function cy(row: number): number {
    // Row 0 is the bottom row.
    return (props.rows - row - 1) * PITCH + PITCH / 2;
  }

  function opacity(level: number, row: number): number {
    if (level === 0) return 0.2;
    return row < level ? 0.95 : 0.3;
  }

  function radius(col: number, level: number, row: number): number {
    if (props.highlight && col === last.value && row === level - 1) return 3.2;
    return 1.6;
  }
</script>

<template>
  <svg
    :viewBox="`0 0 ${width} ${height}`"
    class="block h-auto w-full overflow-visible"
    aria-hidden="true"
  >
    <g v-for="(level, col) in props.levels" :key="col">
      <circle
        v-for="row in rowIndexes"
        :key="row"
        :cx="cx(col)"
        :cy="cy(row)"
        :r="radius(col, level, row)"
        fill="currentColor"
        :fill-opacity="opacity(level, row)"
      />
    </g>
  </svg>
</template>
