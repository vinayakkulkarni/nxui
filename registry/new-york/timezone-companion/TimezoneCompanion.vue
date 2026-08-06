<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
  import { motion } from 'motion-v';
  import type { TimezoneCity, TimezoneMode } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      mode?: TimezoneMode;
      cities?: TimezoneCity[];
      class?: string;
    }>(),
    {
      mode: 'meeting',
      cities: () => [
        {
          name: 'San Francisco',
          tz: 'America/Los_Angeles',
          offset: -7,
          workStart: 9,
          workEnd: 17,
        },
        {
          name: 'New York',
          tz: 'America/New_York',
          offset: -4,
          workStart: 9,
          workEnd: 17,
        },
        {
          name: 'São Paulo',
          tz: 'America/Sao_Paulo',
          offset: -3,
          workStart: 8,
          workEnd: 18,
        },
        {
          name: 'London',
          tz: 'Europe/London',
          offset: 1,
          workStart: 9,
          workEnd: 17,
        },
      ],
      class: '',
    },
  );

  const mode = ref<TimezoneMode>(props.mode);
  const utcHours = ref(12); // 0..23, UTC-based hour being explored
  const now = ref(new Date());

  const localHour = computed(() => (utcHours.value + 24) % 24);

  function cityLocalHour(city: TimezoneCity): number {
    return (utcHours.value + city.offset + 24) % 24;
  }

  function inWorkingHours(city: TimezoneCity): boolean {
    const h = cityLocalHour(city);
    return h >= city.workStart && h < city.workEnd;
  }

  const inWorkingCount = computed(
    () => props.cities.filter(inWorkingHours).length,
  );

  const bestHour = computed(() => {
    let best = -1;
    let bestCount = -1;
    for (let h = 0; h < 24; h++) {
      const count = props.cities.filter((c) => {
        const ch = (h + c.offset + 24) % 24;
        return ch >= c.workStart && ch < c.workEnd;
      }).length;
      if (count > bestCount) {
        bestCount = count;
        best = h;
      }
    }
    return best;
  });

  function findBestTime() {
    const target = bestHour.value;
    if (target < 0) return;
    const start = utcHours.value;
    const delta = (target - start + 24) % 24;
    const steps = delta;
    let s = 0;
    const tick = () => {
      utcHours.value = (start + s + 24) % 24;
      s++;
      if (s <= steps) requestAnimationFrame(tick);
    };
    tick();
  }

  const clockTick = computed(() => {
    const d = now.value;
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return { hh, mm };
  });

  function clockTime(city: TimezoneCity): {
    hh: string;
    mm: string;
    phase: string;
  } {
    const d = new Date(now.value.getTime() + city.offset * 3600_000);
    const h = d.getUTCHours();
    const phase =
      h >= 5 && h < 9
        ? 'BEFORE WORK'
        : h >= 9 && h < 17
          ? 'WORKING'
          : h >= 17 && h < 22
            ? 'WRAPPING UP'
            : 'NIGHT';
    return {
      hh: String(d.getUTCHours()).padStart(2, '0'),
      mm: String(d.getUTCMinutes()).padStart(2, '0'),
      phase,
    };
  }

  const offsetLabel: Record<string, string> = {
    'America/Los_Angeles': 'PDT',
    'America/New_York': 'EDT',
    'America/Sao_Paulo': 'UTC-3',
    'Europe/London': 'BST',
  };

  const phaseColor: Record<string, string> = {
    NIGHT: 'bg-indigo-500/12 text-indigo-400 dark:text-indigo-300',
    'BEFORE WORK': 'bg-amber-500/12 text-amber-600 dark:text-amber-300',
    WORKING: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
    'WRAPPING UP': 'bg-orange-500/12 text-orange-600 dark:text-orange-300',
  };

  let clockTimer = 0;
  watch(
    () => props.mode,
    (m) => (mode.value = m),
  );
  onMounted(() => {
    clockTimer = window.setInterval(() => {
      now.value = new Date();
    }, 30_000);
  });
  onBeforeUnmount(() => window.clearInterval(clockTimer));
</script>

