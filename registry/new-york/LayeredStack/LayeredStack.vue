<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      class?: string;
    }>(),
    {
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const isStacked = ref(true);
  const animations = ref<Animation[]>([]);

  // Approximate GSAP expo.out as cubic-bezier
  const EXPO_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const DURATION = 800;

  function cancelAll() {
    for (const anim of animations.value) {
      anim.cancel();
    }
    animations.value = [];
  }

  function getCards(): HTMLElement[] {
    if (!containerRef.value) return [];
    return Array.from(containerRef.value.children) as HTMLElement[];
  }

  function setTransform(
    el: HTMLElement,
    x: number,
    y: number,
    rotate: number,
    zIndex: number,
  ) {
    el.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg)`;
    el.style.zIndex = String(zIndex);
  }

  function computeOffset(card: HTMLElement, container: HTMLElement) {
    return {
      x:
        container.clientWidth / 2 -
        card.offsetWidth / 2 -
        card.offsetLeft,
      y:
        container.clientHeight / 2 -
        card.offsetHeight / 2 -
        card.offsetTop,
    };
  }

  function stackCards(animate = true) {
    const container = containerRef.value;
    if (!container) return;

    isStacked.value = true;
    cancelAll();
    const cards = getCards();

    // Clear transforms so we can measure natural positions
    for (const card of cards) {
      card.style.transform = 'translate(0px, 0px) rotate(0deg)';
    }

    // Wait for layout recalculation
    requestAnimationFrame(() => {
      if (!containerRef.value || !isStacked.value) return;
      const freshCards = getCards();

      for (let i = 0; i < freshCards.length; i++) {
        const card = freshCards[i]!;
        const { x, y } = computeOffset(card, containerRef.value);
        const rotate = Math.random() * 20 - 10; // random -10 to 10
        const zIndex = 100 - i;

        if (!animate) {
          setTransform(card, x, y, rotate, zIndex);
        } else {
          card.style.zIndex = String(zIndex);
          const anim = card.animate(
            [
              { transform: 'translate(0px, 0px) rotate(0deg)' },
              {
                transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`,
              },
            ],
            {
              duration: DURATION,
              easing: EXPO_OUT,
              fill: 'forwards',
            },
          );
          animations.value.push(anim);
        }
      }
    });
  }

  function resetCards() {
    const container = containerRef.value;
    if (!container) return;

    isStacked.value = false;
    cancelAll();
    const cards = getCards();

    // Capture current transforms before resetting
    const currentTransforms = cards.map((card) => {
      const style = getComputedStyle(card);
      return style.transform || 'none';
    });

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]!;
      const delay = (i / cards.length) * 100; // stagger amount: 100ms total
      card.style.zIndex = String(100 - i);

      const anim = card.animate(
        [
          { transform: currentTransforms[i] ?? 'none' },
          { transform: 'translate(0px, 0px) rotate(0deg)' },
        ],
        {
          duration: DURATION,
          easing: EXPO_OUT,
          fill: 'forwards',
          delay,
        },
      );
      animations.value.push(anim);
    }
  }

  useResizeObserver(containerRef, () => {
    if (isStacked.value) {
      stackCards(false);
    }
  });

  onMounted(() => {
    nextTick(() => {
      const cards = getCards();
      for (let i = 0; i < cards.length; i++) {
        cards[i]!.style.zIndex = String(100 - i);
      }
      stackCards();
    });
  });

  onBeforeUnmount(() => {
    cancelAll();
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative', props.class)"
    @mouseenter="resetCards"
    @mouseleave="stackCards(true)"
  >
    <slot></slot>
  </div>
</template>
