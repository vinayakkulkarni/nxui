<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, useSlots } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      cardDistance?: number;
      verticalDistance?: number;
      delay?: number;
      pauseOnHover?: boolean;
      skewAmount?: number;
      class?: string;
    }>(),
    {
      cardDistance: 60,
      verticalDistance: 70,
      delay: 5000,
      pauseOnHover: false,
      skewAmount: 6,
      class: '',
    },
  );

  const slots = useSlots();
  const containerRef = ref<HTMLDivElement>();
  const cardRefs = ref<HTMLDivElement[]>([]);

  let order: number[] = [];
  let intervalId: ReturnType<typeof setInterval> | undefined;
  let isAnimating = false;
  let isPaused = false;

  function getSlot(i: number, total: number) {
    return {
      x: i * props.cardDistance,
      y: -i * props.verticalDistance,
      z: -i * props.cardDistance * 1.5,
      zIndex: total - i,
    };
  }

  function applySlot(el: HTMLElement, slot: ReturnType<typeof getSlot>) {
    el.style.transform = `translate(-50%, -50%) translate3d(${slot.x}px, ${slot.y}px, ${slot.z}px) skewY(${props.skewAmount}deg)`;
    el.style.zIndex = String(slot.zIndex);
  }

  function placeAll() {
    const cards = cardRefs.value;
    order.forEach((cardIdx, slotIdx) => {
      const el = cards[cardIdx];
      if (el) applySlot(el, getSlot(slotIdx, cards.length));
    });
  }

  function swap() {
    if (isAnimating || isPaused || order.length < 2) return;
    isAnimating = true;

    const [front, ...rest] = order;
    const frontEl = cardRefs.value[front];
    if (!frontEl) { isAnimating = false; return; }

    // Drop front card down
    frontEl.style.transition = 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
    const currentSlot = getSlot(0, cardRefs.value.length);
    frontEl.style.transform = `translate(-50%, -50%) translate3d(${currentSlot.x}px, ${currentSlot.y + 500}px, ${currentSlot.z}px) skewY(${props.skewAmount}deg)`;

    // Promote others
    setTimeout(() => {
      rest.forEach((cardIdx, i) => {
        const el = cardRefs.value[cardIdx];
        if (!el) return;
        const slot = getSlot(i, cardRefs.value.length);
        el.style.transition = `transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.1}s`;
        applySlot(el, slot);
      });
    }, 200);

    // Move front to back
    setTimeout(() => {
      const backSlot = getSlot(cardRefs.value.length - 1, cardRefs.value.length);
      frontEl.style.transition = 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
      applySlot(frontEl, backSlot);
      order = [...rest, front];
      setTimeout(() => { isAnimating = false; }, 800);
    }, 600);
  }

  function startInterval() {
    intervalId = setInterval(swap, props.delay);
  }

  function onMouseEnter() {
    if (props.pauseOnHover) {
      isPaused = true;
      clearInterval(intervalId);
    }
  }

  function onMouseLeave() {
    if (props.pauseOnHover) {
      isPaused = false;
      startInterval();
    }
  }

  onMounted(() => {
    const count = cardRefs.value.length;
    order = Array.from({ length: count }, (_, i) => i);
    placeAll();
    // Initial swap after short delay
    setTimeout(swap, 500);
    startInterval();
  });

  onBeforeUnmount(() => {
    clearInterval(intervalId);
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative', $props.class)"
    style="perspective: 900px; overflow: visible"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div
      v-for="(_, i) in (slots.default?.() ?? [])"
      :key="i"
      :ref="(el) => { if (el) cardRefs[i] = el as HTMLDivElement }"
      class="absolute left-1/2 top-1/2 rounded-xl border border-white/20 bg-black"
      style="transform-style: preserve-3d; will-change: transform; backface-visibility: hidden"
    >
      <component :is="(slots.default?.() ?? [])[i]" />
    </div>
  </div>
</template>
