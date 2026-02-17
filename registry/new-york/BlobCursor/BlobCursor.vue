<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      blobType?: 'circle' | 'square';
      fillColor?: string;
      trailCount?: number;
      sizes?: number[];
      innerSizes?: number[];
      innerColor?: string;
      opacities?: number[];
      shadowColor?: string;
      shadowBlur?: number;
      shadowOffsetX?: number;
      shadowOffsetY?: number;
      filterStdDeviation?: number;
      useFilter?: boolean;
      fastLerp?: number;
      slowLerp?: number;
      class?: string;
    }>(),
    {
      blobType: 'circle',
      fillColor: '#5227FF',
      trailCount: 3,
      sizes: () => [60, 125, 75],
      innerSizes: () => [20, 35, 25],
      innerColor: 'rgba(255,255,255,0.8)',
      opacities: () => [0.6, 0.6, 0.6],
      shadowColor: 'rgba(0,0,0,0.75)',
      shadowBlur: 5,
      shadowOffsetX: 10,
      shadowOffsetY: 10,
      filterStdDeviation: 30,
      useFilter: true,
      fastLerp: 0.3,
      slowLerp: 0.08,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const blobPositions = ref<{ x: number; y: number }[]>([]);
  let mouseX = 0;
  let mouseY = 0;
  let animationId = 0;

  const filterId = computed(() => `blob-filter-${Math.random().toString(36).slice(2, 8)}`);

  onMounted(() => {
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < props.trailCount; i++) {
      positions.push({ x: 0, y: 0 });
    }
    blobPositions.value = positions;

    function update() {
      animationId = requestAnimationFrame(update);
      const container = containerRef.value;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const localX = mouseX - rect.left;
      const localY = mouseY - rect.top;

      for (let i = 0; i < blobPositions.value.length; i++) {
        const lerp = i === 0 ? props.fastLerp : props.slowLerp;
        blobPositions.value[i].x += (localX - blobPositions.value[i].x) * lerp;
        blobPositions.value[i].y += (localY - blobPositions.value[i].y) * lerp;
      }
    }
    animationId = requestAnimationFrame(update);
  });

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  useEventListener(containerRef, 'touchmove', (e: TouchEvent) => {
    if (e.touches[0]) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative size-full overflow-hidden', $props.class)">
    <svg v-if="useFilter" class="absolute" style="width: 0; height: 0">
      <filter :id="filterId">
        <feGaussianBlur in="SourceGraphic" result="blur" :stdDeviation="filterStdDeviation" />
        <feColorMatrix in="blur" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 35 -10" />
      </filter>
    </svg>
    <div
      class="pointer-events-none absolute inset-0 select-none"
      :style="useFilter ? { filter: `url(#${filterId})` } : undefined"
    >
      <div
        v-for="(pos, i) in blobPositions"
        :key="i"
        class="absolute will-change-transform"
        :style="{
          width: `${sizes[i] ?? 60}px`,
          height: `${sizes[i] ?? 60}px`,
          borderRadius: blobType === 'circle' ? '50%' : '0%',
          backgroundColor: fillColor,
          opacity: opacities[i] ?? 0.6,
          boxShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px 0 ${shadowColor}`,
          transform: `translate(${pos.x - (sizes[i] ?? 60) / 2}px, ${pos.y - (sizes[i] ?? 60) / 2}px)`,
        }"
      >
        <div
          class="absolute"
          :style="{
            width: `${innerSizes[i] ?? 20}px`,
            height: `${innerSizes[i] ?? 20}px`,
            top: `${((sizes[i] ?? 60) - (innerSizes[i] ?? 20)) / 2}px`,
            left: `${((sizes[i] ?? 60) - (innerSizes[i] ?? 20)) / 2}px`,
            backgroundColor: innerColor,
            borderRadius: blobType === 'circle' ? '50%' : '0%',
          }"
        />
      </div>
    </div>
    <slot />
  </div>
</template>
