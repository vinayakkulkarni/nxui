<script setup lang="ts">
  import { computed, useId } from 'vue';
  import type { MotionBentoArtProps } from './types';

  const props = withDefaults(defineProps<MotionBentoArtProps>(), {
    playing: false,
    still: false,
  });

  const LINES = [
    'M0 150 H46 L72 124 H140',
    'M400 150 H354 L328 124 H260',
    'M194 0 V46',
    'M206 0 V46',
    'M194 224 V178',
    'M206 224 V178',
  ];
  const BOLT =
    'M60 10 L24 56 Q21 61 27 61 H47 L38 90 Q37 95 41 91 L77 45 Q80 40 74 40 H54 L63 14 Q65 7 60 10 Z';

  const uid = useId();
  const fillId = `mb-bolt-fill-${uid}`;
  const shineId = `mb-bolt-shine-${uid}`;
  const playState = computed(() => ({
    animationPlayState: props.playing ? 'running' : 'paused',
  }));
</script>

<template>
  <div class="absolute inset-0">
    <svg
      class="absolute top-0 left-1/2 -ml-50 h-56 w-100"
      viewBox="0 0 400 224"
      fill="none"
    >
      <path
        v-for="line in LINES"
        :key="line"
        :d="line"
        class="stroke-(--mb-line)"
        stroke-width="1.25"
      />
      <path
        v-for="(line, index) in LINES"
        :key="`pulse-${line}`"
        :d="line"
        pathLength="100"
        class="mb-host-pulse stroke-(--mb-pulse)"
        :style="[playState, { animationDelay: `${index * 0.35}s` }]"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>

    <div
      class="mb-host-halo absolute top-1/2 left-1/2 -mt-19 -ml-19 size-38 rounded-[2.1rem] bg-(--mb-glass) ring-1 ring-(--mb-line)"
      :style="playState"
    />
    <div
      class="absolute top-1/2 left-1/2 -mt-16 -ml-16 grid size-32 place-items-center overflow-hidden rounded-[1.6rem] bg-(--mb-tile) shadow-(--mb-tile-shadow)"
    >
      <svg
        viewBox="0 0 100 100"
        class="mb-host-bolt size-24 overflow-visible"
        :style="playState"
      >
        <defs>
          <linearGradient :id="fillId" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0" style="stop-color: #bfe3ff" />
            <stop offset="0.45" style="stop-color: var(--mb-accent)" />
            <stop
              offset="1"
              style="
                stop-color: color-mix(in oklab, var(--mb-accent) 55%, white);
              "
            />
          </linearGradient>
          <linearGradient :id="shineId" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style="stop-color: white; stop-opacity: 0.85" />
            <stop offset="0.5" style="stop-color: white; stop-opacity: 0" />
          </linearGradient>
        </defs>
        <path :d="BOLT" :fill="`url(#${fillId})`" />
        <path :d="BOLT" :fill="`url(#${shineId})`" opacity="0.6" />
        <path
          :d="BOLT"
          fill="none"
          stroke="white"
          stroke-opacity="0.55"
          stroke-width="1.2"
        />
      </svg>
      <span
        class="mb-host-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-linear-to-r from-transparent via-white/45 to-transparent dark:via-white/15"
        :style="playState"
      />
    </div>
  </div>
</template>

<style scoped>
  .mb-host-pulse {
    stroke-dasharray: 10 100;
    stroke-dashoffset: 110;
    animation: mb-host-flow 2.4s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    filter: drop-shadow(0 0 3px var(--mb-pulse));
  }

  .mb-host-halo {
    animation: mb-host-breathe 2.8s ease-in-out infinite;
  }

  .mb-host-bolt {
    filter: drop-shadow(
      0 10px 10px color-mix(in oklab, var(--mb-accent) 45%, transparent)
    );
    animation: mb-host-float 2.8s ease-in-out infinite;
  }

  .mb-host-shine {
    transform: skewX(-18deg);
    animation: mb-host-sweep 4.2s ease-in-out infinite;
  }

  @keyframes mb-host-flow {
    from {
      stroke-dashoffset: 110;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes mb-host-breathe {
    0%,
    100% {
      transform: scale(0.95);
      opacity: 0.55;
    }
    50% {
      transform: scale(1.03);
      opacity: 1;
    }
  }

  @keyframes mb-host-float {
    0%,
    100% {
      transform: translateY(1px) scale(0.98);
    }
    50% {
      transform: translateY(-2px) scale(1.02);
    }
  }

  @keyframes mb-host-sweep {
    0%,
    55% {
      translate: 0 0;
    }
    100% {
      translate: 480% 0;
    }
  }
</style>
