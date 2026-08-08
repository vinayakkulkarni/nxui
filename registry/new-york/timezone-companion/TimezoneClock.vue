<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import type { TimezoneCity } from './types';
  import { cn } from '~/lib/utils';

  const props = defineProps<{
    cities: TimezoneCity[];
  }>();

  /** Offset from "now", in minutes, driven by the ruler scrub. */
  const scrubMinutes = ref(0);
  const rulerRef = ref<HTMLElement | null>(null);
  const dragging = ref(false);
  let dragStartX = 0;
  let dragStartMinutes = 0;

  const baseNow = new Date();

  const home = computed(() => props.cities[0]!);

  /** Local wall-clock minutes-of-day for a city at the scrubbed instant. */
  function cityMinutes(city: TimezoneCity): number {
    const utcMinutes =
      baseNow.getUTCHours() * 60 + baseNow.getUTCMinutes() + scrubMinutes.value;
    return (((utcMinutes + city.offsetMinutes) % 1440) + 1440) % 1440;
  }

  function timeLabel(city: TimezoneCity): string {
    const m = cityMinutes(city);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
  }

  function phase(city: TimezoneCity): { label: string; icon: string } {
    const h = cityMinutes(city) / 60;
    if (h >= 5 && h < 9)
      return { label: 'BEFORE WORK', icon: 'lucide:sunrise' };
    if (h >= 9 && h < 17) return { label: 'WORKING', icon: 'lucide:sun' };
    if (h >= 17 && h < 21)
      return { label: 'WRAPPING UP', icon: 'lucide:sunset' };
    return { label: 'NIGHT', icon: 'lucide:moon' };
  }

  /** Day relationship vs the home row: YESTERDAY / TOMORROW / ''. */
  function dayRelation(city: TimezoneCity): string {
    const homeM =
      baseNow.getUTCHours() * 60 +
      baseNow.getUTCMinutes() +
      scrubMinutes.value +
      home.value.offsetMinutes;
    const cityM =
      baseNow.getUTCHours() * 60 +
      baseNow.getUTCMinutes() +
      scrubMinutes.value +
      city.offsetMinutes;
    const dayDiff = Math.floor(cityM / 1440) - Math.floor(homeM / 1440);
    if (dayDiff < 0) return 'YESTERDAY';
    if (dayDiff > 0) return 'TOMORROW';
    return '';
  }

  function offsetLabel(city: TimezoneCity): string {
    const diff = city.offsetMinutes - home.value.offsetMinutes;
    if (diff === 0) return '';
    const sign = diff > 0 ? '+' : '-';
    const abs = Math.abs(diff);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return m ? `${sign}${h}H ${m}M` : `${sign}${h}H`;
  }

  const homeDateLabel = computed(() => {
    const d = new Date(
      baseNow.getTime() +
        (scrubMinutes.value + home.value.offsetMinutes) * 60_000,
    );
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
  });

  const utcHeader = computed(() => {
    const m = home.value.offsetMinutes;
    const sign = m >= 0 ? '+' : '-';
    const abs = Math.abs(m);
    return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  });

  const scrubLabel = computed(() => {
    if (scrubMinutes.value === 0) return '';
    const sign = scrubMinutes.value > 0 ? '+' : '-';
    const abs = Math.abs(scrubMinutes.value);
    const h = Math.floor(abs / 60);
    const m = Math.round(abs % 60);
    return `${sign}${h ? `${h}H ` : ''}${m ? `${m}M` : ''}`.trim();
  });

  function onPointerDown(e: PointerEvent) {
    dragging.value = true;
    dragStartX = e.clientX;
    dragStartMinutes = scrubMinutes.value;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging.value || !rulerRef.value) return;
    const rect = rulerRef.value.getBoundingClientRect();
    // full ruler width = 24h
    const perPx = (24 * 60) / rect.width;
    scrubMinutes.value = dragStartMinutes + (e.clientX - dragStartX) * perPx;
  }
  function onPointerUp() {
    dragging.value = false;
  }
  function resetScrub() {
    scrubMinutes.value = 0;
  }

  useEventListener('pointerup', onPointerUp);

  const ticks = 96;
  const scrubFraction = computed(
    () => (((scrubMinutes.value / (24 * 60)) % 1) + 1) % 1,
  );
