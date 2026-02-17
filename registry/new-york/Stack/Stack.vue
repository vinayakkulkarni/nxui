<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, useSlots } from 'vue';
  import { useMediaQuery, useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      randomRotation?: boolean;
      sensitivity?: number;
      cardDimensions?: { width: number; height: number };
      sendToBackOnClick?: boolean;
      autoplay?: boolean;
      autoplayDelay?: number;
      pauseOnHover?: boolean;
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
      class: '',
    },
  );

  const slots = useSlots();
  const isPaused = ref(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const cardCount = computed(() => {
    const slot = slots.default?.();
    return slot ? slot.length : 0;
  });

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

  // Drag handling
  const dragState = ref<{
    active: boolean;
    cardIdx: number;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
  } | null>(null);

  function onPointerDown(e: PointerEvent, idx: number) {
    if (isMobile.value) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragState.value = { active: true, cardIdx: idx, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0 };
  }

  useEventListener('pointermove', (e: PointerEvent) => {
    if (!dragState.value?.active) return;
    dragState.value.dx = e.clientX - dragState.value.startX;
    dragState.value.dy = e.clientY - dragState.value.startY;
  });

  useEventListener('pointerup', () => {
    if (!dragState.value?.active) return;
    const { dx, dy, cardIdx } = dragState.value;
    if (Math.abs(dx) > props.sensitivity || Math.abs(dy) > props.sensitivity) {
      sendToBack(cardIdx);
    }
    dragState.value = null;
  });

  function getCardStyle(slotIdx: number) {
    const stackPos = order.value.indexOf(slotIdx);
    const fromTop = order.value.length - 1 - stackPos;
    const randomRot = props.randomRotation ? Math.random() * 10 - 5 : 0;
    const rotation = fromTop * 4 + randomRot;
    const scale = 1 + stackPos * 0.06 - order.value.length * 0.06;

    let tx = 0;
    let ty = 0;
    if (dragState.value?.active && dragState.value.cardIdx === slotIdx) {
      tx = dragState.value.dx;
      ty = dragState.value.dy;
    }

    return {
      transform: `translate(${tx}px, ${ty}px) rotate(${rotation}deg) scale(${scale})`,
      transformOrigin: '90% 90%',
      zIndex: stackPos,
      transition: dragState.value?.active && dragState.value.cardIdx === slotIdx ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    };
  }

  function handleClick(idx: number) {
    if (props.sendToBackOnClick || isMobile.value) {
      sendToBack(idx);
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
    <div
      v-for="(slotIdx, _i) in order"
      :key="slotIdx"
      class="absolute size-full cursor-grab select-none"
      :style="getCardStyle(slotIdx)"
      @pointerdown="(e) => onPointerDown(e, slotIdx)"
      @click="handleClick(slotIdx)"
    >
      <component :is="$slots.default?.()[slotIdx]" />
    </div>
  </div>
</template>
