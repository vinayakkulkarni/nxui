<script setup lang="ts">
  import { computed } from 'vue';
  import { SCENE } from './device-pairing-scene';
  import type { DevicePairingSceneProps } from './types';

  const props = defineProps<DevicePairingSceneProps>();

  const SLOTS = [0, 1, 2, 3, 4, 5];
  const RINGS = [0, 1, 2];

  const color = computed(() =>
    props.status === 'paired' ? props.successColor : props.accent,
  );

  // Screen-space helpers: u runs along the screen, v runs down.
  function at(u: number, v: number): [number, number] {
    const [cx, cy] = SCENE.screenCenter;
    const [ax, ay] = SCENE.screenAxis;
    return [cx + ax * u, cy + ay * u + v];
  }

  const slots = computed(() =>
    SLOTS.map((i) => {
      const [x, y] = at((i - 2.5) * 5, 0);
      const [x2, y2] = at((i - 2.5) * 5 + 3, 0);
      return { i, x, y, x2, y2, lit: i < props.progress };
    }),
  );

  const check = computed(() =>
    [at(-6, 0), at(-2, 3.5), at(6, -4)]
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' '),
  );
</script>

<template>
  <svg
    :viewBox="SCENE.viewBox"
    class="size-full overflow-visible"
    fill="none"
    stroke-linejoin="round"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <g
      class="fill-neutral-50 stroke-neutral-400 dark:fill-neutral-950 dark:stroke-neutral-500"
      stroke-width="0.9"
    >
      <path v-for="(d, i) in SCENE.faces" :key="`f${i}`" :d="d" />
    </g>
    <g class="stroke-neutral-400/80 dark:stroke-neutral-600" stroke-width="0.7">
      <path v-for="(d, i) in SCENE.lines" :key="`l${i}`" :d="d" />
    </g>
    <path
      :d="SCENE.cable"
      class="stroke-neutral-400 dark:stroke-neutral-500"
      stroke-width="0.9"
    />
    <path
      :d="SCENE.cable"
      :stroke="color"
      stroke-width="1.1"
      stroke-dasharray="2 9"
      class="pairing-flow"
      :class="{ 'pairing-still': !props.animate }"
      :opacity="props.status === 'paired' ? 0.9 : 0.7"
    />

    <g v-if="props.animate && props.status !== 'paired'">
      <ellipse
        v-for="r in RINGS"
        :key="r"
        :cx="SCENE.beacon[0]"
        :cy="SCENE.beacon[1]"
        rx="12"
        ry="5"
        :stroke="color"
        stroke-width="0.7"
        class="pairing-ring"
        :style="{ animationDelay: `${r * 0.8}s` }"
      />
    </g>

    <path
      :d="SCENE.screen"
      :stroke="color"
      stroke-width="1.3"
      class="fill-neutral-900 transition-[stroke] duration-500 dark:fill-black"
      :style="{ filter: `drop-shadow(0 0 3px ${color})` }"
      :class="{ 'pairing-breathe': props.animate && props.status !== 'paired' }"
    />
    <g v-if="props.status === 'paired'">
      <polyline :points="check" :stroke="color" stroke-width="1.6" />
    </g>
    <g v-else>
      <template v-for="s in slots" :key="s.i">
        <circle
          v-if="s.lit"
          :cx="s.x + 1.5"
          :cy="s.y"
          r="1.5"
          :fill="color"
          stroke="none"
        />
        <path
          v-else
          :d="`M${s.x} ${s.y + 1.4} L${s.x2} ${s.y2 + 1.4}`"
          :stroke="color"
          stroke-width="1"
          :class="{ 'pairing-blink': s.i === props.progress && props.animate }"
        />
      </template>
    </g>
  </svg>
</template>

<style scoped>
  .pairing-flow {
    animation: pairing-flow 1.4s linear infinite;
  }
  .pairing-still {
    animation: none;
  }
  .pairing-ring {
    transform-box: fill-box;
    transform-origin: center;
    animation: pairing-ring 2.4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
    opacity: 0;
  }
  .pairing-breathe {
    animation: pairing-breathe 2.4s ease-in-out infinite;
  }
  .pairing-blink {
    animation: pairing-blink 1s steps(2, start) infinite;
  }
  @keyframes pairing-flow {
    to {
      stroke-dashoffset: -22;
    }
  }
  @keyframes pairing-ring {
    0% {
      transform: scale(0.6);
      opacity: 0.8;
    }
    100% {
      transform: scale(4.2);
      opacity: 0;
    }
  }
  @keyframes pairing-breathe {
    50% {
      opacity: 0.7;
    }
  }
  @keyframes pairing-blink {
    to {
      visibility: hidden;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pairing-flow,
    .pairing-ring,
    .pairing-breathe,
    .pairing-blink {
      animation: none;
    }
  }
</style>
