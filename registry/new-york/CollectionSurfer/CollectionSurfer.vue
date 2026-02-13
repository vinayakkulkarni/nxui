<script setup lang="ts">
  import { useElementSize, useSwipe, useMousePressed } from '@vueuse/core';
  import type { CollectionItem } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      items?: CollectionItem[];
      class?: string;
    }>(),
    {
      items: () => [],
      class: '',
    },
  );

  const containerRef = ref<HTMLElement>();
  const scrollRef = ref<HTMLElement>();
  const { width: containerWidth } = useElementSize(containerRef);
  const activeIndex = ref(0);
  const dragOffset = ref(0);

  const cardWidth = computed(() => Math.min(300, containerWidth.value * 0.7));

  const totalOffset = computed(() => {
    const center = containerWidth.value / 2 - cardWidth.value / 2;
    return center - activeIndex.value * (cardWidth.value + 16) + dragOffset.value;
  });

  const { pressed } = useMousePressed({ target: scrollRef });
  let startX = 0;
  let startOffset = 0;

  function handlePointerDown(e: PointerEvent) {
    startX = e.clientX;
    startOffset = 0;
  }

  function handlePointerMove(e: PointerEvent) {
    if (!pressed.value) return;
    startOffset = e.clientX - startX;
    dragOffset.value = startOffset;
  }

  function handlePointerUp() {
    const threshold = cardWidth.value * 0.3;
    if (dragOffset.value < -threshold && activeIndex.value < props.items.length - 1) {
      activeIndex.value++;
    } else if (dragOffset.value > threshold && activeIndex.value > 0) {
      activeIndex.value--;
    }
    dragOffset.value = 0;
  }

  function goTo(index: number) {
    activeIndex.value = Math.max(0, Math.min(index, props.items.length - 1));
  }
</script>

<template>
  <div ref="containerRef" :class="cn('relative overflow-hidden', props.class)">
    <div
      ref="scrollRef"
      class="flex cursor-grab items-center py-8 active:cursor-grabbing"
      :style="{ transform: `translateX(${totalOffset}px)`, transition: pressed ? 'none' : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointerleave="handlePointerUp"
    >
      <div
        v-for="(item, index) in props.items"
        :key="item.id"
        class="shrink-0 px-2 transition-transform duration-300"
        :style="{ width: `${cardWidth}px`, transform: index === activeIndex ? 'scale(1.05)' : 'scale(0.95)' }"
      >
        <div class="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div class="h-40 w-full" :style="{ background: item.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }" ></div>
          <div class="p-4">
            <h3 class="font-semibold">{{ item.title }}</h3>
            <p class="mt-1 text-sm text-muted-foreground">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center gap-1.5 pb-4">
      <button
        v-for="(_, index) in props.items"
        :key="index"
        class="size-2 rounded-full transition-colors"
        :class="index === activeIndex ? 'bg-primary' : 'bg-muted-foreground/30'"
        @click="goTo(index)"
      ></button>
    </div>

    <button
      v-if="activeIndex > 0"
      class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border bg-card/80 p-2 shadow-sm backdrop-blur-sm hover:bg-card"
      @click="goTo(activeIndex - 1)"
    >
      <Icon name="lucide:chevron-left" class="size-4" />
    </button>
    <button
      v-if="activeIndex < props.items.length - 1"
      class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-card/80 p-2 shadow-sm backdrop-blur-sm hover:bg-card"
      @click="goTo(activeIndex + 1)"
    >
      <Icon name="lucide:chevron-right" class="size-4" />
    </button>
  </div>
</template>
