<script setup lang="ts">
  import { motion, useMotionValue, useTransform } from 'motion-v';

  const props = withDefaults(
    defineProps<{
      sensitivity?: number;
      disableDrag?: boolean;
    }>(),
    {
      sensitivity: 200,
      disableDrag: false,
    },
  );

  const emit = defineEmits<{
    (e: 'send-to-back'): void;
  }>();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(
    _event: PointerEvent,
    info: { offset: { x: number; y: number } },
  ) {
    if (
      Math.abs(info.offset.x) > props.sensitivity ||
      Math.abs(info.offset.y) > props.sensitivity
    ) {
      emit('send-to-back');
    } else {
      x.set(0);
      y.set(0);
    }
  }
</script>

<template>
  <component
    :is="motion.div"
    v-if="!disableDrag"
    class="absolute size-full cursor-grab select-none"
    :style="{ x, y, rotateX, rotateY }"
    drag
    :drag-constraints="{ top: 0, right: 0, bottom: 0, left: 0 }"
    :drag-elastic="0.6"
    :while-tap="{ cursor: 'grabbing' }"
    @drag-end="handleDragEnd"
  >
    <slot ></slot>
  </component>
  <div v-else class="absolute size-full cursor-pointer select-none">
    <slot ></slot>
  </div>
</template>
