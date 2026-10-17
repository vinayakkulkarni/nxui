<script setup lang="ts">
  import { computed, useTemplateRef, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { nearest } from './carousel-math';
  import type { CarouselControlsProps } from './types';

  const props = defineProps<CarouselControlsProps>();

  const emit = defineEmits<{
    prev: [];
    next: [];
    go: [index: number];
  }>();

  const counterRef = useTemplateRef<HTMLElement>('counterEl');
  const reducedMotion = usePreferredReducedMotion();

  const slots = computed(() =>
    Array.from({ length: props.count }, (_, index) => index),
  );

  watch(
    () => props.active,
    (current, previous) => {
      const counter = counterRef.value;
      if (!counter || previous === current) return;
      if (reducedMotion.value === 'reduce') return;
      const delta =
        props.loop && props.count > 1
          ? nearest(current - previous, props.count)
          : current - previous;
      counter.animate(
        [
          { transform: `translateY(${delta > 0 ? 70 : -70}%)`, opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      );
    },
    { flush: 'post' },
  );

  function fillScale(index: number): string {
    const full =
      index < props.active || (index === props.active && !props.autoplay);
    return `scaleX(${full ? 1 : 0})`;
  }

  function pad(value: number): string {
    return String(value).padStart(2, '0');
  }

  function onPrev(): void {
    emit('prev');
  }

  function onNext(): void {
    emit('next');
  }

  function onGo(index: number): void {
    emit('go', index);
  }
</script>

<template>
  <div class="carousel-controls" :style="{ width: `${width}px` }">
    <button
      v-if="arrows"
      type="button"
      class="carousel-arrow"
      aria-label="Previous slide"
      :disabled="atStart"
      @click="onPrev"
    >
      <Icon name="lucide:chevron-left" class="size-4" />
    </button>

    <div v-if="indicator === 'dots'" class="carousel-dots">
      <button
        v-for="index in slots"
        :key="index"
        type="button"
        :class="['carousel-dot', index === active && 'is-active']"
        :aria-label="`Go to slide ${index + 1}`"
        :aria-current="index === active ? 'true' : undefined"
        @click="onGo(index)"
      >
        <span class="carousel-dot-mark" />
      </button>
    </div>

    <div v-if="indicator === 'bars'" class="carousel-bars">
      <button
        v-for="index in slots"
        :key="index"
        type="button"
        class="carousel-bar"
        :aria-label="`Go to slide ${index + 1}`"
        :aria-current="index === active ? 'true' : undefined"
        @click="onGo(index)"
      >
        <span class="carousel-bar-track">
          <span
            :ref="(el) => bindFill(el, index)"
            class="carousel-bar-fill"
            :style="{ transform: fillScale(index) }"
          />
        </span>
      </button>
    </div>

    <div v-if="indicator === 'counter'" class="carousel-counter">
      <span ref="counterEl" class="carousel-counter-current">
        {{ pad(active + 1) }}
      </span>
      <span>/</span>
      <span>{{ pad(count) }}</span>
    </div>

    <button
      v-if="arrows"
      type="button"
      class="carousel-arrow"
      aria-label="Next slide"
      :disabled="atEnd"
      @click="onNext"
    >
      <Icon name="lucide:chevron-right" class="size-4" />
    </button>
  </div>
</template>

<style scoped>
  .carousel-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    max-width: 100%;
  }

  .carousel-arrow {
    display: grid;
    place-items: center;
    flex: none;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(--carousel-tile);
    box-shadow:
      inset 0 0 0 1px var(--carousel-tile-edge),
      inset 0 1px 0 var(--carousel-tile-highlight),
      var(--carousel-tile-shadow);
    color: var(--carousel-ink);
    cursor: pointer;
    transition:
      opacity 0.2s ease,
      filter 0.2s ease,
      transform 0.2s ease;
  }

  .carousel-arrow:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .carousel-arrow:not(:disabled):active {
    filter: var(--carousel-press);
    transform: scale(0.92);
    transition-duration: 0s;
  }

  .carousel-arrow:focus-visible,
  .carousel-dot:focus-visible,
  .carousel-bar:focus-visible {
    outline: 2px solid var(--carousel-ink);
    outline-offset: 2px;
  }

  .carousel-dots {
    display: flex;
    align-items: center;
  }

  .carousel-dot {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    cursor: pointer;
  }

  .carousel-dot-mark {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--carousel-faint);
    transition:
      background-color 0.2s ease,
      transform 0.2s ease;
  }

  .carousel-dot.is-active .carousel-dot-mark {
    background: var(--carousel-ink);
    transform: scale(1.2);
  }

  .carousel-bars {
    display: flex;
    flex: 1;
    gap: 6px;
    min-width: 0;
  }

  .carousel-bar {
    display: flex;
    align-items: center;
    flex: 1;
    height: 20px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }

  .carousel-bar-track {
    position: relative;
    width: 100%;
    height: 3px;
    border-radius: 3px;
    background: var(--carousel-faint);
    overflow: hidden;
    transition: background-color 0.2s ease;
  }

  .carousel-bar-fill {
    position: absolute;
    inset: 0;
    background: var(--carousel-ink);
    transform-origin: left center;
  }

  .carousel-counter {
    display: flex;
    align-items: baseline;
    gap: 6px;
    overflow: hidden;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--carousel-muted);
  }

  .carousel-counter-current {
    display: inline-block;
    color: var(--carousel-ink);
  }

  @media (hover: hover) {
    .carousel-arrow:not(:disabled):hover {
      filter: var(--carousel-hover);
    }

    .carousel-arrow:not(:disabled):hover:active {
      filter: var(--carousel-press);
    }

    .carousel-dot:not(.is-active):hover .carousel-dot-mark,
    .carousel-bar:hover .carousel-bar-track {
      background: var(--carousel-soft);
    }
  }
</style>
