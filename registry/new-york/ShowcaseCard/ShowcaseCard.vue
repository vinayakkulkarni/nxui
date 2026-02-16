<script setup lang="ts">
  import { useMouseInElement } from '@vueuse/core';
  import type { ShowcaseCardProps } from '~/types/components';
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

  const cardRef = ref<HTMLElement>();
  const isHovered = ref(false);
  const { elementX, elementY, isOutside } = useMouseInElement(cardRef);

  const mouseNormX = computed(() => {
    if (isOutside.value || !cardRef.value) return 0;
    const rect = cardRef.value.getBoundingClientRect();
    return (elementX.value / rect.width) - 0.5;
  });

  const mouseNormY = computed(() => {
    if (isOutside.value || !cardRef.value) return 0;
    const rect = cardRef.value.getBoundingClientRect();
    return (elementY.value / rect.height) - 0.5;
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
    return {
      background: `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
      opacity: isHovered.value ? 1 : 0,
      transition: 'opacity 0.3s',
    };
  });
</script>

<template>
  <div
    ref="cardRef"
    :class="cn(
      'relative w-full max-w-[400px] cursor-pointer select-none overflow-hidden rounded-3xl bg-white dark:bg-neutral-950 shadow-2xl shadow-black/10 dark:shadow-black/20 transition-shadow duration-300 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]',
      props.class,
    )"
    :style="cardStyle"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Glow overlay -->
    <div
      class="pointer-events-none absolute inset-0 z-10"
      :style="glowStyle"
    />

    <!-- Image section -->
    <div class="relative aspect-[4/3] overflow-hidden">
      <div
        v-if="tagline"
        class="absolute left-4 top-4 z-20 sm:left-6 sm:top-6"
      >
        <span class="text-sm font-medium tracking-tight text-neutral-900/90 dark:text-white/90 sm:text-base">
          {{ tagline }}
        </span>
      </div>

      <div class="absolute inset-0" :style="parallaxStyle">
        <img
          :src="imageUrl"
          :alt="imageAlt"
          class="size-full object-cover"
        >
      </div>

      <div class="absolute inset-0 bg-gradient-to-t from-white dark:from-neutral-950 via-transparent to-transparent opacity-60" />
    </div>

    <!-- Content section -->
    <div class="relative z-10 -mt-8 px-4 pb-4 sm:px-6 sm:pb-6">
      <h2 class="mb-2 text-2xl font-medium leading-tight tracking-tight text-neutral-900 dark:text-white sm:mb-3 sm:text-3xl lg:text-4xl">
        {{ heading }}
      </h2>

      <p
        v-if="description"
        class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 sm:mb-6 sm:text-base"
      >
        {{ description }}
      </p>

      <button
        v-if="ctaText"
        class="relative overflow-hidden rounded-full border border-neutral-300/50 dark:border-neutral-700/50 bg-neutral-100/80 dark:bg-neutral-800/80 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 transition-colors duration-300 hover:scale-105 hover:border-neutral-400/80 dark:hover:border-neutral-600/80 active:scale-95 sm:px-5 sm:py-2.5"
        @click="emit('ctaClick')"
      >
        {{ ctaText }}
      </button>
    </div>

    <!-- Footer section -->
    <div
      v-if="brandName || services.length > 0"
      class="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200/50 dark:border-neutral-800/50 px-4 py-4 sm:px-6 sm:py-5"
    >
      <span
        v-if="brandName"
        class="text-xs font-medium text-neutral-500 dark:text-neutral-400 sm:text-sm"
      >
        {{ brandName }}
      </span>

      <div
        v-if="services.length > 0"
        class="flex flex-wrap items-center gap-2 sm:gap-3"
      >
        <template v-for="(service, index) in services" :key="service">
          <span class="text-xs text-neutral-400 dark:text-neutral-500 sm:text-sm">{{ service }}</span>
          <span v-if="index < services.length - 1" class="text-neutral-300 dark:text-neutral-600">
            &#10022;
          </span>
        </template>
      </div>
    </div>

    <!-- Border glow -->
    <div
      class="pointer-events-none absolute inset-0 rounded-3xl transition-shadow duration-300"
      :style="{
        boxShadow: isHovered
          ? 'inset 0 0 0 1px rgba(255,255,255,0.1)'
          : 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }"
    />
  </div>
</template>
