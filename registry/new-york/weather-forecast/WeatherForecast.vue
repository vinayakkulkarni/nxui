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
        { day: 'Mon', date: 3, condition: 'Sunny', temp: 74 },
        { day: 'Tue', date: 4, condition: 'Partly cloudy', temp: 71 },
        { day: 'Wed', date: 5, condition: 'Cloudy', temp: 68 },
        { day: 'Thu', date: 6, condition: 'Rain', temp: 63 },
        { day: 'Fri', date: 7, condition: 'Partly cloudy', temp: 66 },
      ],
      unit: 'f',
      autoplayInterval: 3000,
      class: '',
    },
  );

  const emit = defineEmits<{
    change: [day: WeatherDay, index: number];
  }>();

  const active = ref(0);
  const unit = ref<'f' | 'c'>(props.unit);
  const current = computed(() => props.days[active.value]!);

  const conditionIcon: Record<string, string> = {
    Sunny: 'lucide:sun',
    'Partly cloudy': 'lucide:cloud-sun',
    Cloudy: 'lucide:cloud',
    Rain: 'lucide:cloud-rain',
    Snow: 'lucide:snowflake',
    Storm: 'lucide:cloud-lightning',
    Wind: 'lucide:wind',
  };

  function displayTemp(f: number): number {
    return unit.value === 'f' ? f : Math.round(((f - 32) * 5) / 9);
  }

  function selectDay(index: number) {
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

  watch(
    [() => props.autoplayInterval, () => props.days.length],
    () => startAutoplay(),
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
        'w-full max-w-sm rounded-3xl border border-border/60 bg-card p-5 shadow-xl shadow-black/5 dark:border-white/6',
        props.class,
      )
    "
  >
    <!-- header -->
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-muted-foreground">{{ city }}</p>
        <p class="text-xs text-muted-foreground/70">Weekly forecast</p>
      </div>
      <div
        class="flex items-center gap-0.5 rounded-full border border-border/60 p-0.5 text-xs"
      >
        <button
          type="button"
          :class="
            cn(
              'rounded-full px-2 py-0.5 transition-colors',
              unit === 'f'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
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
              'rounded-full px-2 py-0.5 transition-colors',
              unit === 'c'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
            )
          "
          @click="unit = 'c'"
        >
          °C
        </button>
      </div>
    </div>

    <!-- hero condition -->
    <div class="mt-6 flex items-center gap-4">
      <component
        :is="motion.div"
        :key="current.date"
        :initial="{ opacity: 0, scale: 0.7, rotate: -8 }"
        :animate="{ opacity: 1, scale: 1, rotate: 0 }"
        :transition="{ type: 'spring', stiffness: 320, damping: 24 }"
        class="flex size-14 items-center justify-center rounded-2xl bg-primary/8 text-primary dark:bg-white/6"
      >
        <Icon
          :name="conditionIcon[current.condition] ?? 'lucide:cloud'"
          class="size-7"
        />
      </component>
      <component
        :is="motion.div"
        :key="`${current.date}-${unit}`"
        :initial="{ opacity: 0, y: 14 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ type: 'spring', stiffness: 260, damping: 26 }"
      >
        <p class="text-4xl font-bold tracking-tight">
          {{ displayTemp(current.temp) }}°
        </p>
        <p class="text-sm text-muted-foreground">{{ current.condition }}</p>
      </component>
    </div>

    <!-- day strip -->
    <div class="mt-6 grid grid-cols-5 gap-1.5">
      <button
        v-for="(day, i) in days"
        :key="day.date"
        type="button"
        :class="
          cn(
            'flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-xs transition-all duration-300',
            i === active
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'text-muted-foreground hover:bg-primary/6 hover:text-foreground',
          )
        "
      >
        <span class="font-medium">{{ day.day }}</span>
        <span
          :class="
            cn(
              'text-base font-bold',
              i === active ? 'text-primary-foreground' : '',
            )
          "
        >
          {{ displayTemp(day.temp) }}°
        </span>
        <Icon
          :name="conditionIcon[day.condition] ?? 'lucide:cloud'"
          :class="cn('size-3.5', i === active ? '' : 'opacity-60')"
        />
        <span class="text-[10px] opacity-70">{{ day.date }}</span>
      </button>
    </div>
  </div>
</template>
