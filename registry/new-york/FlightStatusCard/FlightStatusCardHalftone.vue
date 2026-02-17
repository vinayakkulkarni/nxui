<script setup lang="ts">
import { useId } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'dark' | 'light';
    class?: string;
  }>(),
  { variant: 'dark', class: '' },
);

const uid = useId();
const patternId = computed(() => `halftone-${uid}`);
const gradientId = computed(() => `halftone-fade-${uid}`);
const maskId = computed(() => `halftone-mask-${uid}`);

const isDark = computed(() => props.variant === 'dark');
const dotColor = computed(() =>
  isDark.value ? 'rgba(180, 245, 78, 0.25)' : 'rgba(45, 122, 45, 0.22)',
);
const fadeStops = computed(() =>
  isDark.value
    ? { start: 0.8, mid: 0.3, end: 0 }
    : { start: 1, mid: 0.5, end: 0 },
);
</script>

<template>
  <svg
    :class="['absolute inset-0 pointer-events-none', props.class]"
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern :id="patternId" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.2" :fill="dotColor" />
      </pattern>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="white" :stop-opacity="fadeStops.start" />
        <stop offset="50%" stop-color="white" :stop-opacity="fadeStops.mid" />
        <stop offset="100%" stop-color="white" :stop-opacity="fadeStops.end" />
      </linearGradient>
      <mask :id="maskId">
        <rect width="100%" height="100%" :fill="`url(#${gradientId})`" />
      </mask>
    </defs>
    <rect width="100%" height="100%" :fill="`url(#${patternId})`" :mask="`url(#${maskId})`" />
  </svg>
</template>
