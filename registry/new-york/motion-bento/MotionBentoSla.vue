<script setup lang="ts">
  import { computed } from 'vue';
  import { motion } from 'motion-v';
  import { useBentoClock } from './use-bento-clock';
  import type { MotionBentoArtProps } from './types';

  const props = withDefaults(defineProps<MotionBentoArtProps>(), {
    playing: false,
    still: false,
  });

  /** One loop is 52 ticks of 100 ms. */
  const LOOP = 52;
  const STILL_TICK = 30;
  const EASE = { duration: 0.55, ease: [0.22, 1, 0.36, 1] };
  const CHIPS = [
    { value: '24/7', label: 'Support', x: 0, y: -74, at: 15 },
    { value: '99.9%', label: 'Uptime', x: -112, y: -36, at: 16 },
    { value: '<1h', label: 'Response', x: 112, y: -36, at: 17 },
  ];

  const tick = useBentoClock(() => props.playing, 100);
  const t = computed(() => (props.still ? STILL_TICK : tick.value % LOOP));
  const closing = computed(() => t.value >= LOOP - 6);
  const open = computed(() => t.value >= 5 && !closing.value);
  const raised = computed(() => t.value >= 9 && !closing.value);
  const checked = computed(() => t.value >= 12 && !closing.value);

  function chipShown(at: number): boolean {
    return t.value >= at && !closing.value;
  }
</script>

<template>
  <div class="absolute inset-0">
    <motion.div
      class="absolute top-30 left-1/2 -ml-35 h-44 w-70"
      :animate="{ y: open ? 0 : 14 }"
      :transition="EASE"
    >
      <!-- back panel + flap (behind the tile) -->
      <svg
        class="absolute inset-0 size-full overflow-visible"
        viewBox="0 0 280 176"
      >
        <rect
          x="0"
          y="0"
          width="280"
          height="176"
          rx="22"
          class="fill-(--mb-tile-soft)"
        />
      </svg>
      <motion.div
        class="absolute inset-x-0 top-0 h-26 origin-top"
        :animate="{ scaleY: open ? -1 : 1 }"
        :transition="{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }"
      >
        <svg
          class="size-full overflow-visible"
          viewBox="0 0 280 104"
          preserveAspectRatio="none"
        >
          <path
            d="M14 0 H266 Q280 0 270 10 L152 98 Q140 107 128 98 L10 10 Q0 0 14 0 Z"
            class="fill-(--mb-tile) stroke-(--mb-line)"
            stroke-width="1"
          />
        </svg>
      </motion.div>

      <!-- the badge -->
      <motion.div
        class="absolute top-0 left-1/2 -mt-12 -ml-10 grid size-20 place-items-center rounded-[1.4rem] p-1"
        :initial="{ y: 70, opacity: 0, scale: 0.8 }"
        :animate="
          raised
            ? { y: 0, opacity: 1, scale: 1 }
            : { y: 70, opacity: 0, scale: 0.8 }
        "
        :transition="{ type: 'spring', stiffness: 220, damping: 20 }"
      >
        <div class="mb-sla-badge grid size-full place-items-center rounded-2xl">
          <svg viewBox="0 0 48 48" class="size-11">
            <motion.path
              d="M12 25 L21 33 L36 15"
              fill="none"
              stroke="white"
              stroke-width="4.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              :initial="{ pathLength: 0 }"
              :animate="{ pathLength: checked ? 1 : 0 }"
              :transition="{ duration: 0.45, ease: 'easeOut' }"
            />
          </svg>
        </div>
      </motion.div>

      <!-- front pocket -->
      <svg
        class="pointer-events-none absolute inset-0 size-full overflow-visible"
        viewBox="0 0 280 176"
      >
        <path
          d="M0 14 L128 96 Q140 104 152 96 L280 14 V154 Q280 176 258 176 H22 Q0 176 0 154 Z"
          class="fill-(--mb-tile) stroke-(--mb-line)"
          stroke-width="1"
        />
        <path
          d="M2 172 L126 108 Q140 101 154 108 L278 172"
          fill="none"
          class="stroke-foreground/6"
          stroke-width="1.5"
        />
      </svg>
    </motion.div>

    <motion.div
      v-for="chip in CHIPS"
      :key="chip.label"
      class="absolute top-1/2 left-1/2 z-10 -mt-3 flex -translate-x-1/2 items-center gap-1 rounded-full bg-(--mb-tile) py-0.5 pr-2 pl-0.5 text-[0.5625rem] font-medium whitespace-nowrap text-foreground shadow-(--mb-tile-shadow) ring-3 ring-(--mb-glass)"
      :initial="{ x: chip.x, y: chip.y + 8, opacity: 0, scale: 0.7 }"
      :animate="{
        x: chip.x,
        y: chipShown(chip.at) ? chip.y : chip.y + 8,
        opacity: chipShown(chip.at) ? 1 : 0,
        scale: chipShown(chip.at) ? 1 : 0.7,
      }"
      :transition="{ type: 'spring', stiffness: 320, damping: 22 }"
    >
      <span
        class="mb-sla-value rounded-full bg-(--mb-tile-soft) px-1.5 py-0.5 font-semibold"
      >
        {{ chip.value }}
      </span>
      {{ chip.label }}
    </motion.div>
  </div>
</template>

<style scoped>
  .mb-sla-badge {
    background: linear-gradient(
      160deg,
      color-mix(in oklab, var(--mb-accent) 45%, white),
      var(--mb-accent)
    );
    box-shadow:
      inset 0 2px 0 rgb(255 255 255 / 0.45),
      inset 0 -6px 12px color-mix(in oklab, var(--mb-accent) 60%, #0b2a55),
      0 18px 30px -12px var(--mb-accent);
  }

  .mb-sla-value {
    color: color-mix(in oklab, var(--mb-accent) 85%, var(--foreground));
  }
</style>