</script>

<template>
  <div
    class="w-full max-w-sm overflow-hidden rounded-[26px] bg-[#171719] text-zinc-100 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.6)]"
  >
    <!-- ruler header -->
    <div
      ref="rulerRef"
      class="relative h-32 cursor-ew-resize touch-none select-none overflow-hidden"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @dblclick="resetScrub"
    >
      <!-- scrubbed (future) zone tint -->
      <div
        class="absolute inset-y-0 right-0 bg-[#3d2417]/80 transition-opacity"
        :class="scrubMinutes === 0 ? 'opacity-0' : 'opacity-100'"
        :style="{ width: `${(1 - 0.5) * 100}%`, left: '50%' }"
      ></div>
      <div
        class="absolute left-5 top-5 font-mono text-sm tracking-widest text-zinc-300"
      >
        {{ utcHeader }}
      </div>
      <div
        v-show="scrubLabel"
        class="absolute right-5 top-5 font-mono text-sm tracking-widest text-orange-300"
      >
        {{ scrubLabel }}
      </div>
      <!-- center needle -->
      <div
        class="absolute left-1/2 top-0 h-10 w-0.75 -translate-x-1/2 bg-orange-500"
      ></div>
      <!-- tick ruler -->
      <div class="absolute inset-x-0 bottom-0 flex h-14 items-end">
        <div v-for="t in ticks" :key="t" class="flex-1">
          <div
            :class="
              cn(
                'mx-auto w-px',
                (t - 1) % 4 === 0 ? 'h-9' : 'h-5',
                t > ticks / 2 ? 'bg-orange-500/85' : 'bg-zinc-600',
              )
            "
            :style="{
              height: `${((t - 1) % 4 === 0 ? 34 : 18) + Math.sin((t + scrubFraction * ticks) * 1.7) * 4}px`,
            }"
          ></div>
        </div>
      </div>
    </div>

    <!-- city rows -->
    <div class="divide-y divide-white/6">
      <div
        v-for="(city, i) in cities"
        :key="city.name"
        class="flex items-end justify-between px-5 py-4"
        :class="i === 0 ? 'bg-white/3' : ''"
      >
        <div>
          <p class="font-mono text-[10px] tracking-[0.18em] text-zinc-500">
            <template v-if="i === 0">YOUR TIME · {{ homeDateLabel }}</template>
            <template v-else>
              {{ offsetLabel(city) }} / {{ city.zone }}
              <span v-if="dayRelation(city)" class="text-zinc-600">
                · {{ dayRelation(city) }}</span
              >
            </template>
          </p>
          <p class="mt-1 text-2xl font-medium tracking-tight text-zinc-50">
            {{ city.name }}
          </p>
        </div>
        <div class="text-right">
          <p
            class="flex items-center justify-end gap-1.5 font-mono text-[10px] tracking-[0.18em] text-zinc-500"
          >
            {{ phase(city).label }}
            <Icon :name="phase(city).icon" class="size-3 text-zinc-400" />
          </p>
          <p class="mt-1 font-mono text-2xl tabular-nums text-zinc-100">
            {{ timeLabel(city) }}
          </p>
        </div>
      </div>
    </div>

    <!-- footer controls -->
    <div class="flex items-center justify-between px-5 pb-5 pt-2">
      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-full border border-white/12 text-zinc-400 transition-colors hover:text-zinc-100"
        aria-label="Settings"
      >
        <Icon name="lucide:settings" class="size-4.5" />
      </button>
      <div class="flex items-center gap-2.5">
        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-full border border-white/12 text-zinc-400 transition-colors hover:text-zinc-100"
          aria-label="Reset to now"
          @click="resetScrub"
        >
          <Icon name="lucide:locate-fixed" class="size-4.5" />
        </button>
        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-full border border-white/12 text-zinc-400 transition-colors hover:text-zinc-100"
          aria-label="Add city"
        >
          <Icon name="lucide:plus" class="size-4.5" />
        </button>
      </div>
    </div>
  </div>
</template>
