<script setup lang="ts">
  import { motion } from 'motion-v';

  const props = withDefaults(
    defineProps<{
      progress?: number;
      remainingTime?: string;
      variant?: 'dark' | 'light';
    }>(),
    {
      progress: 45,
      remainingTime: '-7H 01M',
      variant: 'dark',
    },
  );

  const clampedProgress = computed(() => Math.max(props.progress, 15));

  const isDark = computed(() => props.variant === 'dark');

  const trackClass = computed(() =>
    isDark.value ? 'bg-[#252525] border-[#333]' : 'bg-[#e8e8e8] border-[#ddd]',
  );

  const fillGradient = computed(() =>
    isDark.value
      ? 'linear-gradient(90deg, #7cb518 0%, #a4de02 50%, #b4f54e 100%)'
      : 'linear-gradient(90deg, #4a9c4a 0%, #5cb85c 50%, #7ed17e 100%)',
  );

  const fillShadow = computed(() =>
    isDark.value
      ? '0 0 20px rgba(180, 245, 78, 0.6), 0 0 40px rgba(180, 245, 78, 0.3), inset 0 2px 4px rgba(255,255,255,0.2)'
      : '0 0 15px rgba(92, 184, 92, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
  );

  const timeClass = computed(() =>
    isDark.value ? 'text-[#6a6a6a]' : 'text-[#666]',
  );
</script>

<template>
  <div class="relative mt-4">
    <div
      :class="['relative h-12 rounded-full overflow-hidden border', trackClass]"
    >
      <component
        :is="motion.div"
        class="absolute inset-y-0 left-0 rounded-full flex items-center justify-end pr-2"
        :initial="{ width: '0%' }"
        :animate="{ width: `${clampedProgress}%` }"
        :transition="{ duration: 1.5, ease: 'circOut', delay: 0.5 }"
        :style="{ background: fillGradient, boxShadow: fillShadow }"
      >
        <component
          :is="motion.div"
          class="relative flex items-center justify-center size-8 rounded-full"
          :animate="{ y: [0, -2, 0] }"
          :transition="{ duration: 2, repeat: Infinity, ease: 'easeInOut' }"
          :style="{ background: 'rgba(255,255,255,0.2)' }"
        >
          <svg
            class="size-5 text-white rotate-45"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
            />
          </svg>
        </component>
      </component>
      <component
        :is="motion.div"
        v-if="isDark"
        class="absolute inset-y-0 left-0 rounded-full pointer-events-none"
        :initial="{ width: '0%' }"
        :animate="{ width: `${clampedProgress}%` }"
        :transition="{ duration: 1.5, ease: 'circOut', delay: 0.5 }"
        :style="{
          background:
            'radial-gradient(ellipse at right, rgba(180, 245, 78, 0.4) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }"
      />
    </div>
    <component
      :is="motion.div"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :transition="{ delay: 1.2 }"
      :class="[
        'absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono font-medium',
        timeClass,
      ]"
    >
      {{ remainingTime }}
    </component>
  </div>
</template>
