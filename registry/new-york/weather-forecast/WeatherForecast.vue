<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
  import { motion } from 'motion-v';
  import type { WeatherDay } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      city?: string;
      days?: WeatherDay[];
      unit?: 'f' | 'c';
      autoplayInterval?: number;
      class?: string;
    }>(),
    {
      city: 'Chicago',
      days: () => [
        { day: 'Mon', date: 3, condition: 'Sunny', temp: 97 },
        { day: 'Tue', date: 4, condition: 'Partly cloudy', temp: 92 },
        { day: 'Wed', date: 5, condition: 'Cloudy', temp: 79 },
        { day: 'Thu', date: 6, condition: 'Rain', temp: 72 },
        { day: 'Fri', date: 7, condition: 'Sunny', temp: 85 },
      ],
      unit: 'f',
      autoplayInterval: 3200,
      class: '',
    },
  );

  const emit = defineEmits<{
    change: [day: WeatherDay, index: number];
  }>();

  const active = ref(1);
  const unit = ref<'f' | 'c'>(props.unit);
  const current = computed(() => props.days[active.value]!);

  const monthName = 'Aug';

  const conditionIcon: Record<string, string> = {
    Sunny: 'lucide:sun',
    'Partly cloudy': 'lucide:cloud-sun',
    Cloudy: 'lucide:cloud',
    Rain: 'lucide:cloud-rain',
    Snow: 'lucide:snowflake',
    Storm: 'lucide:cloud-lightning',
  };

  /**
   * Orb color is driven by TEMPERATURE, not by condition — the reference
   * sweeps hot orange → amber → neutral grey → cool blue as the temp falls,
   * so two different days that share a condition still look different.
   * Stops are [tempF, coreRGB, rimRGB].
   */
  const ORB_STOPS: [
    number,
    [number, number, number],
    [number, number, number],
  ][] = [
    [105, [236, 143, 32], [248, 191, 108]],
    [97, [226, 124, 28], [243, 176, 90]],
    [92, [122, 61, 32], [232, 163, 75]],
    [86, [108, 74, 50], [214, 170, 118]],
    [79, [90, 90, 98], [201, 201, 209]],
    [72, [91, 114, 144], [159, 182, 201]],
    [58, [45, 70, 105], [138, 164, 205]],
  ];

  function mixChannel(a: number, b: number, t: number): number {
    return Math.round(a + (b - a) * t);
  }

  /** Interpolate the orb's core + rim color for an arbitrary temperature. */
  function orbColors(tempF: number): { core: string; rim: string } {
    const stops = ORB_STOPS;
    let lo = stops[0]!;
    let hi = stops[stops.length - 1]!;
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i]!;
      const b = stops[i + 1]!;
      if (tempF <= a[0] && tempF >= b[0]) {
        lo = a;
        hi = b;
        break;
      }
    }
    const span = lo[0] - hi[0];
    const t = span === 0 ? 0 : Math.min(1, Math.max(0, (lo[0] - tempF) / span));
    const core = lo[1].map((c, i) => mixChannel(c, hi[1][i]!, t));
    const rim = lo[2].map((c, i) => mixChannel(c, hi[2][i]!, t));
    return {
      core: `rgb(${core.join(' ')})`,
      rim: `rgb(${rim.join(' ')})`,
    };
  }

  /** Live orb temperature — springs between days so the color morphs. */
  const orbTemp = ref(props.days[1]?.temp ?? 80);
  const orbStyle = computed(() => {
    const { core, rim } = orbColors(orbTemp.value);
    return {
      background: `radial-gradient(circle at 38% 34%, ${core} 0%, ${core} 22%, ${rim} 72%, ${rim} 100%)`,
    };
  });

  let orbRaf = 0;
  /** Ease the orb temperature toward the active day so the gradient morphs. */
  function animateOrbTo(target: number) {
    cancelAnimationFrame(orbRaf);
    const from = orbTemp.value;
    const delta = target - from;
    if (Math.abs(delta) < 0.01) return;
    const start = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      orbTemp.value = from + delta * (1 - (1 - t) ** 3);
      if (t < 1) orbRaf = requestAnimationFrame(tick);
    };
    orbRaf = requestAnimationFrame(tick);
  }

  function displayTemp(f: number): number {
    return unit.value === 'f' ? f : Math.round(((f - 32) * 5) / 9);
  }

  function selectDay(index: number) {
    if (index === active.value) return;
    active.value = index;
    animateOrbTo(props.days[index]!.temp);
    emit('change', props.days[index]!, index);
  }

  let timer = 0;
  function startAutoplay() {
    stopAutoplay();
    if (!props.autoplayInterval) return;
    timer = window.setInterval(() => {
      selectDay((active.value + 1) % props.days.length);
    }, props.autoplayInterval);
  }
  function stopAutoplay() {
    if (timer) window.clearInterval(timer);
    timer = 0;
  }

  watch([() => props.autoplayInterval, () => props.days.length], () =>
    startAutoplay(),
  );
  watch(
    () => props.unit,
    (u) => (unit.value = u),
  );

  onMounted(() => {
    orbTemp.value = current.value.temp;
    startAutoplay();
  });
  onBeforeUnmount(() => {
    stopAutoplay();
    cancelAnimationFrame(orbRaf);
  });
