<script setup lang="ts">
  import { motion, useMotionValue, useSpring, useTransform } from 'motion-v';
  import type { DockItemData, DockSpringConfig } from './types';
  import { cn } from '~/lib/utils';
  import DockItem from './DockItem.vue';

  const props = withDefaults(
    defineProps<{
      items: DockItemData[];
      class?: string;
      spring?: DockSpringConfig;
      magnification?: number;
      distance?: number;
      panelHeight?: number;
      dockHeight?: number;
      baseItemSize?: number;
    }>(),
    {
      class: '',
      spring: () => ({ mass: 0.1, stiffness: 150, damping: 12 }),
      magnification: 70,
      distance: 200,
      panelHeight: 68,
      dockHeight: 256,
      baseItemSize: 50,
    },
  );

  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const heightVal = ref(`${props.panelHeight}px`);

  const maxHeight = computed(() =>
    Math.max(
      props.dockHeight,
      props.magnification + props.magnification / 2 + 4,
    ),
  );

  const heightRow = useTransform(
    isHovered,
    [0, 1],
    [props.panelHeight, maxHeight.value],
  );

  const height = useSpring(heightRow, props.spring);

  function handleMouseMove(e: MouseEvent) {
    isHovered.set(1);
    mouseX.set(e.clientX);
  }

  function handleMouseLeave() {
    isHovered.set(0);
    mouseX.set(Infinity);
  }

  onMounted(() => {
    height.on('change', (latest: number) => {
      heightVal.value = `${latest}px`;
    });
  });
</script>

<template>
  <component
    :is="motion.div"
    :class="cn('mx-2 flex max-w-full items-center hide-scrollbar', props.class)"
    :style="{
      height: heightVal,
      scrollbarWidth: 'none',
    }"
  >
    <component
      :is="motion.div"
      role="toolbar"
      aria-label="Application dock"
      :class="
        cn(
          'absolute bottom-2 left-1/2 -translate-x-1/2',
          'flex items-end w-fit gap-4',
          'rounded-2xl px-2 pb-2',
          'bg-background border border-border',
        )
      "
      :style="{ height: `${panelHeight}px` }"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <DockItem
        v-for="(item, index) in items"
        :key="index"
        :item="item"
        :index="index"
        :mouse-x="mouseX"
        :spring="spring"
        :distance="distance"
        :magnification="magnification"
        :base-item-size="baseItemSize"
      >
        <template
          v-if="$slots.icon"
          #icon="{ item: slotItem, index: slotIndex }"
        >
          <slot name="icon" :item="slotItem" :index="slotIndex" />
        </template>
      </DockItem>
    </component>
  </component>
</template>
