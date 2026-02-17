<script setup lang="ts">
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      enableBlur?: boolean;
      baseOpacity?: number;
      baseRotation?: number;
      blurStrength?: number;
      scrollContainer?: HTMLElement | null;
      class?: string;
    }>(),
    {
      enableBlur: true,
      baseOpacity: 0.1,
      baseRotation: 3,
      blurStrength: 4,
      scrollContainer: undefined,
      class: '',
    },
  );

  const el = ref<HTMLElement>();
  const progress = ref(0);

  const words = computed(() =>
    props.text.split(/(\s+)/).filter((w) => w.trim().length > 0),
  );

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

    const raw = 1 - elTopRelative / viewHeight;
    progress.value = Math.min(Math.max(raw, 0), 1);
  }

  useEventListener(scrollTarget, 'scroll', calculateProgress, {
    passive: true,
  });

  watch(scrollTarget, () => nextTick(calculateProgress), { immediate: true });

  function getWordStyle(index: number) {
    const total = words.value.length;
    const wordProgress = Math.min(
      Math.max((progress.value * total - index) / 1, 0),
      1,
    );
    const opacity = props.baseOpacity + (1 - props.baseOpacity) * wordProgress;
    const blur = props.enableBlur ? props.blurStrength * (1 - wordProgress) : 0;
    return {
      opacity,
      filter: blur > 0.1 ? `blur(${blur}px)` : 'none',
      transition: 'opacity 0.1s, filter 0.1s',
    };
  }

  const containerStyle = computed(() => ({
    transform: `rotate(${props.baseRotation * (1 - progress.value)}deg)`,
    transformOrigin: '0% 50%',
    transition: 'transform 0.1s',
  }));
</script>

<template>
  <h2 ref="el" :class="cn('my-5', props.class)" :style="containerStyle">
    <p class="text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] font-semibold">
      <span
        v-for="(word, i) in words"
        :key="i"
        class="inline-block mr-[0.25em]"
        :style="getWordStyle(i)"
        >{{ word }}</span
      >
    </p>
  </h2>
</template>
