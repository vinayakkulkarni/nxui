<script setup lang="ts">
  import { computed, useId } from 'vue';
  import { motion } from 'motion-v';
  import { useBentoClock } from './use-bento-clock';
  import type { MotionBentoArtProps, MotionBentoSatellite } from './types';

  const props = withDefaults(defineProps<MotionBentoArtProps>(), {
    playing: false,
    still: false,
  });

  const RADIUS = 84;
  const SATELLITES: MotionBentoSatellite[] = [
    { icon: 'lucide:atom', color: '#0ea5c6', x: 0, y: -RADIUS },
    { icon: 'lucide:leaf', color: '#15803d', x: RADIUS, y: 0 },
    { icon: 'lucide:hexagon', color: '#16a34a', x: 0, y: RADIUS },
    { icon: 'lucide:database', color: '#6366f1', x: -RADIUS, y: 0 },
  ];
  const TURN = { type: 'spring', stiffness: 90, damping: 16, mass: 1 };

  const gradientId = `mb-n-${useId()}`;
  const tick = useBentoClock(() => props.playing, 1500);
  const turn = computed(() => (props.still ? 0 : tick.value * 90));

  function satelliteStyle(satellite: MotionBentoSatellite) {
    return {
      left: `${satellite.x}px`,
      top: `${satellite.y}px`,
      color: satellite.color,
    };
  }
</script>

<template>
  <div class="absolute inset-0">
    <motion.div
      class="absolute top-1/2 left-1/2 size-0"
      :animate="{ rotate: turn }"
      :transition="TURN"
    >
      <span
        class="absolute top-0 -left-21 h-px w-42 bg-(--mb-line)"
        aria-hidden="true"
      />
      <span
        class="absolute -top-21 left-0 h-42 w-px bg-(--mb-line)"
        aria-hidden="true"
      />
      <motion.div
        v-for="satellite in SATELLITES"
        :key="satellite.icon"
        class="absolute -mt-4.5 -ml-4.5 grid size-9 place-items-center rounded-xl bg-(--mb-tile) shadow-(--mb-tile-shadow) ring-3 ring-(--mb-glass)"
        :style="satelliteStyle(satellite)"
        :animate="{ rotate: -turn }"
        :transition="TURN"
      >
        <Icon :name="satellite.icon" class="text-lg" />
      </motion.div>
    </motion.div>

    <div
      class="mb-int-halo absolute top-1/2 left-1/2 -mt-15 -ml-15 size-30 rounded-[1.9rem] bg-(--mb-glass)"
      :class="{ 'mb-int-halo--on': playing }"
    />
    <div
      class="absolute top-1/2 left-1/2 -mt-11 -ml-11 grid size-22 place-items-center rounded-[1.4rem] bg-(--mb-tile) shadow-(--mb-tile-shadow)"
    >
      <svg viewBox="0 0 512 512" class="size-11">
        <defs>
          <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style="stop-color: #7cc4ff" />
            <stop offset="1" style="stop-color: var(--mb-accent)" />
          </linearGradient>
        </defs>
        <path
          d="M168 384V176m0 72a88 88 0 0 1 176 0v136"
          fill="none"
          :stroke="`url(#${gradientId})`"
          stroke-width="64"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
  .mb-int-halo--on {
    animation: mb-int-breathe 3s ease-in-out infinite;
  }

  @keyframes mb-int-breathe {
    0%,
    100% {
      transform: scale(0.94);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.04);
      opacity: 1;
    }
  }
</style>
