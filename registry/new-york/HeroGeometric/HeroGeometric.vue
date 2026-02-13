<script setup lang="ts">
  import { motion } from 'motion-v';
  import { useWindowSize } from '@vueuse/core';
  import type { GeometricShape } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      title?: string;
      subtitle?: string;
      badge?: string;
      badgeIcon?: string;
      class?: string;
    }>(),
    {
      title: 'Components for Perfectionists',
      subtitle: 'Beautiful animated Vue components you can copy and paste.',
      badge: 'Open Source',
      badgeIcon: 'lucide:sparkles',
      class: '',
    },
  );

  const { width } = useWindowSize();

  const shapes = computed<GeometricShape[]>(() => {
    const w = width.value;
    return [
      { type: 'circle', size: 80, x: w * 0.1, y: 100, color: 'rgba(139, 92, 246, 0.15)', rotation: 0, delay: 0 },
      { type: 'square', size: 60, x: w * 0.85, y: 150, color: 'rgba(59, 130, 246, 0.12)', rotation: 45, delay: 0.5 },
      { type: 'diamond', size: 50, x: w * 0.7, y: 80, color: 'rgba(236, 72, 153, 0.1)', rotation: 0, delay: 1 },
      { type: 'circle', size: 120, x: w * 0.2, y: 350, color: 'rgba(34, 211, 238, 0.08)', rotation: 0, delay: 1.5 },
      { type: 'triangle', size: 70, x: w * 0.5, y: 60, color: 'rgba(251, 191, 36, 0.1)', rotation: 30, delay: 0.8 },
      { type: 'square', size: 40, x: w * 0.15, y: 250, color: 'rgba(168, 85, 247, 0.12)', rotation: 15, delay: 2 },
      { type: 'diamond', size: 90, x: w * 0.9, y: 300, color: 'rgba(99, 102, 241, 0.1)', rotation: 0, delay: 0.3 },
    ];
  });

  function shapeClasses(shape: GeometricShape): string {
    if (shape.type === 'circle') return 'rounded-full';
    if (shape.type === 'diamond') return 'rotate-45';
    return '';
  }
</script>

<template>
  <div :class="cn('relative flex min-h-[500px] items-center justify-center overflow-hidden bg-background', props.class)">
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" ></div>

    <component
      :is="motion.div"
      v-for="(shape, i) in shapes"
      :key="i"
      class="pointer-events-none absolute opacity-0"
      :class="shapeClasses(shape)"
      :style="{
        width: `${shape.size}px`,
        height: `${shape.size}px`,
        left: `${shape.x}px`,
        top: `${shape.y}px`,
        backgroundColor: shape.color,
        borderRadius: shape.type === 'triangle' ? '0' : undefined,
        clipPath: shape.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
      }"
      :initial="{ opacity: 0, y: 30, rotate: shape.rotation }"
      :animate="{ opacity: 1, y: [0, -20, 0], rotate: shape.rotation + 360 }"
      :transition="{
        opacity: { duration: 1, delay: shape.delay },
        y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: shape.delay },
        rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
      }"
    />

    <div class="relative z-10 mx-auto max-w-3xl px-4 text-center">
      <component
        :is="motion.div"
        v-if="props.badge"
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5 }"
        class="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-sm text-muted-foreground"
      >
        <Icon v-if="props.badgeIcon" :name="props.badgeIcon" class="size-3.5" />
        {{ props.badge }}
      </component>

      <component
        :is="motion.h1"
        class="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
        :initial="{ opacity: 0, y: 20, filter: 'blur(10px)' }"
        :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :transition="{ duration: 0.8, delay: 0.2 }"
      >
        {{ props.title }}
      </component>

      <component
        :is="motion.p"
        class="mx-auto max-w-xl text-lg text-muted-foreground"
        :initial="{ opacity: 0, y: 20, filter: 'blur(10px)' }"
        :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :transition="{ duration: 0.8, delay: 0.4 }"
      >
        {{ props.subtitle }}
      </component>

      <div class="mt-8">
        <slot ></slot>
      </div>
    </div>
  </div>
</template>
