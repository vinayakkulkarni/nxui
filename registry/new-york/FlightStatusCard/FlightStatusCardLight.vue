<script setup lang="ts">
  import { motion } from 'motion-v';
  import type { FlightStatusCardProps } from '~/types/components';
  import { cn } from '~/lib/utils';
  import FlightStatusCardDotMatrix from './FlightStatusCardDotMatrix.vue';
  import FlightStatusCardHalftone from './FlightStatusCardHalftone.vue';
  import FlightStatusCardProgress from './FlightStatusCardProgress.vue';

  const props = withDefaults(defineProps<FlightStatusCardProps>(), {
    departureCode: 'YYZ',
    arrivalCode: 'HND',
    departureCity: 'Toronto',
    arrivalCity: 'Tokyo',
    departureTime: 'MON, 6:14 PM',
    arrivalTime: 'TUE, 7:14 AM',
    eta: 'ETA 2:15 PM',
    timezone: 'Tokyo Time',
    nextEvent: 'DINNER IN',
    nextEventTime: '2:34H',
    progress: 45,
    remainingTime: '-7H 01M',
    class: '',
  });

  // isDark only for child component props (dot colors, progress variant, halftone variant)
  // All class bindings use CSS dark: variant to avoid SSR hydration flash
  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const dotActive = computed(() => (isDark.value ? '#b4f54e' : '#2d7a2d'));
  const dotInactive = computed(() =>
    isDark.value ? 'rgba(180, 245, 78, 0.1)' : 'rgba(45, 122, 45, 0.15)',
  );

  const progressVariant = computed(() => (isDark.value ? 'dark' : 'light'));
</script>

<template>
  <component
    :is="motion.div"
    :initial="{ opacity: 0, y: 20 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.6, ease: 'easeOut' }"
    :class="
      cn(
        'flight-card relative w-full max-w-[520px] rounded-[28px] p-6 overflow-hidden',
        'bg-[#f8f8f8] dark:bg-[#1a1a1a]',
        'shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15),0_10px_30px_-5px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]',
        'dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6),0_10px_30px_-5px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]',
        props.class,
      )
    "
  >
    <FlightStatusCardHalftone
      :variant="isDark ? 'dark' : 'light'"
      class="opacity-[0.6] dark:opacity-[0.75]"
    />
    <div class="relative z-10">
      <div
        class="mb-6 flex flex-col items-center justify-between gap-6 md:flex-row md:items-start md:gap-0"
      >
        <div class="flex items-center gap-4">
          <div class="flex flex-col items-start">
            <FlightStatusCardDotMatrix
              :text="departureCode"
              :dot-size="5"
              :gap="2"
              :char-gap="6"
              :active-color="dotActive"
              :inactive-color="dotInactive"
            />
            <component
              :is="motion.span"
              :initial="{ opacity: 0, x: -10 }"
              :animate="{ opacity: 1, x: 0 }"
              :transition="{ delay: 0.3 }"
              class="mt-2 text-sm font-medium text-[#555] dark:text-[#8a8a8a]"
            >
              {{ departureCity }}
            </component>
            <component
              :is="motion.span"
              :initial="{ opacity: 0 }"
              :animate="{ opacity: 1 }"
              :transition="{ delay: 0.5 }"
              class="mt-0.5 text-xs uppercase tracking-wide text-[#888] dark:text-[#6a6a6a]"
            >
              {{ departureTime }}
            </component>
          </div>
          <div class="mt-1 flex items-center px-2">
            <component
              :is="motion.svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              class="text-orange-600 dark:text-orange-500"
              :initial="{ scaleX: 0, opacity: 0 }"
              :animate="{ scaleX: 1, opacity: 1 }"
              :transition="{ delay: 0.4, type: 'spring' }"
            >
              <path
                d="M5 12h14m0 0l-4-4m4 4l-4 4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </component>
          </div>
          <div class="flex flex-col items-start">
            <FlightStatusCardDotMatrix
              :text="arrivalCode"
              :dot-size="5"
              :gap="2"
              :char-gap="6"
              :active-color="dotActive"
              :inactive-color="dotInactive"
            />
            <component
              :is="motion.span"
              :initial="{ opacity: 0, x: 10 }"
              :animate="{ opacity: 1, x: 0 }"
              :transition="{ delay: 0.3 }"
              class="mt-2 text-sm font-medium text-[#555] dark:text-[#8a8a8a]"
            >
              {{ arrivalCity }}
            </component>
            <component
              :is="motion.span"
              :initial="{ opacity: 0 }"
              :animate="{ opacity: 1 }"
              :transition="{ delay: 0.5 }"
              class="mt-0.5 text-xs uppercase tracking-wide text-[#888] dark:text-[#6a6a6a]"
            >
              {{ arrivalTime }}
            </component>
          </div>
        </div>
        <component
          :is="motion.div"
          :initial="{ opacity: 0, scale: 0.9 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ delay: 0.6 }"
          :class="
            cn(
              'flex flex-col rounded-xl p-3 min-w-[140px]',
              'bg-white border border-[#e0e0e0] shadow-[0_4px_20px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08)]',
              'dark:bg-[#252525] dark:border-[#333] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
            )
          "
        >
          <div class="mb-1 flex items-center justify-between">
            <span class="text-sm font-semibold text-[#222] dark:text-white">{{
              eta
            }}</span>
            <button
              class="rounded-full p-1 transition-colors hover:bg-[#f0f0f0] dark:hover:bg-[#333]"
            >
              <Icon
                name="lucide:arrow-up-down"
                class="size-4 text-[#666] dark:text-[#8a8a8a]"
              />
            </button>
          </div>
          <span class="text-xs text-[#888] dark:text-[#6a6a6a]">{{
            timezone
          }}</span>
          <span
            class="mt-1 text-xs font-bold tracking-wide text-orange-600 dark:text-orange-500"
            >{{ nextEvent }} {{ nextEventTime }}</span
          >
        </component>
      </div>
      <FlightStatusCardProgress
        :progress="progress"
        :remaining-time="remainingTime"
        :variant="progressVariant"
      />
    </div>
  </component>
</template>

<style scoped>
  .flight-card {
    background: linear-gradient(145deg, #ffffff 0%, #f8f8f8 50%, #f0f0f0 100%);
  }

  :is(.dark *) .flight-card {
    background: linear-gradient(145deg, #1e1e1e 0%, #1a1a1a 50%, #151515 100%);
  }
</style>
