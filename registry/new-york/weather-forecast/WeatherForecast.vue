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
        { day: 'Mon', date: 3, condition: 'Sunny', temp: 88 },
        { day: 'Tue', date: 4, condition: 'Partly cloudy', temp: 92 },
        { day: 'Wed', date: 5, condition: 'Cloudy', temp: 78 },
        { day: 'Thu', date: 6, condition: 'Rain', temp: 64 },
        { day: 'Fri', date: 7, condition: 'Sunny', temp: 81 },
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

  /** Orb gradient per condition — the soft sphere behind the glass. */
  const orbGradient: Record<string, string> = {
    Sunny:
      'radial-gradient(circle at 38% 35%, #7a3d1c 0%, #a85a24 34%, #e8a34b 68%, #f6c877 100%)',
    'Partly cloudy':
      'radial-gradient(circle at 40% 38%, #5d3420 0%, #8a4f28 40%, #d9924a 75%, #efb96f 100%)',
    Cloudy:
      'radial-gradient(circle at 40% 38%, #4a4a52 0%, #6e6e78 45%, #a3a3ad 78%, #c9c9d1 100%)',
    Rain: 'radial-gradient(circle at 40% 38%, #24303f 0%, #3a5068 45%, #6d8aa5 78%, #9fb6c9 100%)',
    Snow: 'radial-gradient(circle at 40% 38%, #7d8798 0%, #a5b2c4 45%, #d3dceb 78%, #eef2f9 100%)',
    Storm:
      'radial-gradient(circle at 40% 38%, #241f33 0%, #3d3554 45%, #6a5f8a 78%, #948ab0 100%)',
  };

  function displayTemp(f: number): number {
    return unit.value === 'f' ? f : Math.round(((f - 32) * 5) / 9);
  }

  function selectDay(index: number) {
    if (index === active.value) return;
    active.value = index;
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

  onMounted(startAutoplay);
  onBeforeUnmount(stopAutoplay);
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

    <!-- the orb -->
    <div class="relative z-0 flex h-38 items-end justify-center">
      <component
        :is="motion.div"
        :key="current.condition"
        :initial="{ opacity: 0, scale: 0.86 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="{ duration: 0.9, ease: 'easeOut' }"
        class="absolute -bottom-24 size-52 rounded-full"
        :style="{
          background: orbGradient[current.condition] ?? orbGradient.Cloudy,
        }"
      ></component>
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
