<script setup lang="ts">
  import { computed } from 'vue';
  import SegmentDisplay from '../segment-display/SegmentDisplay.vue';
  import type {
    BackupReserveCellKind,
    BackupReserveDisplayProps,
  } from './types';

  const props = defineProps<BackupReserveDisplayProps>();

  const clamp = (v: number): number => Math.min(100, Math.max(0, v));
  const reserveCells = computed(() =>
    Math.round((clamp(props.reserve) / 100) * props.cells),
  );
  const batteryCells = computed(() =>
    Math.round((clamp(props.battery) / 100) * props.cells),
  );
  const usable = computed(() =>
    Math.max(0, Math.round(clamp(props.battery) - clamp(props.reserve))),
  );

  const cellKinds = computed<BackupReserveCellKind[]>(() =>
    Array.from({ length: props.cells }, (_, i) => {
      if (i < reserveCells.value) {
        return i < batteryCells.value ? 'reserved' : 'reserved-empty';
      }
      return i < batteryCells.value ? 'usable' : 'free';
    }),
  );

  function cellStyle(kind: BackupReserveCellKind): Record<string, string> {
    const base: Record<string, string> = {};
    if (kind === 'reserved') {
      base.backgroundColor = props.color;
      base.boxShadow = `0 0 6px color-mix(in oklab, ${props.color} 55%, transparent)`;
    } else if (kind === 'reserved-empty') {
      base.boxShadow = `inset 0 0 0 1px color-mix(in oklab, ${props.color} 55%, transparent)`;
    } else if (kind === 'usable') {
      base.backgroundColor = props.usableColor;
      base.boxShadow = `0 0 6px color-mix(in oklab, ${props.usableColor} 45%, transparent)`;
    }
    return base;
  }

  const usableLeft = computed(() => {
    const start = (reserveCells.value / props.cells) * 100;
    return Math.min(62, Math.max(30, start));
  });
  const showFree = computed(() => props.cells - batteryCells.value >= 4);
</script>

<template>
  <section
    class="rounded-[1.25rem] border border-black/40 bg-[#0d0d0d] px-3.5 pt-3.5 pb-3 text-white shadow-[inset_0_2px_10px_rgb(0_0_0/0.8),0_1px_0_rgb(255_255_255/0.05)] dark:border-white/6"
    :style="{ '--br-accent': props.color, '--br-usable': props.usableColor }"
    aria-label="Reserve"
  >
    <div
      class="flex items-baseline justify-between text-sm tracking-wider text-(--br-accent)/65"
    >
      <span class="uppercase">Reserve</span>
      <span class="tracking-normal tabular-nums">
        ≈ {{ props.hours }} h of essentials
      </span>
    </div>
    <div class="mt-2 flex items-end justify-between gap-3">
      <div class="flex items-end gap-2">
        <SegmentDisplay
          :value="String(Math.round(props.reserve))"
          :digits="2"
          :color="props.color"
          :label="`Reserve ${Math.round(props.reserve)} %`"
          class="text-6xl"
        />
        <span class="pb-1 text-base text-(--br-accent)/80">%</span>
      </div>
      <div class="flex flex-col items-end gap-2 pb-0.5">
        <span class="text-sm tracking-wider text-(--br-accent)/65 uppercase">
          Battery now
        </span>
        <span class="flex items-end gap-1.5">
          <SegmentDisplay
            :value="String(Math.round(props.battery))"
            :digits="2"
            :color="props.usableColor"
            :label="`Battery ${Math.round(props.battery)} %`"
            class="text-3xl"
          />
          <span class="text-base/none text-(--br-usable)/75">%</span>
        </span>
      </div>
    </div>

    <div class="mt-3 flex gap-1" aria-hidden="true">
      <span
        v-for="(kind, i) in cellKinds"
        :key="i"
        class="h-3.5 flex-1 rounded-[3px] bg-white/7 transition-[background-color,box-shadow] duration-200"
        :class="
          props.charging && i === batteryCells - 1 && kind !== 'free'
            ? 'animate-[backup-reserve-blink_1.4s_ease-in-out_infinite] motion-reduce:animate-none'
            : ''
        "
        :style="cellStyle(kind)"
      />
    </div>
    <div
      class="relative mt-2 h-5 text-sm tracking-wider whitespace-nowrap uppercase"
      aria-hidden="true"
    >
      <span class="absolute left-0 text-(--br-accent)/65">Reserved</span>
      <span
        v-if="usable > 0"
        class="absolute text-(--br-usable)/65 transition-[left] duration-200 motion-reduce:transition-none"
        :style="{ left: `${usableLeft}%` }"
      >
        Usable {{ usable }} %
      </span>
      <span v-if="showFree" class="absolute right-0 text-(--br-accent)/40">
        Free
      </span>
    </div>
  </section>
</template>

<style>
  @keyframes backup-reserve-blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.25;
    }
  }
</style>
