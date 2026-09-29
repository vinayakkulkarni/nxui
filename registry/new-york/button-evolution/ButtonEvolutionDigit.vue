<script setup lang="ts">
  import type { ButtonEvolutionDigitProps } from './types';

  const props = defineProps<ButtonEvolutionDigitProps>();

  const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
</script>

<template>
  <span class="digit" aria-hidden="true">
    <span
      class="digit__strip"
      :style="{ transform: `translateY(${-props.digit}em)` }"
    >
      <span v-for="d in DIGITS" :key="d" class="digit__cell">{{ d }}</span>
    </span>
  </span>
</template>

<style scoped>
  .digit {
    display: inline-block;
    height: 1em;
    overflow: hidden;
    line-height: 1;
    vertical-align: top;
  }

  .digit__strip {
    display: flex;
    flex-direction: column;
    transition: transform 0.45s cubic-bezier(0.34, 1.3, 0.64, 1);
  }

  .digit__cell {
    height: 1em;
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .digit__strip {
      transition: none;
    }
  }
</style>
