<script setup lang="ts">
  import { motion } from 'motion-v';

  const props = defineProps<{
    containerRef?: HTMLDivElement;
    lineColor: string;
    lineWidth: string;
    lineHeight: string;
    baseAngle: number;
  }>();

  const lineRef = ref<InstanceType<typeof HTMLDivElement> | null>(null);
  const rotate = ref(props.baseAngle);

  function getEl(): HTMLElement | null {
    const val = lineRef.value;
    if (!val) return null;
    // motion.div component: access the underlying DOM element via $el
    if (val instanceof HTMLElement) return val;
    if (typeof val === 'object' && '$el' in val) return val.$el as HTMLElement;
    return null;
  }

  function updateRotation(e: MouseEvent) {
    const el = getEl();
    if (!el || !props.containerRef) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    const angle =
      (Math.atan2(distanceY, distanceX) * 180) / Math.PI;
    rotate.value = angle + props.baseAngle;
  }

  onMounted(() => {
    window.addEventListener('mousemove', updateRotation);
  });

  onUnmounted(() => {
    window.removeEventListener('mousemove', updateRotation);
  });
</script>

<template>
  <component
    :is="motion.div"
    ref="lineRef"
    :animate="{ rotate }"
    :transition="{ type: 'spring', damping: 20, stiffness: 300 }"
    :style="{
      width: props.lineWidth,
      height: props.lineHeight,
      backgroundColor: props.lineColor,
    }"
  />
</template>
