<script setup lang="ts">
  import { computed } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      speed?: number;
      enableShadows?: boolean;
      enableOnHover?: boolean;
      class?: string;
    }>(),
    {
      speed: 0.5,
      enableShadows: true,
      enableOnHover: false,
      class: '',
    },
  );

  const cssVars = computed(() => ({
    '--after-duration': `${props.speed * 3}s`,
    '--before-duration': `${props.speed * 2}s`,
    '--after-shadow': props.enableShadows ? '-5px 0 red' : 'none',
    '--before-shadow': props.enableShadows ? '5px 0 cyan' : 'none',
  }));
</script>

<template>
  <div
    :style="cssVars"
    :data-text="text"
    :class="
      cn(
        'glitch-text relative mx-auto cursor-pointer select-none text-[clamp(2rem,10vw,8rem)] font-black text-foreground',
        !enableOnHover && 'glitch-text--active',
        enableOnHover && 'glitch-text--hover',
        props.class,
      )
    "
  >
    {{ text }}
  </div>
</template>

<style scoped>
  .glitch-text::after,
  .glitch-text::before {
    content: attr(data-text);
    position: absolute;
    top: 0;
    color: inherit;
    background-color: var(--background);
    overflow: hidden;
    clip-path: inset(0 0 0 0);
  }

  /* Always-on glitch */
  .glitch-text--active::after {
    left: 10px;
    text-shadow: var(--after-shadow, -10px 0 red);
    animation: glitch-clip var(--after-duration, 3s) infinite linear
      alternate-reverse;
  }
  .glitch-text--active::before {
    left: -10px;
    text-shadow: var(--before-shadow, 10px 0 cyan);
    animation: glitch-clip var(--before-duration, 2s) infinite linear
      alternate-reverse;
  }

  /* Hover-only glitch */
  .glitch-text--hover::after,
  .glitch-text--hover::before {
    content: '';
    opacity: 0;
    animation: none;
  }

  .glitch-text--hover:hover::after {
    content: attr(data-text);
    opacity: 1;
    left: 10px;
    text-shadow: var(--after-shadow, -10px 0 red);
    animation: glitch-clip var(--after-duration, 3s) infinite linear
      alternate-reverse;
  }
  .glitch-text--hover:hover::before {
    content: attr(data-text);
    opacity: 1;
    left: -10px;
    text-shadow: var(--before-shadow, 10px 0 cyan);
    animation: glitch-clip var(--before-duration, 2s) infinite linear
      alternate-reverse;
  }

  @keyframes glitch-clip {
    0% {
      clip-path: inset(20% 0 50% 0);
    }
    5% {
      clip-path: inset(10% 0 60% 0);
    }
    10% {
      clip-path: inset(15% 0 55% 0);
    }
    15% {
      clip-path: inset(25% 0 35% 0);
    }
    20% {
      clip-path: inset(30% 0 40% 0);
    }
    25% {
      clip-path: inset(40% 0 20% 0);
    }
    30% {
      clip-path: inset(10% 0 60% 0);
    }
    35% {
      clip-path: inset(15% 0 55% 0);
    }
    40% {
      clip-path: inset(25% 0 35% 0);
    }
    45% {
      clip-path: inset(30% 0 40% 0);
    }
    50% {
      clip-path: inset(20% 0 50% 0);
    }
    55% {
      clip-path: inset(10% 0 60% 0);
    }
    60% {
      clip-path: inset(15% 0 55% 0);
    }
    65% {
      clip-path: inset(25% 0 35% 0);
    }
    70% {
      clip-path: inset(30% 0 40% 0);
    }
    75% {
      clip-path: inset(40% 0 20% 0);
    }
    80% {
      clip-path: inset(20% 0 50% 0);
    }
    85% {
      clip-path: inset(10% 0 60% 0);
    }
    90% {
      clip-path: inset(15% 0 55% 0);
    }
    95% {
      clip-path: inset(25% 0 35% 0);
    }
    100% {
      clip-path: inset(30% 0 40% 0);
    }
  }
</style>
