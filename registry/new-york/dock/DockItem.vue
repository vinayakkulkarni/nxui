<script setup lang="ts">
  import { motion, AnimatePresence, useSpring, useTransform } from 'motion-v';
  import type { MotionValue } from 'framer-motion/dom';
  import type { DockItemData, DockSpringConfig } from './types';
  import { cn } from '~/lib/utils';

  const props = defineProps<{
    item: DockItemData;
    index: number;
    mouseX: MotionValue<number>;
    spring: DockSpringConfig;
    distance: number;
    magnification: number;
    baseItemSize: number;
  }>();

  const itemRef = ref<HTMLElement | null>(null);
  const isHovered = ref(false);
  const sizeVal = ref(`${props.baseItemSize}px`);

  const mouseDistance = useTransform(props.mouseX, (val: number) => {
    const rect = itemRef.value?.getBoundingClientRect() ?? {
      x: 0,
      width: props.baseItemSize,
    };
    return val - rect.x - props.baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-props.distance, 0, props.distance],
    [props.baseItemSize, props.magnification, props.baseItemSize],
  );

  const size = useSpring(targetSize, props.spring);

  onMounted(() => {
    size.on('change', (latest: number) => {
      sizeVal.value = `${latest}px`;
    });
  });
</script>

<template>
  <component
    :is="motion.div"
    ref="itemRef"
    role="button"
    tabindex="0"
    aria-haspopup="true"
    :class="
      cn(
        'relative inline-flex items-center justify-center rounded-[10px]',
        'cursor-pointer bg-background border border-border shadow',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        item.class,
      )
    "
    :style="{
      width: sizeVal,
      height: sizeVal,
    }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @focus="isHovered = true"
    @blur="isHovered = false"
    @click="item.onClick?.()"
  >
    <div class="flex items-center justify-center">
      <slot name="icon" :item="item" :index="index">
        <Icon
          v-if="item.icon"
          :name="item.icon"
          class="size-[60%] text-foreground"
        />
      </slot>
    </div>

    <AnimatePresence>
      <component
        :is="motion.div"
        v-if="isHovered && item.label"
        :initial="{ opacity: 0, y: 0 }"
        :animate="{ opacity: 1, y: -10 }"
        :exit="{ opacity: 0, y: 0 }"
        :transition="{ duration: 0.2 }"
        role="tooltip"
        :class="
          cn(
            'absolute -top-6 left-1/2 -translate-x-1/2',
            'w-fit whitespace-pre rounded-md px-2 py-0.5',
            'bg-background border border-border text-foreground text-xs',
            'pointer-events-none',
          )
        "
      >
        {{ item.label }}
      </component>
    </AnimatePresence>
  </component>
</template>
