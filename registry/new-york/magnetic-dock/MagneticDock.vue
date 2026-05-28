<script setup lang="ts">
  import { motion, useMotionValue } from 'motion-v';
  import type {
    MagneticDockItemData,
    MagneticDockVariant,
    MagneticDockPosition,
  } from './types';
  import { cn } from '~/lib/utils';
  import MagneticDockItem from './MagneticDockItem.vue';

  const props = withDefaults(
    defineProps<{
      items?: MagneticDockItemData[];
      iconSize?: number;
      maxScale?: number;
      magneticDistance?: number;
      showLabels?: boolean;
      position?: MagneticDockPosition;
      variant?: MagneticDockVariant;
      class?: string;
    }>(),
    {
      items: () => [],
      iconSize: 56,
      maxScale: 1.5,
      magneticDistance: 150,
      showLabels: true,
      position: 'bottom',
      variant: 'glass',
      class: '',
    },
  );

  const mousePosition = useMotionValue(Infinity);
  const isVertical = computed(
    () => props.position === 'left' || props.position === 'right',
  );

  const variantStyles = computed(() => {
    const styles: Record<MagneticDockVariant, string> = {
      glass: cn(
        'bg-neutral-100/80 dark:bg-neutral-900/80',
        'backdrop-blur-xl backdrop-saturate-150',
        'border border-neutral-200/80 dark:border-neutral-700',
      ),
      solid: cn(
        'bg-neutral-100 dark:bg-neutral-900',
        'border border-neutral-300 dark:border-neutral-700',
      ),
      transparent: 'bg-transparent border-0',
    };
    return styles[props.variant];
  });

  function handleMouseMove(e: MouseEvent) {
    mousePosition.set(isVertical.value ? e.clientY : e.clientX);
  }

  function handleMouseLeave() {
    mousePosition.set(Infinity);
  }
</script>

<template>
  <component
    :is="motion.div"
    :class="
      cn(
        'inline-flex items-end gap-2 rounded-3xl p-3',
        variantStyles,
        isVertical ? 'flex-col items-center' : 'flex-row',
        'shadow-xl shadow-black/10 dark:shadow-black/30',
        props.class,
      )
    "
    :initial="{ opacity: 0, y: 20 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <MagneticDockItem
      v-for="item in props.items"
      :key="item.label"
      :item="item"
      :mouse-x="mousePosition"
      :icon-size="iconSize"
      :max-scale="maxScale"
      :magnetic-distance="magneticDistance"
      :show-labels="showLabels"
      :is-vertical="isVertical"
    />
  </component>
</template>
