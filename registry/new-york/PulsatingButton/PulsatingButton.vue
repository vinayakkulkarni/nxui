<script setup lang="ts">
  import { cn } from '~/lib/utils';

  withDefaults(
    defineProps<{
      pulseColor?: string;
      duration?: string;
      class?: string;
    }>(),
    {
      pulseColor: '#0096ff',
      duration: '1.5s',
      class: '',
    },
  );
</script>

<template>
  <button
    :class="
      cn(
        'relative inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground',
        $props.class,
      )
    "
    :style="{
      '--pulse-color': pulseColor,
      '--duration': duration,
    }"
  >
    <div class="relative z-10">
      <slot>Pulsating Button</slot>
    </div>
    <div
      class="absolute left-1/2 top-1/2 size-full -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-lg bg-inherit"
    ></div>
  </button>
</template>

<style scoped>
  button::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    background: var(--pulse-color);
    opacity: 0;
    animation: pulse-ring var(--duration) cubic-bezier(0.215, 0.61, 0.355, 1)
      infinite;
  }

  @keyframes pulse-ring {
    0% {
      opacity: 0.5;
      transform: scale(0.95);
    }
    100% {
      opacity: 0;
      transform: scale(1.05);
    }
  }
</style>
