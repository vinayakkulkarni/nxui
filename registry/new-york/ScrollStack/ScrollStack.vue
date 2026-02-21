<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  interface CardItem {
    id: string | number;
    title?: string;
    description?: string;
    color?: string;
  }

  const props = withDefaults(
    defineProps<{
      cards?: CardItem[];
      cardHeight?: number;
      cardGap?: number;
      stickyTop?: number;
      scaleMultiplier?: number;
      class?: string;
    }>(),
    {
      cards: () => [],
      cardHeight: 320,
      cardGap: 30,
      stickyTop: 80,
      scaleMultiplier: 0.03,
      class: '',
    },
  );

  const scrollerRef = ref<HTMLDivElement | null>(null);
  const cardRefs = ref<HTMLDivElement[]>([]);
  let animFrameId = 0;

  function updateCards() {
    const scroller = scrollerRef.value;
    if (!scroller) return;
    const scrollTop = scroller.scrollTop;

    cardRefs.value.forEach((cardEl, index) => {
      if (!cardEl) return;
      const cardTop = cardEl.offsetTop - scroller.offsetTop - props.stickyTop;
      const progress = Math.max(
        0,
        Math.min(1, (scrollTop - cardTop) / props.cardHeight),
      );

      const scale =
        1 - progress * props.scaleMultiplier * (cardRefs.value.length - index);
      const brightness = 1 - progress * 0.3;
      const translateY = -progress * props.cardGap;

      cardEl.style.transform = `scale(${scale}) translateY(${translateY}px)`;
      cardEl.style.filter = `brightness(${brightness})`;
    });
  }

  function onScroll() {
    cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(updateCards);
  }

  useResizeObserver(scrollerRef, () => {
    updateCards();
  });

  onMounted(() => {
    updateCards();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animFrameId);
  });
</script>

<template>
  <div
    ref="scrollerRef"
    :class="cn('scroll-stack-scroller', $props.class)"
    @scroll="onScroll"
  >
    <div class="scroll-stack-inner">
      <div
        v-for="(card, index) in cards"
        :key="card.id"
        :ref="
          (el) => {
            if (el) cardRefs[index] = el as HTMLDivElement;
          }
        "
        class="scroll-stack-card"
        :style="{
          backgroundColor: card.color || `hsl(${index * 40 + 200}, 70%, 50%)`,
          position: 'sticky',
          top: `${stickyTop + index * 10}px`,
          height: `${cardHeight}px`,
          marginBottom: `${cardGap}px`,
        }"
      >
        <slot name="card" :card="card" :index="index">
          <h3 v-if="card.title" class="scroll-stack-title">
            {{ card.title }}
          </h3>
          <p v-if="card.description" class="scroll-stack-description">
            {{ card.description }}
          </p>
        </slot>
      </div>
      <div class="scroll-stack-end"></div>
    </div>
  </div>
</template>

<style scoped>
  .scroll-stack-scroller {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: visible;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    transform: translateZ(0);
    will-change: scroll-position;
  }

  .scroll-stack-inner {
    padding: 20vh 5rem 50rem;
    min-height: 100vh;
  }

  .scroll-stack-card {
    transform-origin: top center;
    will-change: transform, filter;
    backface-visibility: hidden;
    transform-style: preserve-3d;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
    width: 100%;
    padding: 3rem;
    border-radius: 40px;
    box-sizing: border-box;
    transform: translateZ(0);
    position: relative;
  }

  .scroll-stack-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0 0 0.5rem;
  }

  .scroll-stack-description {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }

  .scroll-stack-end {
    width: 100%;
    height: 1px;
  }
</style>
