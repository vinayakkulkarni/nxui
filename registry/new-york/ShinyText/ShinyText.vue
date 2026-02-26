<script setup lang="ts">
  import { computed } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      disabled?: boolean;
      speed?: number;
      class?: string;
    }>(),
    {
      disabled: false,
      speed: 5,
      class: '',
    },
  );

  const animationDuration = computed(() => `${props.speed}s`);
</script>

<template>
  <span
    :class="
      cn(
        'shiny-text inline-block bg-clip-text text-transparent bg-[length:200%_100%]',
        !disabled && 'animate-[shiny-sweep_var(--shiny-speed)_linear_infinite]',
        props.class,
      )
    "
    :style="{
      '--shiny-speed': animationDuration,
    }"
  >
    {{ text }}
  </span>
</template>

<style scoped>
  @keyframes shiny-sweep {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .shiny-text {
    animation: shiny-sweep var(--shiny-speed, 5s) linear infinite;
  }

  :root {
    .shiny-text {
      background-image: linear-gradient(
        120deg,
        oklch(0.3 0 0) 40%,
        oklch(0.7 0 0) 50%,
        oklch(0.3 0 0) 60%
      );
    }
  }

  .dark .shiny-text {
    background-image: linear-gradient(
      120deg,
      oklch(0.6 0 0) 40%,
      oklch(1 0 0) 50%,
      oklch(0.6 0 0) 60%
    );
  }
</style>
