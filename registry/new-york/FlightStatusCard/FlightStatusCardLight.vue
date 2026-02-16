<script setup lang="ts">
import { motion } from 'motion-v';
import type { FlightStatusCardProps } from '~/types/components';
import { cn } from '~/lib/utils';
import FlightStatusCardDotMatrix from './FlightStatusCardDotMatrix.vue';
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

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');

const cardBg = computed(() =>
  isDark.value
    ? 'linear-gradient(145deg, #1e1e1e 0%, #1a1a1a 50%, #151515 100%)'
    : 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 50%, #f0f0f0 100%)',
);

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
    :class="cn(
      'relative w-full max-w-[480px] rounded-[28px] p-6 overflow-hidden',
      isDark ? 'bg-[#1a1a1a]' : 'bg-[#f8f8f8]',
      isDark
        ? 'shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6),0_10px_30px_-5px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]'
        : 'shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15),0_10px_30px_-5px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]',
      props.class,
    )"
    :style="{ background: cardBg }"
  >
    <div class="relative z-10">
      <div class="mb-6 flex flex-col items-center justify-between gap-6 md:flex-row md:items-start md:gap-0">
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
              :class="isDark ? 'text-[#8a8a8a]' : 'text-[#555]'"
              class="mt-2 text-sm font-medium"
            >
              {{ departureCity }}
            </component>
            <component
              :is="motion.span"
              :initial="{ opacity: 0 }"
              :animate="{ opacity: 1 }"
              :transition="{ delay: 0.5 }"
              :class="isDark ? 'text-[#6a6a6a]' : 'text-[#888]'"
              class="mt-0.5 text-xs uppercase tracking-wide"
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
              :class="isDark ? 'text-orange-500' : 'text-orange-600'"
              :initial="{ scaleX: 0, opacity: 0 }"
              :animate="{ scaleX: 1, opacity: 1 }"
              :transition="{ delay: 0.4, type: 'spring' }"
            >
              <path d="M5 12h14m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
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
              :class="isDark ? 'text-[#8a8a8a]' : 'text-[#555]'"
              class="mt-2 text-sm font-medium"
            >
              {{ arrivalCity }}
            </component>
            <component
              :is="motion.span"
              :initial="{ opacity: 0 }"
              :animate="{ opacity: 1 }"
              :transition="{ delay: 0.5 }"
              :class="isDark ? 'text-[#6a6a6a]' : 'text-[#888]'"
              class="mt-0.5 text-xs uppercase tracking-wide"
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
          :class="cn(
            'flex flex-col rounded-xl p-3 min-w-[130px]',
            isDark
              ? 'bg-[#252525] border border-[#333]'
              : 'bg-white border border-[#e0e0e0] shadow-sm',
          )"
        >
          <div class="mb-1 flex items-center justify-between">
            <span :class="isDark ? 'text-white' : 'text-[#222]'" class="text-sm font-semibold">{{ eta }}</span>
            <button :class="isDark ? 'hover:bg-[#333]' : 'hover:bg-[#f0f0f0]'" class="rounded-full p-1 transition-colors">
              <Icon name="lucide:arrow-up-down" :class="isDark ? 'text-[#8a8a8a]' : 'text-[#666]'" class="size-4" />
            </button>
          </div>
          <span :class="isDark ? 'text-[#6a6a6a]' : 'text-[#888]'" class="text-xs">{{ timezone }}</span>
          <span :class="isDark ? 'text-orange-500' : 'text-orange-600'" class="mt-1 text-xs font-bold tracking-wide">{{ nextEvent }} {{ nextEventTime }}</span>
        </component>
      </div>
      <FlightStatusCardProgress :progress="progress" :remaining-time="remainingTime" :variant="progressVariant" />
    </div>
  </component>
</template>
