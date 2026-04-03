<script setup lang="ts">
  import { motion } from 'motion-v';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      class?: string;
      size?: number;
      duration?: number;
      borderWidth?: number;
      anchor?: number;
      colorFrom?: string;
      colorTo?: string;
      delay?: number;
    }>(),
    {
      class: '',
      size: 200,
      duration: 15,
      borderWidth: 1.5,
      anchor: 90,
      colorFrom: '#ffaa40',
      colorTo: '#9c40ff',
      delay: 0,
    },
  );
</script>

<template>
  <div
    :style="{ '--border-width': `${borderWidth}px` }"
    :class="
      cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] [border:var(--border-width)_solid_transparent]',
        '![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]',
        props.class,
      )
    "
  >
    <component
      :is="motion.div"
      :style="{
        width: `${size}px`,
        height: `${size}px`,
        background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
        offsetPath: `rect(0 auto auto 0 round ${size}px)`,
        offsetAnchor: `${anchor}% 50%`,
      }"
      :initial="{ offsetDistance: '0%' }"
      :animate="{ offsetDistance: '100%' }"
      :transition="{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }"
      class="absolute aspect-square"
    />
  </div>
</template>
