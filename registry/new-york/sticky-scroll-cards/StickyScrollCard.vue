<script setup lang="ts">
  import type { StickyScrollCardProps as Props } from './types';
  import { computed } from 'vue';
  import { motion, useTransform } from 'motion-v';

  const props = defineProps<Props>();

  // Subtle natural tilt cycle
  const CARD_ROTATIONS = [-1.4, 1.0, -0.8, 1.6, -1.1];

  const scale = useTransform(props.progress, props.range, [
    1,
    props.targetScale,
  ]);
  const rotation = computed(
    () => CARD_ROTATIONS[props.i % CARD_ROTATIONS.length] ?? 0,
  );
  const topOffset = computed(() => `calc(-5vh + ${props.i * 22 + 160}px)`);
</script>

<template>
  <div class="sticky top-0 flex h-screen items-center justify-center">
    <motion.div
      :style="{
        scale,
        rotate: rotation,
        top: topOffset,
        borderRadius: '4px',
        boxShadow:
          '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.07), 0 12px 32px rgba(0,0,0,0.10), 0 24px 56px rgba(0,0,0,0.08)',
      }"
      class="relative -top-1/4 origin-top overflow-hidden bg-white"
    >
      <!-- 10px frame on three sides -->
      <div class="p-2.5 pb-0">
        <div class="w-115 overflow-hidden">
          <img
            :src="src"
            :alt="title"
            class="block h-72.5 w-full object-cover"
            draggable="false"
          />
        </div>
      </div>

      <!-- Caption -->
      <div class="flex h-11 items-center justify-center px-4">
        <p
          class="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400"
        >
          {{ title }}
        </p>
      </div>
    </motion.div>
  </div>
</template>
