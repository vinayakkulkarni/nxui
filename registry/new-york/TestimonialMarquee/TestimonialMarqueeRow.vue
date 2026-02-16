<script setup lang="ts">
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      direction?: 'left' | 'right';
      speed?: number;
      class?: string;
      pauseOnHover?: boolean;
    }>(),
    {
      direction: 'left',
      speed: 40,
      class: '',
      pauseOnHover: true,
    },
  );

  const durationStyle = computed(() => ({ '--duration': `${props.speed}s` }));
  const animClass = computed(() =>
    props.direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right',
  );
  const hoverClass = computed(() =>
    props.pauseOnHover ? 'group-hover:[animation-play-state:paused]' : '',
  );
</script>

<template>
  <div :class="cn('group flex overflow-hidden p-2 [--gap:1rem]', props.class)">
    <div
      :class="cn('flex shrink-0 justify-start [gap:var(--gap)] min-w-full pr-[var(--gap)] will-change-transform [backface-visibility:hidden]', animClass, hoverClass)"
      :style="durationStyle"
    >
      <slot />
    </div>
    <div
      aria-hidden="true"
      :class="cn('flex shrink-0 justify-start [gap:var(--gap)] min-w-full pr-[var(--gap)] will-change-transform [backface-visibility:hidden]', animClass, hoverClass)"
      :style="durationStyle"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
  @keyframes marquee-left {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(-100%, 0, 0); }
  }
  @keyframes marquee-right {
    from { transform: translate3d(-100%, 0, 0); }
    to { transform: translate3d(0, 0, 0); }
  }
  .animate-marquee-left {
    animation: marquee-left var(--duration) linear infinite;
  }
  .animate-marquee-right {
    animation: marquee-right var(--duration) linear infinite;
  }
</style>
