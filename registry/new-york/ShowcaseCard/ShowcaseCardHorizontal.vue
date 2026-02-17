<script setup lang="ts">
  import { useElementHover } from '@vueuse/core';
  import { motion } from 'motion-v';
  import type { ShowcaseCardHorizontalProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<ShowcaseCardHorizontalProps>(), {
    imageAlt: 'Showcase image',
    services: () => [],
    class: '',
    imagePosition: 'left',
    enableParallax: true,
  });

  const emit = defineEmits<{ (e: 'ctaClick'): void }>();

  const cardRef = ref<HTMLElement>();
  const isHovered = useElementHover(cardRef);
</script>

<template>
  <component
    :is="motion.div"
    ref="cardRef"
    :class="
      cn(
        'relative w-full rounded-3xl overflow-hidden',
        'bg-white dark:bg-neutral-950',
        'shadow-2xl shadow-black/20',
        'flex flex-col md:flex-row',
        imagePosition === 'right' && 'md:flex-row-reverse',
        props.class,
      )
    "
    :initial="{ opacity: 0, y: 40 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.6 }"
  >
    <div
      class="relative w-full md:w-1/2 aspect-[4/3] md:aspect-auto md:min-h-[400px] overflow-hidden"
    >
      <div v-if="tagline" class="absolute top-6 left-6 z-20">
        <span class="text-neutral-900 dark:text-white/90 text-sm font-medium">{{
          tagline
        }}</span>
      </div>
      <img
        :src="imageUrl"
        :alt="imageAlt"
        class="w-full h-full object-cover transition-transform duration-600 ease-out"
        :style="{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }"
      />
      <div
        class="absolute inset-0 bg-gradient-to-r from-white/60 dark:from-neutral-950/60 via-transparent to-transparent md:hidden"
      ></div>
    </div>
    <div
      class="relative z-10 w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center"
    >
      <component
        :is="motion.h2"
        class="text-3xl md:text-4xl lg:text-5xl font-medium text-neutral-900 dark:text-white tracking-tight leading-tight mb-4"
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.2, duration: 0.5 }"
      >
        {{ heading }}
      </component>
      <component
        :is="motion.p"
        v-if="description"
        class="text-base md:text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md"
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.3, duration: 0.5 }"
      >
        {{ description }}
      </component>
      <component
        :is="motion.button"
        v-if="ctaText"
        class="w-fit px-6 py-3 rounded-full text-sm font-medium bg-white text-neutral-900 transition-all duration-300 hover:bg-neutral-200 hover:scale-105 active:scale-[0.98]"
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.4, duration: 0.5 }"
        @click="emit('ctaClick')"
      >
        {{ ctaText }}
      </component>
      <div
        v-if="brandName || services.length > 0"
        class="mt-auto pt-8 flex items-center justify-between"
      >
        <span
          v-if="brandName"
          class="text-sm text-neutral-400 dark:text-neutral-500"
          >{{ brandName }}</span
        >
        <div v-if="services.length > 0" class="flex items-center gap-3">
          <template v-for="(service, index) in services" :key="service">
            <span class="text-sm text-neutral-400 dark:text-neutral-500">{{
              service
            }}</span>
            <span v-if="index < services.length - 1" class="text-neutral-600"
              >&#10022;</span
            >
          </template>
        </div>
      </div>
    </div>
  </component>
</template>
