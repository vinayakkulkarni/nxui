<script setup lang="ts">
  import { computed } from 'vue';
  import SegmentDisplay from '../segment-display/SegmentDisplay.vue';
  import type { DevicePairingCodeProps } from './types';

  const props = defineProps<DevicePairingCodeProps>();

  const ERROR = '#f87171';

  const cells = computed(() => {
    const half = Math.ceil(props.length / 2);
    const tint = props.status === 'error' ? ERROR : props.accent;
    const done = props.status === 'pairing' || props.status === 'paired';
    return Array.from({ length: props.length }, (_, i) => ({
      i,
      digit: props.code[i] ?? ' ',
      active:
        !done &&
        i === Math.min(props.code.length, props.length - 1) &&
        props.code.length < props.length,
      dash: i === half - 1 && props.length > 3,
      tint,
    }));
  });
</script>

<template>
  <div
    class="flex items-center justify-center gap-1.5 @md:gap-2.5"
    :class="{ 'pairing-shake': props.status === 'error' }"
  >
    <template v-for="cell in cells" :key="cell.i">
      <span
        class="relative grid h-13 w-10.5 place-items-center rounded-xl border bg-neutral-950 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] transition-[border-color,box-shadow] duration-150 @md:h-15 @md:w-12"
        :class="cell.active ? '' : 'border-black dark:border-white/6'"
        :style="
          cell.active
            ? {
                borderColor: cell.tint,
                boxShadow: `0 0 ${props.focused ? 18 : 12}px -2px ${cell.tint}, inset 0 2px 8px rgba(0,0,0,0.9)`,
              }
            : undefined
        "
      >
        <SegmentDisplay
          :value="cell.digit"
          :digits="1"
          :color="cell.tint"
          :ghost="0.13"
          :slant="5"
          class="text-[28px] @md:text-[32px]"
          :label="cell.digit === ' ' ? 'empty' : cell.digit"
        />
        <span
          v-if="cell.active"
          class="pairing-caret absolute bottom-2 left-1/2 h-0.75 w-5 -translate-x-1/2 rounded-full"
          :style="{
            backgroundColor: cell.tint,
            boxShadow: `0 0 8px ${cell.tint}`,
          }"
        />
      </span>
      <span
        v-if="cell.dash"
        class="h-0.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"
        aria-hidden="true"
      />
    </template>
  </div>
</template>

<style scoped>
  .pairing-caret {
    animation: pairing-caret 1.1s steps(2, start) infinite;
  }
  .pairing-shake {
    animation: pairing-shake 0.4s ease-in-out;
  }
  @keyframes pairing-caret {
    to {
      visibility: hidden;
    }
  }
  @keyframes pairing-shake {
    20%,
    60% {
      transform: translateX(-5px);
    }
    40%,
    80% {
      transform: translateX(5px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pairing-caret,
    .pairing-shake {
      animation: none;
    }
  }
</style>
