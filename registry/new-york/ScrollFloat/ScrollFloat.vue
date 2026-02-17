<script setup lang="ts">
  import { useIntersectionObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      stagger?: number;
      class?: string;
    }>(),
    {
      stagger: 0.03,
      class: '',
    },
  );

  const el = ref<HTMLElement>();
  const progress = ref(0);
  const hasEntered = ref(false);

  const chars = computed(() => props.text.split(''));

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
    const raw = 1 - (rect.top - viewH * 0.5) / (viewH * 0.6);
    progress.value = Math.min(Math.max(raw, 0), 1);
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });

  function getCharStyle(index: number) {
    const total = chars.value.length;
    const charProgress = Math.min(
      Math.max(
        (progress.value - (index * props.stagger) / (total * props.stagger)) *
          (1 / (1 - (total - 1) * props.stagger * 0.5)),
        0,
      ),
      1,
    );
    const eased = charProgress < 0.5
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
      >{{ char === ' ' ? '\u00A0' : char }}</span>
    </span>
  </h2>
</template>
