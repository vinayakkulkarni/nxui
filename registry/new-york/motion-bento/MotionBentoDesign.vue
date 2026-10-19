<script setup lang="ts">
  import { computed } from 'vue';
  import { useBentoClock } from './use-bento-clock';
  import type { MotionBentoArtProps } from './types';

  const props = withDefaults(defineProps<MotionBentoArtProps>(), {
    playing: false,
    still: false,
  });

  const DEPTH = [50, 80, 64, 72, 34, 58];
  const GLOW = [88, 62, 95, 44, 70, 80];
  const TILES = ['type', 'gradient', 'ring', 'pen', 'shapes'];
  const STRIP = [...TILES, ...TILES];
  const SWATCHES = ['bg-violet-500', 'bg-amber-400', 'bg-rose-500'];

  const tick = useBentoClock(() => props.playing, 1300);
  const depth = computed(() => DEPTH[tick.value % DEPTH.length] ?? 50);
  const glow = computed(() => GLOW[tick.value % GLOW.length] ?? 88);
  const playState = computed(() => ({
    animationPlayState: props.playing ? 'running' : 'paused',
  }));
</script>

<template>
  <div class="absolute inset-0">
    <div
      class="absolute inset-y-3 left-1/2 -ml-24 w-48 rounded-3xl bg-(--mb-glass) p-1.5 shadow-(--mb-tile-shadow)"
    >
      <div
        class="flex size-full flex-col rounded-[1.1rem] bg-(--mb-tile) px-3 pt-3"
      >
        <div class="flex justify-between text-[0.5625rem] font-semibold">
          <span class="text-foreground">Depth</span>
          <span class="text-muted-foreground tabular-nums">
            {{ (depth / 10).toFixed(1) }}
          </span>
        </div>
        <div class="relative mt-1.5 h-px bg-foreground/15">
          <div
            class="absolute inset-y-0 left-0 bg-foreground/80 transition-[width] duration-700 ease-out"
            :style="{ width: `${depth}%` }"
          >
            <span
              class="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rounded-full bg-foreground"
            />
          </div>
        </div>
        <div class="mt-3 flex justify-between text-[0.5625rem] font-semibold">
          <span class="text-foreground">Glow</span>
          <span class="text-muted-foreground tabular-nums">{{ glow }}</span>
        </div>
        <div class="relative mt-1.5 h-px bg-foreground/15">
          <div
            class="absolute inset-y-0 left-0 bg-foreground/80 transition-[width] duration-700 ease-out"
            :style="{ width: `${glow}%` }"
          >
            <span
              class="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rounded-full bg-foreground"
            />
          </div>
        </div>
        <div class="mt-auto mb-2.5 flex items-center gap-1.5">
          <div
            class="flex flex-1 items-center gap-1 rounded-full bg-(--mb-tile-soft) p-1"
          >
            <span
              class="size-3 rounded-full border-[3px] border-blue-500 bg-(--mb-tile)"
            />
            <span
              v-for="swatch in SWATCHES"
              :key="swatch"
              :class="['size-3 rounded-full', swatch]"
            />
          </div>
          <div
            class="flex items-center gap-1 rounded-full bg-(--mb-tile-soft) p-1 text-muted-foreground"
          >
            <Icon name="lucide:minus" class="text-xs" />
            <span
              class="grid size-3.5 place-items-center rounded-full bg-(--mb-tile)"
            >
              <Icon name="lucide:plus" class="text-[0.625rem]" />
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute inset-x-0 top-1/2 -mt-6 overflow-hidden py-3">
      <div class="mb-design-strip flex w-max" :style="playState">
        <div v-for="(tile, index) in STRIP" :key="index" class="pr-2.5">
          <div
            class="grid size-15 place-items-center rounded-2xl bg-(--mb-tile) shadow-(--mb-tile-shadow) ring-3 ring-(--mb-glass)"
          >
            <span
              v-if="tile === 'type'"
              class="text-2xl font-semibold tracking-tight text-blue-500"
            >
              Aa
            </span>
            <span
              v-else-if="tile === 'gradient'"
              class="size-11 rounded-xl bg-linear-to-br from-orange-300 via-fuchsia-400 to-blue-500"
            />
            <span
              v-else-if="tile === 'ring'"
              class="grid size-8 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-sky-300"
            >
              <span class="size-3.5 rounded-full bg-(--mb-tile)" />
            </span>
            <span
              v-else-if="tile === 'pen'"
              class="grid size-9 place-items-center rounded-lg bg-yellow-300 text-neutral-900"
            >
              <Icon name="lucide:pen-tool" class="text-xl" />
            </span>
            <Icon
              v-else
              name="lucide:shapes"
              class="text-[1.75rem] text-violet-500"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      class="mb-design-cursor-a absolute top-11 left-1/2 z-10 -ml-20"
      :style="playState"
    >
      <span
        class="mb-design-arrow ml-auto block size-2.5 rotate-90 bg-fuchsia-600"
      />
      <span
        class="block rounded-md bg-fuchsia-600 px-1.5 py-0.5 text-[0.625rem] font-medium whitespace-nowrap text-white"
      >
        Web Design
      </span>
    </div>
    <div
      class="mb-design-cursor-b absolute top-31 left-1/2 z-10 -ml-4"
      :style="playState"
    >
      <span class="mb-design-arrow block size-2.5 bg-sky-500" />
      <span
        class="ml-2 block rounded-md bg-sky-500 px-1.5 py-0.5 text-[0.625rem] font-medium whitespace-nowrap text-white"
      >
        UI/UX Design
      </span>
    </div>
  </div>
</template>

<style scoped>
  .mb-design-strip {
    animation: mb-design-scroll 16s linear infinite;
  }

  .mb-design-arrow {
    clip-path: polygon(0 0, 100% 42%, 52% 54%, 40% 100%);
  }

  .mb-design-cursor-a {
    animation: mb-design-wander-a 7s ease-in-out infinite;
  }

  .mb-design-cursor-b {
    animation: mb-design-wander-b 8.5s ease-in-out infinite;
  }

  @keyframes mb-design-scroll {
    to {
      transform: translateX(-50%);
    }
  }

  @keyframes mb-design-wander-a {
    0%,
    100% {
      transform: translate(0, 0);
    }
    30% {
      transform: translate(44px, -8px);
    }
    55% {
      transform: translate(24px, 14px);
    }
    80% {
      transform: translate(-8px, 6px);
    }
  }

  @keyframes mb-design-wander-b {
    0%,
    100% {
      transform: translate(0, 0);
    }
    25% {
      transform: translate(-46px, 6px);
    }
    50% {
      transform: translate(-20px, -14px);
    }
    75% {
      transform: translate(26px, 4px);
    }
  }
</style>
