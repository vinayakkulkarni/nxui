<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { cn } from '~/lib/utils';
  import type {
    StickyScrollCardItem,
    StickyScrollCardsProps,
  } from '~/types/components';

  const props = withDefaults(defineProps<StickyScrollCardsProps>(), {
    cards: () => [],
    hint: 'scroll down to see card stack',
    class: '',
  });

  // Default demo cards with Unsplash images
  const defaultCards: StickyScrollCardItem[] = [
    {
      title: 'Mountains',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    },
    {
      title: 'Forest',
      src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    },
    {
      title: 'Ocean',
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    },
    {
      title: 'Desert',
      src: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800',
    },
    {
      title: 'Lake',
      src: 'https://images.unsplash.com/photo-1439066615861-d3afbe2af052?w=800',
    },
  ];

  const cards = computed(() =>
    props.cards.length > 0 ? props.cards : defaultCards,
  );

  // Card rotations: subtle tilts cycling
  const cardRotations = [-1.4, 1.0, -0.8, 1.6, -1.1];

  // Refs
  const containerRef = ref<HTMLDivElement | null>(null);
  const cardRefs = ref<HTMLDivElement[]>([]);
  let animFrameId = 0;

  function getTargetScale(index: number, total: number): number {
    return Math.max(0.5, 1 - (total - index - 1) * 0.1);
  }

  function updateCards() {
    const container = containerRef.value;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    // Determine viewport height + container offset relative to scroll target
    let viewportH: number;
    let containerTop: number;
    if (scrollTarget instanceof HTMLElement) {
      const parentRect = scrollTarget.getBoundingClientRect();
      viewportH = scrollTarget.clientHeight;
      containerTop = rect.top - parentRect.top;
    } else {
      viewportH = window.innerHeight;
      containerTop = rect.top;
    }

    const scrollableHeight = rect.height - viewportH;
    if (scrollableHeight <= 0) return;

    const scrolled = -containerTop;
    const scrollProgress = Math.max(
      0,
      Math.min(1, scrolled / scrollableHeight),
    );

    cards.value.forEach((_, index) => {
      const cardEl = cardRefs.value[index];
      if (!cardEl) return;

      const targetScale = getTargetScale(index, cards.value.length);
      const rangeStart = index * 0.25;
      const rangeEnd = 1;

      let scale = 1;
      if (scrollProgress <= rangeStart) {
        scale = 1;
      } else if (scrollProgress >= rangeEnd) {
        scale = targetScale;
      } else {
        const t = (scrollProgress - rangeStart) / (rangeEnd - rangeStart);
        scale = 1 - t * (1 - targetScale);
      }

      cardEl.style.transform = `scale(${scale}) rotate(${cardRotations[index % cardRotations.length]}deg)`;
    });
  }

  function onScroll() {
    cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(updateCards);
  }

  function findScrollParent(el: HTMLElement | null): HTMLElement | Window {
    let node: HTMLElement | null = el?.parentElement ?? null;
    while (node) {
      const overflowY = getComputedStyle(node).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') return node;
      node = node.parentElement;
    }
    return window;
  }

  let scrollTarget: HTMLElement | Window | null = null;

  onMounted(() => {
    scrollTarget = findScrollParent(containerRef.value);
    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    updateCards();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animFrameId);
    scrollTarget?.removeEventListener('scroll', onScroll);
  });

  function setCardRef(el: HTMLDivElement | null, index: number) {
    if (el) cardRefs.value[index] = el;
  }
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative', props.class)"
    style="height: 300vh"
  >
    <div class="sticky top-0 h-screen w-full overflow-hidden">
      <!-- Hint label -->
      <div
        v-if="hint"
        class="absolute left-1/2 top-8 z-20 flex flex-col items-center gap-2"
      >
        <span class="text-sm font-medium text-foreground/60">
          {{ hint }}
        </span>
        <div class="size-0.5 rounded-full bg-foreground/20" />
      </div>

      <!-- Cards stack -->
      <div class="relative flex size-full items-center justify-center">
        <div
          v-for="(card, index) in cards"
          :key="index"
          :ref="(el) => setCardRef(el as HTMLDivElement, index)"
          class="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl will-change-transform"
        >
          <img
            :src="card.src"
            :alt="card.title"
            class="size-full object-cover"
          />
          <div
            class="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"
          />
          <h3
            class="absolute bottom-8 left-8 text-3xl font-bold text-white drop-shadow-lg"
          >
            {{ card.title }}
          </h3>
        </div>
      </div>
    </div>
  </div>
</template>
