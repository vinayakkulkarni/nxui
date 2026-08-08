<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import type { TimezoneCity } from './types';

  const props = defineProps<{
    cities: TimezoneCity[];
  }>();

  /** UTC hour under the scrubber, fractional while dragging. */
  const utcHour = ref(11);
  const gridRef = ref<HTMLElement | null>(null);
  const dragging = ref(false);
  const sweeping = ref(false);

  const snapped = computed(() => Math.round(utcHour.value) % 24);

  function cityLocalHour(city: TimezoneCity, utc: number): number {
    return ((((utc * 60 + city.offsetMinutes) / 60) % 24) + 24) % 24;
  }

  function inWork(city: TimezoneCity, utc: number): boolean {
    const h = cityLocalHour(city, utc);
    return h >= city.workStart && h < city.workEnd;
  }

  const workingCount = computed(
    () => props.cities.filter((c) => inWork(c, snapped.value)).length,
  );

  const statusLabel = computed(() => {
    const n = workingCount.value;
    if (n === 0) return 'Off hours everywhere';
    if (n === props.cities.length) return `All ${n} in working hours`;
    const late = props.cities.find(
      (c) => !inWork(c, snapped.value) && cityLocalHour(c, snapped.value) >= 17,
    );
    if (n >= props.cities.length - 1 && late) {
      return `${n} of ${props.cities.length}, late in ${late.name}`;
    }
    return `${n} of ${props.cities.length} in working hours`;
  });

  function localTimeLabel(city: TimezoneCity): string {
    const minutes =
      (((snapped.value * 60 + city.offsetMinutes) % 1440) + 1440) % 1440;
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  function hourFromEvent(e: PointerEvent): number {
    const grid = gridRef.value;
    if (!grid) return utcHour.value;
    const rect = grid.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    return Math.min(23, Math.max(0, (x / rect.width) * 24 - 0.5));
  }

  function onPointerDown(e: PointerEvent) {
    dragging.value = true;
    sweeping.value = false;
    utcHour.value = hourFromEvent(e);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging.value) return;
    utcHour.value = hourFromEvent(e);
  }
  function onPointerUp() {
    dragging.value = false;
    utcHour.value = Math.round(utcHour.value);
  }

  const bestHour = computed(() => {
    let best = 0;
    let bestCount = -1;
    for (let h = 0; h < 24; h++) {
      const count = props.cities.filter((c) => inWork(c, h)).length;
      if (count > bestCount) {
        bestCount = count;
        best = h;
      }
    }
    return best;
  });

  function findBestTime() {
    const from = utcHour.value;
    const to = bestHour.value;
    if (Math.round(from) === to) return;
    sweeping.value = true;
    const start = performance.now();
    const duration = 900;
    const delta = to - from;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      utcHour.value = from + delta * eased;
      if (t < 1 && sweeping.value) requestAnimationFrame(tick);
      else {
        utcHour.value = to;
        sweeping.value = false;
      }
    };
    requestAnimationFrame(tick);
  }

  useEventListener('pointerup', onPointerUp);

  const scrubberLeft = computed(
    () => `${(((utcHour.value + 0.5) / 24) * 100).toFixed(3)}%`,
  );
</script>

<template>
  <div
    class="w-full max-w-lg rounded-[28px] bg-zinc-100 p-3 shadow-[0_18px_50px_-18px_rgba(30,30,60,0.3)] dark:bg-zinc-900"
  >
    <!-- header -->
    <div class="flex items-center justify-between px-3 pb-3 pt-1.5">
      <p class="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Meeting Finder
      </p>
      <span
        class="rounded-full bg-zinc-200 px-2.5 py-1 font-mono text-xs tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
      >
        {{ String(snapped).padStart(2, '0') }}:00 UTC
      </span>
    </div>

    <!-- grid card -->
    <div class="rounded-3xl bg-white p-4 dark:bg-zinc-950">
      <!-- hour axis -->
      <div
        class="mb-1.5 ml-28 mr-12 flex justify-between font-mono text-[9px] text-zinc-400"
      >
        <span>00</span><span>06</span><span>12</span><span>18</span
        ><span>UTC</span>
      </div>

      <div class="relative">
        <!-- city rows -->
        <div class="space-y-3.5">
          <div
            v-for="city in cities"
            :key="city.name"
            class="flex items-center gap-3"
          >
            <div class="w-25 shrink-0">
              <p
                class="flex items-center gap-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-100"
              >
                <span
                  class="size-1.5 rounded-full"
                  :style="{ backgroundColor: city.color }"
                ></span>
                {{ city.name }}
              </p>
              <p class="pl-3 font-mono text-[9px] uppercase text-zinc-400">
                {{ city.zone }}
              </p>
            </div>
            <div ref="gridRef" class="flex flex-1 gap-0.75">
              <div
                v-for="h in 24"
                :key="h"
                class="h-7 flex-1 rounded-[5px] transition-colors duration-200"
                :class="!inWork(city, h - 1) && 'bg-zinc-100 dark:bg-zinc-800'"
                :style="
                  inWork(city, h - 1)
                    ? {
                        backgroundColor: city.color,
                        opacity: h - 1 === snapped ? 1 : 0.82,
                      }
                    : undefined
                "
              ></div>
            </div>
            <span
              class="w-10 text-right font-mono text-[10px] tabular-nums"
              :class="
                inWork(city, snapped)
                  ? 'font-semibold text-orange-500'
                  : 'text-zinc-400'
              "
            >
              {{ localTimeLabel(city) }}
            </span>
          </div>
        </div>

        <!-- scrubber -->
        <div
          class="absolute inset-y-0 left-28 right-12 cursor-ew-resize touch-none"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
        >
          <div
            class="pointer-events-none absolute -inset-y-1.5 w-4 -translate-x-1/2 rounded-lg border-2 border-zinc-900 bg-transparent transition-transform dark:border-zinc-100"
            :style="{ left: scrubberLeft }"
          >
            <span
              class="absolute -top-3 left-1/2 h-1.5 w-4 -translate-x-1/2 rounded-full bg-zinc-900 dark:bg-zinc-100"
            ></span>
          </div>
        </div>
      </div>
    </div>

    <!-- footer -->
    <div class="flex items-center justify-between px-3 pb-1.5 pt-3">
      <p
        class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"
      >
        <span class="size-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
        {{ statusLabel }}
      </p>
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-900"
        @click="findBestTime"
      >
        <Icon name="lucide:clock" class="size-3.5" />
        Find best time
      </button>
    </div>
  </div>
</template>
