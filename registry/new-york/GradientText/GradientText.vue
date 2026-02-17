<script setup lang="ts">
  import { computed } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      colors?: string[];
      speed?: number;
      class?: string;
    }>(),
    {
      colors: () => ['#40ffaa', '#4079ff', '#40ffaa', '#4079ff', '#40ffaa'],
      speed: 8,
      class: '',
    },
  );

  const gradientStyle = computed(() => ({
    backgroundImage: `linear-gradient(to right, ${props.colors.join(', ')})`,
    backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    animationDuration: `${props.speed}s`,
  }));
</script>

<template>
  <span
    :class="
      cn(
        'inline-block animate-[gradient-flow_var(--speed)_linear_infinite]',
        props.class,
      )
    "
    :style="{ ...gradientStyle, '--speed': `${speed}s` }"
  >
    {{ text }}
  </span>
</template>

<style scoped>
  @keyframes gradient-flow {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
</style>
