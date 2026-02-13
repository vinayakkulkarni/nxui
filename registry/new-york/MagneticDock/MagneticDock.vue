<script setup lang="ts">
  import { useMouseInElement } from '@vueuse/core';
  import { motion } from 'motion-v';
  import type { DockItem } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      items?: DockItem[];
      magnification?: number;
      distance?: number;
      class?: string;
    }>(),
    {
      items: () => [],
      magnification: 1.5,
      distance: 150,
      class: '',
    },
  );

  const dockRef = ref<HTMLElement>();
  const { elementX, isOutside } = useMouseInElement(dockRef);
  const hoveredIndex = ref(-1);

  const itemRefs = ref<HTMLElement[]>([]);

  function getScale(index: number): number {
    if (isOutside.value) return 1;
    const el = itemRefs.value[index];
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    const dockRect = dockRef.value?.getBoundingClientRect();
    if (!dockRect) return 1;

    const itemCenterX = rect.left - dockRect.left + rect.width / 2;
    const dist = Math.abs(elementX.value - itemCenterX);
    if (dist > props.distance) return 1;

    const scale = 1 + (props.magnification - 1) * (1 - dist / props.distance);
    return scale;
  }
</script>

<template>
  <div
    ref="dockRef"
    :class="cn('flex items-end gap-2 rounded-2xl border bg-card/80 px-3 pb-2 pt-3 shadow-lg backdrop-blur-md', props.class)"
  >
    <div
      v-for="(item, index) in props.items"
      :key="item.label"
      :ref="(el) => { if (el) itemRefs[index] = el as HTMLElement }"
      class="group relative flex flex-col items-center"
      @mouseenter="hoveredIndex = index"
      @mouseleave="hoveredIndex = -1"
    >
      <Transition name="tooltip">
        <div
          v-if="hoveredIndex === index"
          class="absolute -top-8 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md"
        >
          {{ item.label }}
        </div>
      </Transition>
      <component
        :is="motion.button"
        class="flex items-center justify-center rounded-xl bg-muted/50 transition-colors hover:bg-muted"
        :style="{ width: `${getScale(index) * 40}px`, height: `${getScale(index) * 40}px` }"
        :animate="{ width: getScale(index) * 40, height: getScale(index) * 40 }"
        :transition="{ type: 'spring', stiffness: 400, damping: 25 }"
        @click="item.onClick?.()"
      >
        <Icon :name="item.icon" class="size-5 text-foreground" />
      </component>
    </div>
  </div>
</template>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
