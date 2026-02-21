<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { cn } from '~/lib/utils';

  interface OrbitItem {
    src: string;
    alt?: string;
  }

  const props = withDefaults(
    defineProps<{
      images?: OrbitItem[];
      orbitRadiusX?: number;
      orbitRadiusY?: number;
      orbitRadius?: number;
      itemSize?: number;
      speed?: number;
      showPath?: boolean;
      reverse?: boolean;
      class?: string;
    }>(),
    {
      images: () => [],
      orbitRadiusX: 0,
      orbitRadiusY: 0,
      orbitRadius: 160,
      itemSize: 60,
      speed: 20,
      showPath: true,
      reverse: false,
      class: '',
    },
  );

  const rx = computed(() => props.orbitRadiusX || props.orbitRadius);
  const ry = computed(() => props.orbitRadiusY || props.orbitRadius * 0.55);
  const containerW = computed(() => rx.value * 2 + props.itemSize + 20);
  const containerH = computed(() => ry.value * 2 + props.itemSize + 20);
  const animating = ref(true);
  let animId = 0;
  const rotation = ref(0);

  function animate() {
    if (!animating.value) return;
    rotation.value += (props.reverse ? -1 : 1) * props.speed * 0.01;
    animId = requestAnimationFrame(animate);
  }

  function getItemPosition(index: number) {
    const totalItems = props.images.length;
    const angle = (index / totalItems) * Math.PI * 2 + (rotation.value * Math.PI) / 180;
    const x = Math.cos(angle) * rx.value;
    const y = Math.sin(angle) * ry.value;
    return { x, y };
  }

  onMounted(() => {
    animId = requestAnimationFrame(animate);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animId);
  });
</script>

<template>
  <div
    :class="cn('orbit-container', $props.class)"
    :style="{
      width: `${containerW}px`,
      height: `${containerH}px`,
    }"
  >
    <svg
      v-if="showPath"
      class="orbit-path-svg"
      :viewBox="`0 0 ${containerW} ${containerH}`"
    >
      <ellipse
        :cx="containerW / 2"
        :cy="containerH / 2"
        :rx="rx"
        :ry="ry"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        stroke-width="1"
      />
    </svg>

    <div
      v-for="(image, index) in images"
      :key="index"
      class="orbit-item"
      :style="{
        width: `${itemSize}px`,
        height: `${itemSize}px`,
        left: `${containerW / 2 + getItemPosition(index).x - itemSize / 2}px`,
        top: `${containerH / 2 + getItemPosition(index).y - itemSize / 2}px`,
      }"
    >
      <img
        :src="image.src"
        :alt="image.alt || ''"
        class="orbit-image"
      />
    </div>

    <div class="orbit-center-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
  .orbit-container {
    position: relative;
    margin-left: auto;
    margin-right: auto;
  }

  .orbit-path-svg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .orbit-item {
    position: absolute;
    will-change: transform;
    user-select: none;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .orbit-center-content {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .orbit-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(100%);
  }
</style>
