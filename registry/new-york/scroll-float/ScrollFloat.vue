<script setup lang="ts">
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      animationDuration?: number;
      stagger?: number;
      scrollContainer?: HTMLElement | null;
      class?: string;
    }>(),
    {
      animationDuration: 1,
      stagger: 0.03,
      scrollContainer: undefined,
      class: '',
    },
  );

  const el = ref<HTMLElement>();
  const progress = ref(0);

  const chars = computed(() => props.text.split(''));

  const scrollTarget = computed<EventTarget>(
    () => props.scrollContainer ?? window,
  );

  function calculateProgress() {
    if (!el.value) return;

    let viewTop: number;
    let viewHeight: number;

    if (props.scrollContainer) {
      const containerRect = props.scrollContainer.getBoundingClientRect();
      viewTop = containerRect.top;
      viewHeight = containerRect.height;
    } else {
      viewTop = 0;
      viewHeight = window.innerHeight;
    }

    const elRect = el.value.getBoundingClientRect();
    const elTopRelative = elRect.top - viewTop;

    const raw = 1 - (elTopRelative - viewHeight * 0.3) / (viewHeight * 0.7);
    progress.value = Math.min(Math.max(raw, 0), 1);
  }

  useEventListener(scrollTarget, 'scroll', calculateProgress, {
    passive: true,
  });

  watch(scrollTarget, () => nextTick(calculateProgress), { immediate: true });

  function getCharStyle(index: number) {
    const total = chars.value.length;
    // Stagger range: how much of the progress timeline is spent on stagger offset
    // Clamped to 0.95 so each char still has at least 5% animation window
    const staggerRange = Math.min((total - 1) * props.stagger, 0.95);
    // Each char starts at a staggered offset and ends so the last char finishes at progress=1
    const charStart = total > 1 ? (index / (total - 1)) * staggerRange : 0;
    const charEnd = charStart + (1 - staggerRange);
    const charProgress = Math.min(
      Math.max((progress.value - charStart) / (charEnd - charStart), 0),
      1,
    );
    const eased =
      charProgress < 0.5
        ? 4 * charProgress * charProgress * charProgress
        : 1 - (-2 * charProgress + 2) ** 3 / 2;

    return {
      opacity: eased,
      transform: `translateY(${(1 - eased) * 120}%) scaleY(${1 + (1 - eased) * 1.3}) scaleX(${1 - (1 - eased) * 0.3})`,
      transformOrigin: '50% 0%',
      transition: 'none',
    };
  }
</script>

<template>
  <h2 ref="el" :class="cn('my-5 overflow-hidden', props.class)">
    <span class="inline-block text-[clamp(1.6rem,4vw,3rem)] leading-[1.5]">
      <span
        v-for="(char, i) in chars"
        :key="i"
        class="inline-block will-change-[transform,opacity]"
        :style="getCharStyle(i)"
        >{{ char === ' ' ? '\u00A0' : char }}</span
      >
    </span>
  </h2>
</template>
