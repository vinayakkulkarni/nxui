<script setup lang="ts">
  import { cn } from '~/lib/utils';
  import type { CardSwapCardProps } from './types';

  const props = withDefaults(defineProps<CardSwapCardProps>(), {
    class: '',
  });
</script>

<template>
  <div :class="cn('card-swap-card', props.class)">
    <slot />
    <span class="card-swap-card-rim" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .card-swap-card {
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-radius: inherit;
    overflow: hidden;
    isolation: isolate;
    background: var(--swap-tile);
    color: var(--swap-ink);
  }

  .card-swap-card-rim {
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--swap-tile-edge),
      inset 0 1px 0 var(--swap-tile-highlight);
    pointer-events: none;
  }
</style>
