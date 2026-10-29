<script setup lang="ts">
  // Vue port of Magnify from Pin UI (https://pinui.xyz), MIT licence.
  import { computed } from 'vue';
  import { GLYPH_SIZE, H, MICRO_SIZE, W, baseline } from './magnify-data';
  import type { MagnifyMicroProps } from './types';

  /* What the lens sees: rows of micro-type, clipped to the big letter. */
  const props = defineProps<MagnifyMicroProps>();

  const rowH = MICRO_SIZE * 0.93;
  const rows = Math.ceil(H / rowH) + 1;
  const rowYs = Array.from({ length: rows }, (_, i) => (i + 1) * rowH);

  const line = computed(() => {
    const perRow = Math.ceil(W / (MICRO_SIZE * 0.5 * props.micro.length)) + 2;
    return props.micro.repeat(perRow);
  });
</script>

<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    :width="W"
    :height="H"
    class="pmag__micro"
    aria-hidden="true"
  >
    <defs>
      <clipPath :id="clipId">
        <text
          :x="W / 2"
          :y="baseline(GLYPH_SIZE)"
          text-anchor="middle"
          class="pmag__glyph-shape"
        >
          {{ glyph }}
        </text>
      </clipPath>
    </defs>
    <rect :width="W" :height="H" :style="{ fill: paper }" class="pmag__fade" />
    <g
      :clip-path="`url(#${clipId})`"
      :style="{ fill: ink }"
      class="pmag__microText pmag__fade"
    >
      <text v-for="(y, i) in rowYs" :key="i" :x="-(i % 3) * 0.9" :y="y">
        {{ line }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
  .pmag__micro {
    display: block;
  }

  .pmag__glyph-shape {
    font-family: inherit;
    font-size: 500px;
    font-weight: 700;
  }

  .pmag__microText {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 5.6px;
  }

  .pmag__fade {
    transition: fill 0.45s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    .pmag__fade {
      transition: none;
    }
  }
</style>