</script>

<template>
  <div
    :class="
      cn(
        'relative w-72 overflow-hidden rounded-3xl bg-white shadow-[0_18px_50px_-12px_rgba(30,30,60,0.25)] dark:bg-zinc-900 dark:shadow-black/40',
        props.class,
      )
    "
    @mouseenter="stopAutoplay"
    @mouseleave="startAutoplay"
  >
    <!-- header -->
    <div class="relative z-20 flex items-start justify-between px-5 pt-4">
      <div>
        <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {{ city }}
        </p>
        <component
          :is="motion.p"
          :key="current.date"
          :initial="{ opacity: 0, y: 4 }"
          :animate="{ opacity: 1, y: 0 }"
          class="text-xs text-zinc-400 dark:text-zinc-500"
        >
          {{ current.day }}, {{ monthName }} {{ current.date }}
        </component>
      </div>
      <div
        class="flex items-center rounded-lg bg-zinc-100 p-0.5 text-[11px] font-medium dark:bg-zinc-800"
      >
        <button
          type="button"
          :class="
            cn(
              'rounded-md px-2 py-0.5 transition-all',
              unit === 'f'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-zinc-50'
                : 'text-zinc-400',
            )
          "
          @click="unit = 'f'"
        >
          °F
        </button>
        <button
          type="button"
          :class="
            cn(
              'rounded-md px-2 py-0.5 transition-all',
              unit === 'c'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-zinc-50'
                : 'text-zinc-400',
            )
          "
          @click="unit = 'c'"
        >
          °C
        </button>
      </div>
    </div>

    <!--
      The orb: one persistent sphere whose gradient morphs with temperature.
      Keying it on the day would hard-swap the color; the reference blends
      the outgoing and incoming hue through the transition.
    -->
    <div class="relative z-0 flex h-38 items-end justify-center">
      <div
        class="absolute -bottom-24 size-52 rounded-full"
        :style="orbStyle"
      ></div>
    </div>

    <!-- frosted glass panel -->
    <div
      class="relative z-10 -mt-2 border-t border-white/40 bg-white/30 px-5 pb-3 pt-4 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/30"
    >
      <div class="flex items-start justify-between">
        <div>
          <component
            :is="motion.p"
            :key="`${current.date}-${unit}`"
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ type: 'spring', stiffness: 300, damping: 28 }"
            class="text-[40px] font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            {{ displayTemp(current.temp) }}°
          </component>
          <component
            :is="motion.p"
            :key="current.condition"
            :initial="{ opacity: 0 }"
            :animate="{ opacity: 1 }"
            :transition="{ delay: 0.08 }"
            class="mt-1.5 text-sm text-zinc-700 dark:text-zinc-300"
          >
            {{ current.condition }}
          </component>
        </div>
        <component
          :is="motion.div"
          :key="current.condition"
          :initial="{ opacity: 0, rotate: -14, scale: 0.8 }"
          :animate="{ opacity: 1, rotate: 0, scale: 1 }"
          :transition="{ type: 'spring', stiffness: 260, damping: 20 }"
          class="mt-2 text-zinc-900 dark:text-zinc-100"
        >
          <Icon
            :name="conditionIcon[current.condition] ?? 'lucide:cloud'"
            class="size-9"
          />
        </component>
      </div>

      <!-- day strip -->
      <div
        class="mt-4 flex items-center justify-between border-t border-zinc-900/6 pt-2.5 dark:border-white/6"
      >
        <button
          v-for="(day, i) in days"
          :key="day.date"
          type="button"
          :class="
            cn(
              'rounded-lg px-2 py-1 text-xs transition-all',
              i === active
                ? 'bg-white font-medium text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300',
            )
          "
          @mouseenter="selectDay(i)"
          @click="selectDay(i)"
        >
          {{ day.day }} {{ day.date }}
        </button>
      </div>
    </div>
  </div>
</template>
