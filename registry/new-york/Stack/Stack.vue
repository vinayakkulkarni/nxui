<script setup lang="ts">
  import {
    type VNode,
    ref,
    computed,
    onMounted,
    onBeforeUnmount,
    useSlots,
    Fragment,
  } from 'vue';
  import { motion } from 'motion-v';
  import { useMediaQuery } from '@vueuse/core';
  import type { StackAnimationConfig } from '~/types/components';
  import { cn } from '~/lib/utils';
  import StackCardRotate from './StackCardRotate.vue';

  const props = withDefaults(
    defineProps<{
      randomRotation?: boolean;
      sensitivity?: number;
      cardDimensions?: { width: number; height: number };
      sendToBackOnClick?: boolean;
      autoplay?: boolean;
      autoplayDelay?: number;
      pauseOnHover?: boolean;
      animationConfig?: StackAnimationConfig;
      class?: string;
    }>(),
    {
      randomRotation: false,
      sensitivity: 200,
      cardDimensions: () => ({ width: 200, height: 200 }),
      sendToBackOnClick: false,
      autoplay: false,
      autoplayDelay: 3000,
      pauseOnHover: false,
      animationConfig: () => ({ stiffness: 260, damping: 20 }),
      class: '',
    },
  );

  const slots = useSlots();
  const isPaused = ref(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Flatten Fragment VNodes (needed for v-for in slot content)
  function flattenVNodes(vnodes: VNode[]): VNode[] {
    return vnodes.flatMap((vnode) =>
      vnode.type === Fragment
        ? flattenVNodes(vnode.children as VNode[])
        : [vnode],
    );
  }

  const flatSlots = computed(() => {
    const slot = slots.default?.();
    return slot ? flattenVNodes(slot) : [];
  });

  const cardCount = computed(() => flatSlots.value.length);

  const order = ref<number[]>([]);

  onMounted(() => {
    order.value = Array.from({ length: cardCount.value }, (_, i) => i);
  });

  function sendToBack(idx: number) {
    order.value = [idx, ...order.value.filter((i) => i !== idx)];
  }

  // Autoplay
  let autoplayTimer: ReturnType<typeof setInterval> | null = null;

  function startAutoplay() {
    if (!props.autoplay || cardCount.value < 2) return;
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      if (isPaused.value) return;
      const topIdx = order.value[order.value.length - 1];
      if (topIdx !== undefined) sendToBack(topIdx);
    }, props.autoplayDelay);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  onMounted(() => startAutoplay());
  onBeforeUnmount(() => stopAutoplay());

  const shouldDisableDrag = computed(() => isMobile.value);
  const shouldEnableClick = computed(
    () => props.sendToBackOnClick || isMobile.value,
  );

  function getRotation(arrayIndex: number) {
    const fromTop = order.value.length - 1 - arrayIndex;
    const randomRot = props.randomRotation ? Math.random() * 10 - 5 : 0;
    return fromTop * 4 + randomRot;
  }

  function getScale(arrayIndex: number) {
    return 1 + arrayIndex * 0.06 - order.value.length * 0.06;
  }

  function handleClick(slotIdx: number) {
    if (shouldEnableClick.value) {
      sendToBack(slotIdx);
    }
  }
</script>

<template>
  <div
    :class="cn('relative size-full', $props.class)"
    style="perspective: 600px"
    @mouseenter="isPaused = pauseOnHover ? true : isPaused"
    @mouseleave="isPaused = pauseOnHover ? false : isPaused"
  >
    <StackCardRotate
      v-for="(slotIdx, arrayIndex) in order"
      :key="slotIdx"
      :sensitivity="sensitivity"
      :disable-drag="shouldDisableDrag"
      @send-to-back="sendToBack(slotIdx)"
    >
      <component
        :is="motion.div"
        class="stack-card flex size-full items-center justify-center overflow-hidden rounded-2xl"
        :animate="{
          rotateZ: getRotation(arrayIndex),
          scale: getScale(arrayIndex),
        }"
        :initial="false"
        :transition="{
          type: 'spring',
          stiffness: animationConfig.stiffness,
          damping: animationConfig.damping,
        }"
        style="transform-origin: 90% 90%"
        @click="handleClick(slotIdx)"
      >
        <component :is="flatSlots[slotIdx]" />
      </component>
    </StackCardRotate>
  </div>
</template>

<style scoped>
  :deep(.stack-card img) {
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
  }
</style>
