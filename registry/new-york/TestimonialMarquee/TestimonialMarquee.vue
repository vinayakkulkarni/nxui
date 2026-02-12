<script setup lang="ts">
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      pauseOnHover?: boolean;
      speed?: number;
      direction?: 'left' | 'right';
      class?: string;
    }>(),
    {
      pauseOnHover: true,
      speed: 40,
      direction: 'left',
      class: '',
    },
  );

  const animationDuration = computed(() => `${props.speed}s`);
  const animationDirection = computed(() =>
    props.direction === 'right' ? 'reverse' : 'normal',
  );
</script>

<template>
  <div
    :class="cn('group flex gap-4 overflow-hidden [--gap:1rem]', props.class)"
  >
    <div
      class="flex shrink-0 animate-marquee items-stretch gap-4"
      :class="{ 'group-hover:[animation-play-state:paused]': pauseOnHover }"
      :style="{ animationDuration, animationDirection }"
    >
      <slot />
    </div>
    <div
      class="flex shrink-0 animate-marquee items-stretch gap-4"
      aria-hidden="true"
      :class="{ 'group-hover:[animation-play-state:paused]': pauseOnHover }"
      :style="{ animationDuration, animationDirection }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
  @keyframes marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(calc(-100% - 1rem));
    }
  }

  .animate-marquee {
    animation: marquee linear infinite;
  }
</style>
