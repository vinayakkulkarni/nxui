<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useScroll } from 'motion-v';
  import { cn } from '~/lib/utils';
  import StickyScrollCard from './StickyScrollCard.vue';
  import type { StickyScrollCardItem, StickyScrollCardsProps } from './types';

  const props = withDefaults(defineProps<StickyScrollCardsProps>(), {
    cards: () => [],
    hint: 'scroll to explore',
    class: '',
  });

  // Default demo cards with high-quality Unsplash landscape photos
  const defaultCards: StickyScrollCardItem[] = [
    {
      title: 'Misty Alps',
      src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=85',
    },
    {
      title: 'Sunlit Grove',
      src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=85',
    },
    {
      title: 'Turquoise Shore',
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85',
    },
    {
      title: 'Mountain Pass',
      src: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=1200&q=85',
    },
    {
      title: 'Rolling Hills',
      src: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=85',
    },
  ];

  const cards = computed(() =>
    props.cards.length > 0 ? props.cards : defaultCards,
  );

  const containerRef = ref<HTMLDivElement | null>(null);
  // Resolved scroll parent (set onMounted). Null = scroll the window.
  const scrollParent = ref<HTMLElement | null>(null);

  function findScrollParent(el: HTMLElement | null): HTMLElement | null {
    let node: HTMLElement | null = el?.parentElement ?? null;
    while (node) {
      const overflowY = getComputedStyle(node).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') return node;
      node = node.parentElement;
    }
    return null;
  }

  onMounted(() => {
    scrollParent.value = findScrollParent(containerRef.value);
  });

  // Track scroll progress through the container relative to its scroll
  // parent (or the window). Works both in full-page mode and inside
  // scrollable demo wrappers.
  const { scrollYProgress } = useScroll(() => ({
    container: scrollParent.value ?? undefined,
    target: containerRef.value ?? undefined,
    offset: ['start start', 'end end'],
  }));
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'relative flex w-full flex-col items-center justify-center pb-[100vh] pt-[50vh]',
        props.class,
      )
    "
  >
    <!-- Hint label -->
    <div
      v-if="hint"
      class="absolute left-1/2 top-[8%] z-10 flex -translate-x-1/2 flex-col items-center gap-3"
    >
      <p class="text-[10px] font-medium uppercase tracking-[0.2em] opacity-30">
        {{ hint }}
      </p>
      <span
        class="h-12 w-px bg-linear-to-b from-foreground/30 to-transparent"
      />
    </div>

    <StickyScrollCard
      v-for="(card, i) in cards"
      :key="`card_${i}`"
      :i="i"
      :title="card.title"
      :src="card.src"
      :progress="scrollYProgress"
      :range="[i * 0.25, 1]"
      :target-scale="Math.max(0.5, 1 - (cards.length - i - 1) * 0.1)"
    />
  </div>
</template>
