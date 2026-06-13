<script setup lang="ts">
  import { useMouseInElement } from '@vueuse/core';
  import { motion } from 'motion-v';
  import type { ShowcaseCardProps } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<ShowcaseCardProps>(), {
    imageAlt: 'Showcase image',
    services: () => [],
    enableTilt: true,
    maxTilt: 8,
    enableParallax: true,
    class: '',
  });

  const emit = defineEmits<{
    ctaClick: [];
  }>();

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const cardRef = ref<HTMLElement>();
  const isHovered = ref(false);
  const { elementX, elementY, isOutside } = useMouseInElement(cardRef);

  const mouseNormX = computed(() => {
    if (isOutside.value || !cardRef.value) return 0;
    const rect = cardRef.value.getBoundingClientRect();
    return elementX.value / rect.width - 0.5;
  });

  const mouseNormY = computed(() => {
    if (isOutside.value || !cardRef.value) return 0;
    const rect = cardRef.value.getBoundingClientRect();
    return elementY.value / rect.height - 0.5;
  });

  const cardStyle = computed(() => {
    if (!props.enableTilt) return {};
    const rx = -mouseNormY.value * props.maxTilt;
    const ry = mouseNormX.value * props.maxTilt;
    return {
      transform: `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`,
      transition: isOutside.value
        ? 'transform 0.5s ease-out'
        : 'transform 0.1s ease-out',
    };
  });

  const parallaxStyle = computed(() => {
    if (!props.enableParallax) return { transform: 'scale(1.1)' };
    const px = mouseNormX.value * 15;
    const py = mouseNormY.value * 15;
    return {
      transform: `translate(${px}px, ${py}px) scale(${isHovered.value ? 1.15 : 1.1})`,
      transition: 'transform 0.6s ease-out',
    };
  });

  const glowStyle = computed(() => {
    const gx = (mouseNormX.value + 0.5) * 100;
    const gy = (mouseNormY.value + 0.5) * 100;
    const glowColor = isDark.value
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(0,0,0,0.04)';
    return {
      background: `radial-gradient(circle at ${gx}% ${gy}%, ${glowColor} 0%, transparent 50%)`,
      opacity: isHovered.value ? 1 : 0,
      transition: 'opacity 0.3s',
    };
  });
</script>

<template>
  <div
    ref="cardRef"
    :class="
      cn(
        'relative w-full max-w-100 cursor-pointer select-none overflow-hidden rounded-3xl bg-neutral-50 ring-1 ring-neutral-200/80 shadow-xl shadow-neutral-300/40 transition-all duration-300 hover:shadow-2xl hover:shadow-neutral-400/30 dark:bg-neutral-950 dark:ring-white/6 dark:shadow-black/40 dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]',
        props.class,
      )
    "
    :style="cardStyle"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Glow overlay -->
    <div
      class="pointer-events-none absolute inset-0 z-10"
      :style="glowStyle"
    ></div>

    <!-- Image section -->
    <div class="relative aspect-4/3 overflow-hidden">
      <div
        v-if="tagline"
        class="absolute left-4 top-4 z-20 drop-shadow-md sm:left-6 sm:top-6"
      >
        <span
          class="text-sm font-medium tracking-tight text-white/90 sm:text-base"
        >
          {{ tagline }}
        </span>
      </div>

      <div class="absolute inset-0" :style="parallaxStyle">
        <img :src="imageUrl" :alt="imageAlt" class="size-full object-cover" />
      </div>

      <div
        class="absolute inset-0 bg-linear-to-t from-neutral-50 via-neutral-50/20 to-transparent opacity-90 dark:from-neutral-950 dark:via-transparent dark:opacity-60"
      ></div>
    </div>

    <!-- Content section -->
    <div class="relative z-10 -mt-8 px-4 pb-4 sm:px-6 sm:pb-6">
      <h2
        class="mb-2 border-0 text-2xl/tight font-medium tracking-tight text-neutral-900 dark:text-white sm:mb-3 sm:text-3xl lg:text-4xl"
      >
        {{ heading }}
      </h2>

      <p
        v-if="description"
        class="mb-4 text-sm/relaxed text-neutral-600 dark:text-neutral-400 sm:mb-6 sm:text-base"
      >
        {{ description }}
      </p>

      <component
        :is="motion.button"
        v-if="ctaText"
        class="relative overflow-hidden rounded-full border border-neutral-300 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-800 transition-colors duration-300 hover:border-neutral-400 hover:bg-neutral-200/80 dark:border-neutral-700/50 dark:bg-neutral-800/80 dark:text-neutral-200 dark:hover:border-neutral-600/80 sm:px-5 sm:py-2.5"
        :while-hover="{ scale: 1.05 }"
        :while-tap="{ scale: 0.98 }"
        @click="emit('ctaClick')"
      >
        <component
          :is="motion.span"
          class="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-black/6 to-transparent dark:via-white/10"
          :animate="
            isHovered ? { translateX: '200%' } : { translateX: '-100%' }
          "
          :transition="{ duration: 0.6, ease: 'easeInOut' }"
        />
        <span class="relative z-10">{{ ctaText }}</span>
      </component>
    </div>

    <!-- Footer section -->
    <div
      v-if="brandName || services.length > 0"
      class="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 p-4 dark:border-neutral-800/50 sm:px-6 sm:py-5"
    >
      <component
        :is="motion.span"
        v-if="brandName"
        class="text-xs font-medium text-neutral-500 sm:text-sm cursor-default transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        :while-hover="{ scale: 1.02 }"
        :transition="{ duration: 0.2 }"
      >
        {{ brandName }}
      </component>

      <div
        v-if="services.length > 0"
        class="flex flex-wrap items-center gap-2 sm:gap-3"
      >
        <template v-for="(service, index) in services" :key="service">
          <component
            :is="motion.span"
            class="text-xs text-neutral-400 sm:text-sm cursor-default transition-colors hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white"
            :while-hover="{ scale: 1.05 }"
            :transition="{ duration: 0.2 }"
          >
            {{ service }}
          </component>
          <component
            :is="motion.span"
            v-if="index < services.length - 1"
            class="inline-block text-neutral-300 dark:text-neutral-600"
            :initial="{ rotate: 0 }"
            :while-hover="{ rotate: 90 }"
            :transition="{ duration: 0.3 }"
          >
            &#10022;
          </component>
        </template>
      </div>
    </div>

    <!-- Border glow -->
    <div
      class="pointer-events-none absolute inset-0 rounded-3xl transition-shadow duration-300"
      :style="{
        boxShadow: isHovered
          ? `inset 0 0 0 1px ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`
          : `inset 0 0 0 1px ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}`,
      }"
    ></div>
  </div>
</template>
