<script setup lang="ts">
  // Drag-to-reorder list with lift (scale + tilt + shadow), spring-shifting
  // siblings, and an empty-space cutout marking the drop slot.
  // Inspired by the "Design Engineering 101" drag interaction by @alyx_so.
  import { ref, computed, watch } from 'vue';
  import { motion } from 'motion-v';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type { DragReorderListProps } from './types';

  const props = withDefaults(defineProps<DragReorderListProps>(), {
    itemHeight: 56,
    gap: 8,
    showHandle: true,
    liftScale: 1.04,
    maxTilt: 3,
    stiffness: 500,
    damping: 38,
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [items: string[]];
  }>();

  const order = ref<string[]>([...props.modelValue]);
  const activeItem = ref<string | null>(null);

  watch(
    () => props.modelValue,
    (next) => {
      if (activeItem.value === null) order.value = [...next];
    },
  );
  const dragY = ref(0);
  const tilt = ref(0);

  const step = computed(() => props.itemHeight + props.gap);
  const listHeight = computed(
    () => order.value.length * step.value - props.gap,
  );

  const slotOf = (item: string) => order.value.indexOf(item);
  const yOf = (item: string) => slotOf(item) * step.value;

  let startPointerY = 0;
  let startItemY = 0;
  let lastPointerY = 0;
  let lastMoveTime = 0;

  function onPointerDown(item: string, e: PointerEvent) {
    activeItem.value = item;
    startPointerY = e.clientY;
    lastPointerY = e.clientY;
    lastMoveTime = e.timeStamp;
    startItemY = yOf(item);
    dragY.value = startItemY;
    tilt.value = 0;
  }

  function onPointerMove(e: PointerEvent) {
    const item = activeItem.value;
    if (item === null) return;

    const rawY = startItemY + (e.clientY - startPointerY);
    const maxY = (order.value.length - 1) * step.value;
    dragY.value = Math.min(
      Math.max(rawY, -step.value * 0.4),
      maxY + step.value * 0.4,
    );

    // Velocity-driven tilt, exponentially smoothed.
    const dt = Math.max(e.timeStamp - lastMoveTime, 1);
    const velocity = (e.clientY - lastPointerY) / dt;
    const target = Math.min(
      Math.max(velocity * 12, -props.maxTilt),
      props.maxTilt,
    );
    tilt.value = tilt.value * 0.75 + target * 0.25;
    lastPointerY = e.clientY;
    lastMoveTime = e.timeStamp;

    // Live-reorder: shift the item into the slot under the pointer.
    const targetSlot = Math.min(
      Math.max(Math.round(dragY.value / step.value), 0),
      order.value.length - 1,
    );
    const currentSlot = slotOf(item);
    if (targetSlot !== currentSlot) {
      const next = [...order.value];
      next.splice(currentSlot, 1);
      next.splice(targetSlot, 0, item);
      order.value = next;
    }
  }

  function onPointerUp() {
    if (activeItem.value === null) return;
    activeItem.value = null;
    tilt.value = 0;
    emit('update:modelValue', [...order.value]);
  }

  function onRowPointerDown(item: string, e: PointerEvent) {
    if (!props.showHandle) onPointerDown(item, e);
  }

  useEventListener(window, 'pointermove', onPointerMove);
  useEventListener(window, 'pointerup', onPointerUp);
  useEventListener(window, 'pointercancel', onPointerUp);

  const spring = computed(() => ({
    type: 'spring' as const,
    stiffness: props.stiffness,
    damping: props.damping,
  }));
</script>

<template>
  <div
    :class="cn('relative w-full select-none', props.class)"
    :style="{ height: `${listHeight}px` }"
  >
    <!-- Empty-space cutout marking the drop slot -->
    <component
      :is="motion.div"
      v-if="activeItem !== null"
      class="pointer-events-none absolute inset-x-0 rounded-xl border border-dashed border-foreground/20 bg-foreground/4"
      :style="{ height: `${itemHeight}px` }"
      :initial="false"
      :animate="{ y: yOf(activeItem), opacity: 1 }"
      :transition="spring"
    />

    <component
      :is="motion.div"
      v-for="item in order"
      :key="item"
      class="absolute inset-x-0 top-0"
      :style="{
        height: `${itemHeight}px`,
        zIndex: item === activeItem ? 10 : 1,
      }"
      :initial="false"
      :animate="{
        y: item === activeItem ? dragY : yOf(item),
        scale: item === activeItem ? liftScale : 1,
        rotate: item === activeItem ? tilt : 0,
      }"
      :transition="item === activeItem ? { duration: 0 } : spring"
    >
      <div
        :class="
          cn(
            'flex h-full items-center gap-3 rounded-xl border bg-card px-4 transition-shadow duration-200',
            item === activeItem
              ? 'border-foreground/15 shadow-xl shadow-black/20'
              : 'border-border shadow-sm',
            showHandle ? '' : 'touch-none cursor-grab',
          )
        "
        @pointerdown="onRowPointerDown(item, $event)"
      >
        <button
          v-if="showHandle"
          type="button"
          class="-ml-1 flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          :aria-label="`Drag to reorder ${item}`"
          @pointerdown.prevent="onPointerDown(item, $event)"
        >
          <Icon name="lucide:grip-vertical" class="size-4" />
        </button>
        <slot :item="item" :index="slotOf(item)">
          <span class="truncate text-sm font-medium text-foreground">
            {{ item }}
          </span>
        </slot>
      </div>
    </component>
  </div>
</template>
