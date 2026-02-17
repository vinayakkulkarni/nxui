<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import {
    useMediaQuery,
    useResizeObserver,
    useIntersectionObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  interface MasonryItem {
    id: string | number;
    img: string;
    height: number;
    url?: string;
  }

  const props = withDefaults(
    defineProps<{
      items?: MasonryItem[];
      scaleOnHover?: boolean;
      hoverScale?: number;
      blurToFocus?: boolean;
      class?: string;
    }>(),
    {
      items: () => [],
      scaleOnHover: true,
      hoverScale: 0.95,
      blurToFocus: true,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const containerWidth = ref(0);
  const isVisible = ref(false);
  const hasAnimated = ref(false);

  // Responsive columns via VueUse
  const is1500 = useMediaQuery('(min-width: 1500px)');
  const is1000 = useMediaQuery('(min-width: 1000px)');
  const is600 = useMediaQuery('(min-width: 600px)');
  const is400 = useMediaQuery('(min-width: 400px)');

  const columns = computed(() => {
    if (is1500.value) return 5;
    if (is1000.value) return 4;
    if (is600.value) return 3;
    if (is400.value) return 2;
    return 1;
  });

  useResizeObserver(containerRef, (entries) => {
    const entry = entries[0];
    if (entry) containerWidth.value = entry.contentRect.width;
  });

  useIntersectionObserver(
    containerRef,
    ([entry]) => {
      if (entry?.isIntersecting && !hasAnimated.value) {
        isVisible.value = true;
        hasAnimated.value = true;
      }
    },
    { threshold: 0.1 },
  );

  const grid = computed(() => {
    if (!containerWidth.value || !props.items.length) return [];
    const colHeights = Array.from<number>({ length: columns.value }).fill(0);
    const colWidth = containerWidth.value / columns.value;

    return props.items.map((item) => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = colWidth * col;
      const h = item.height / 2;
      const y = colHeights[col];
      colHeights[col] += h;
      return { ...item, x, y, w: colWidth, h };
    });
  });

  const containerHeight = computed(() => {
    if (!grid.value.length) return 0;
    return Math.max(...grid.value.map((item) => item.y + item.h));
  });

  function handleClick(url?: string) {
    if (url) window.open(url, '_blank', 'noopener');
  }

  onMounted(() => {
    if (containerRef.value)
      containerWidth.value = containerRef.value.clientWidth;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative w-full', $props.class)"
    :style="{ height: `${containerHeight}px` }"
  >
    <div
      v-for="(item, index) in grid"
      :key="item.id"
      class="absolute cursor-pointer p-1.5"
      :class="[isVisible ? 'masonry-item--visible' : 'masonry-item--hidden']"
      :style="{
        '--delay': `${index * 50}ms`,
        transform: `translate(${item.x}px, ${item.y}px)`,
        width: `${item.w}px`,
        height: `${item.h}px`,
      }"
      @click="handleClick(item.url)"
    >
      <div
        class="size-full rounded-lg bg-cover bg-center shadow-lg"
        :class="
          scaleOnHover
            ? 'transition-transform duration-300 hover:scale-[var(--hover-scale)]'
            : ''
        "
        :style="{
          '--hover-scale': hoverScale,
          backgroundImage: `url(${item.img})`,
        }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
  .masonry-item--hidden {
    opacity: 0;
    filter: blur(10px);
  }

  .masonry-item--visible {
    opacity: 1;
    filter: blur(0);
    transition:
      opacity 0.8s ease-out var(--delay),
      filter 0.8s ease-out var(--delay),
      transform 0.6s ease-out;
  }
</style>
