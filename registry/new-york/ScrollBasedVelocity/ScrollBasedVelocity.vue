<script setup lang="ts">
  import { useScroll, useRafFn } from '@vueuse/core';
  import { motion, useMotionValue, useSpring, useTransform } from 'motion-v';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      defaultVelocity?: number;
      class?: string;
    }>(),
    {
      defaultVelocity: 5,
      class: '',
    },
  );

  const repeats = 8;
</script>

<template>
  <section class="relative w-full">
    <ScrollBasedVelocityRow
      :text="text"
      :base-velocity="defaultVelocity"
      :class="props.class"
      :repeats="repeats"
    />
    <ScrollBasedVelocityRow
      :text="text"
      :base-velocity="-defaultVelocity"
      :class="props.class"
      :repeats="repeats"
    />
  </section>
</template>
