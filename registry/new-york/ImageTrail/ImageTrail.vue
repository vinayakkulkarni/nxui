<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      images?: string[];
      imageWidth?: number;
      imageHeight?: number;
      sensitivity?: number;
      fadeOutDuration?: number;
      rotationRange?: number;
      class?: string;
    }>(),
    {
      images: () => [],
      imageWidth: 190,
      imageHeight: 209,
      sensitivity: 80,
      fadeOutDuration: 1200,
      rotationRange: 15,
      class: '',
    },
  );

  interface TrailImage {
    x: number;
    y: number;
    opacity: number;
    scale: number;
    rotation: number;
    zIndex: number;
    birth: number;
    index: number;
  }

  const containerRef = ref<HTMLDivElement | null>(null);
  const activeImages = ref<TrailImage[]>([]);
  let currentIndex = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let accumulatedDistance = 0;
  let zIndex = 1;
  let animId = 0;

  function getDistance(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  function showNextImage(x: number, y: number) {
    if (!props.images.length) return;
    zIndex++;
    activeImages.value.push({
      x: x - props.imageWidth / 2,
      y: y - props.imageHeight / 2,
      opacity: 1,
      scale: 1,
      rotation: (Math.random() - 0.5) * 2 * props.rotationRange,
      zIndex,
      birth: performance.now(),
      index: currentIndex % props.images.length,
    });
    currentIndex = (currentIndex + 1) % props.images.length;
  }

  function animate() {
    const now = performance.now();
    for (let i = activeImages.value.length - 1; i >= 0; i--) {
      const img = activeImages.value[i];
      const age = now - img.birth;
      if (age > props.fadeOutDuration) {
        activeImages.value.splice(i, 1);
        continue;
      }
      const progress = age / props.fadeOutDuration;
      img.opacity = 1 - progress;
      img.scale = 1 - progress * 0.5;
    }
    animId = requestAnimationFrame(animate);
  }

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const distance = getDistance(lastMouseX, lastMouseY, x, y);
    accumulatedDistance += distance;
    if (accumulatedDistance >= props.sensitivity) {
      showNextImage(x, y);
      accumulatedDistance = 0;
    }
    lastMouseX = x;
    lastMouseY = y;
  });

  onMounted(() => {
    animId = requestAnimationFrame(animate);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animId);
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('image-trail-content', $props.class)"
  >
    <div
      v-for="(img, i) in activeImages"
      :key="`${img.birth}-${i}`"
      class="image-trail-img"
      :style="{
        transform: `translate(${img.x}px, ${img.y}px) scale(${img.scale}) rotate(${img.rotation}deg)`,
        opacity: img.opacity,
        zIndex: img.zIndex,
      }"
    >
      <div
        class="image-trail-img-inner"
        :style="{ backgroundImage: `url(${images[img.index]})` }"
      ></div>
    </div>
    <slot ></slot>
  </div>
</template>

<style scoped>
  .image-trail-content {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 100;
    border-radius: 8px;
    background: transparent;
    overflow: visible;
  }

  .image-trail-img {
    width: v-bind('`${imageWidth}px`');
    aspect-ratio: 1.1;
    border-radius: 15px;
    position: absolute;
    top: 0;
    left: 0;
    overflow: hidden;
    will-change: transform, opacity;
    pointer-events: none;
  }

  .image-trail-img-inner {
    background-position: 50% 50%;
    width: calc(100% + 20px);
    height: calc(100% + 20px);
    background-size: cover;
    position: absolute;
    top: -10px;
    left: -10px;
  }
</style>
