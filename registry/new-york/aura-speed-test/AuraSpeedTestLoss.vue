<script setup lang="ts">
  import type { AuraSpeedTestLossProps } from './types';

  const props = defineProps<AuraSpeedTestLossProps>();

  const PITCH = 10;

  function cx(i: number): number {
    return (i % 10) * PITCH + PITCH / 2;
  }

  function cy(i: number): number {
    return Math.floor(i / 10) * PITCH + PITCH / 2;
  }

  function arrived(rank: number): boolean {
    return rank < props.received;
  }
</script>

<template>
  <svg
    viewBox="0 0 100 100"
    class="block size-full overflow-visible"
    aria-hidden="true"
  >
    <circle
      v-for="(dot, i) in props.dots"
      :key="i"
      :cx="cx(i)"
      :cy="cy(i)"
      r="2.3"
      :fill="dot.lost && arrived(dot.rank) ? 'none' : 'currentColor'"
      stroke="currentColor"
      :stroke-width="dot.lost && arrived(dot.rank) ? 0.7 : 0"
      :fill-opacity="
        !arrived(dot.rank) ? 0.18 : dot.late ? 0.5 : dot.lost ? 0 : 0.92
      "
      :stroke-opacity="dot.lost && arrived(dot.rank) ? 0.85 : 0"
    />
  </svg>
</template>
