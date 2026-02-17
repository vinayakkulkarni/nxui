<script setup lang="ts">
  import { useIntersectionObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      enableBlur?: boolean;
      baseOpacity?: number;
      baseRotation?: number;
      blurStrength?: number;
      class?: string;
    }>(),
    {
      enableBlur: true,
      baseOpacity: 0.1,
      baseRotation: 3,
      blurStrength: 4,
      class: '',
    },
  );

  const el = ref<HTMLElement>();
  const progress = ref(0);
  const hasEntered = ref(false);

  const words = computed(() =>
    props.text.split(/(\s+)/).filter((w) => w.trim().length > 0),
  );

  useIntersectionObserver(
    el,
    ([entry]) => {
      if (entry?.isIntersecting) {
        hasEntered.value = true;
      }
    },
    { threshold: 0.1 },
  );

  function handleScroll() {
    if (!el.value || !hasEntered.value) return;
    const rect = el.value.getBoundingClientRect();
    const viewH = window.innerHeight;
    const raw = 1 - rect.top / viewH;
    progress.value = Math.min(Math.max(raw, 0), 1);
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });

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