<template>
  <div
    :class="
      cn(
        'w-full max-w-md rounded-3xl border border-border/60 bg-card p-5 shadow-xl shadow-black/5 dark:border-white/6',
        props.class,
      )
    "
  >
    <!-- header -->
    <div class="flex items-center justify-between">
      <p class="text-sm font-medium">
        {{ mode === 'meeting' ? 'Meeting Finder' : 'World Clock' }}
      </p>
      <div
        class="flex items-center gap-0.5 rounded-full border border-border/60 p-0.5 text-xs"
      >
        <button
          type="button"
          :class="
            cn(
              'rounded-full px-2.5 py-1 transition-colors',
              mode === 'meeting'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
            )
          "
          @click="mode = 'meeting'"
        >
          Meeting
        </button>
        <button
          type="button"
          :class="
            cn(
              'rounded-full px-2.5 py-1 transition-colors',
              mode === 'clock'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
            )
          "
          @click="mode = 'clock'"
        >
          Clock
        </button>
      </div>
    </div>

    <!-- MEETING MODE -->
    <template v-if="mode === 'meeting'">
      <div class="mt-5 flex items-center justify-between">
        <p class="text-xs text-muted-foreground">
          {{ inWorkingCount }} of {{ cities.length }} in working hours
        </p>
        <p class="text-xs tabular-nums text-muted-foreground">
          {{ String(localHour).padStart(2, '0') }}:00 UTC
        </p>
      </div>

      <!-- hour timeline -->
      <div class="mt-4">
        <div class="relative h-9">
          <div
            class="absolute inset-0 rounded-xl bg-primary/6 dark:bg-white/6"
          ></div>
          <motion.div
            class="absolute top-0 h-full rounded-xl bg-primary/15 dark:bg-white/12"
            :style="{
              left: `${(localHour / 24) * 100}%`,
              width: `${100 / 24}%`,
            }"
            :transition="{ type: 'spring', stiffness: 200, damping: 28 }"
          ></motion.div>
          <Icon
            name="lucide:grip-vertical"
            class="absolute top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
            :style="{ left: `calc(${(localHour / 24) * 100}% - 6px)` }"
          />
        </div>
        <input
          type="range"
          min="0"
          max="23"
          step="1"
          :value="utcHours"
          class="mt-2 w-full accent-primary"
          aria-label="Explore hour"
          @input="utcHours = Number(($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- city rows -->
      <div class="mt-4 space-y-2">
        <div
          v-for="city in cities"
          :key="city.name"
          :class="
            cn(
              'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors',
              inWorkingHours(city)
                ? 'bg-primary/6 dark:bg-white/6'
                : 'opacity-60',
            )
          "
        >
          <span class="font-medium">{{ city.name }}</span>
          <span class="flex items-center gap-2">
            <span
              :class="
                cn(
                  'size-1.5 rounded-full',
                  inWorkingHours(city)
                    ? 'bg-emerald-500'
                    : 'bg-muted-foreground/40',
                )
              "
            ></span>
            <span class="tabular-nums text-muted-foreground">
              {{ String(cityLocalHour(city)).padStart(2, '0') }}:00
            </span>
          </span>
        </div>
      </div>

      <button
        type="button"
        class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99]"
        @click="findBestTime"
      >
        Find best time
        <Icon name="lucide:sparkles" class="size-3.5" />
      </button>
    </template>

    <!-- CLOCK MODE -->
    <template v-else>
      <p class="mt-2 text-xs tabular-nums text-muted-foreground">
        {{ clockTick.hh }}:{{ clockTick.mm }} UTC · live
      </p>
      <div class="mt-4 space-y-2">
        <component
          :is="motion.div"
          v-for="city in cities"
          :key="city.name"
          :initial="{ opacity: 0, y: 10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{
            delay: cities.indexOf(city) * 0.06,
            type: 'spring',
            stiffness: 260,
            damping: 26,
          }"
          class="flex items-center justify-between rounded-xl border border-border/50 p-3 dark:border-white/6"
        >
          <div>
            <p class="text-sm font-medium">{{ city.name }}</p>
            <p class="text-xs text-muted-foreground">
              {{
                offsetLabel[city.tz] ??
                `UTC${city.offset >= 0 ? '+' : ''}${city.offset}`
              }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-lg font-bold tabular-nums tracking-tight">
              {{ clockTime(city).hh }}:{{ clockTime(city).mm }}
            </p>
            <span
              :class="
                cn(
                  'mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide',
                  phaseColor[clockTime(city).phase] ?? '',
                )
              "
            >
              {{ clockTime(city).phase }}
            </span>
          </div>
        </component>
      </div>
    </template>
  </div>
</template>
