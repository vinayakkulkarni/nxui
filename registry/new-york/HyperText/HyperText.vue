<script setup lang="ts">
  import { useElementHover, useIntervalFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      duration?: number;
      animateOnLoad?: boolean;
      class?: string;
    }>(),
    {
      duration: 800,
      animateOnLoad: true,
      class: '',
    },
  );

  const ALPHABETS =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const el = ref<HTMLElement>();
  const isHovered = useElementHover(el);
  const displayText = ref(props.text.split(''));
  const iterations = ref(0);
  const isAnimating = ref(false);

  function startAnimation() {
    iterations.value = 0;
    isAnimating.value = true;
  }

  const intervalMs = computed(() => props.duration / (props.text.length * 10));

  const { pause, resume } = useIntervalFn(
    () => {
      if (iterations.value < props.text.length) {
        displayText.value = props.text.split('').map((letter, i) => {
          if (letter === ' ') return ' ';
          if (i <= iterations.value) return props.text[i] ?? '';
          return ALPHABETS[Math.floor(Math.random() * ALPHABETS.length)];
        });
        iterations.value += 0.1;
      } else {
        isAnimating.value = false;
        pause();
      }
    },
    intervalMs,
    { immediate: false },
  );

  watch(isHovered, (hovered) => {
    if (hovered) {
      startAnimation();
      resume();
    }
  });

  onMounted(() => {
    if (props.animateOnLoad) {
      startAnimation();
      resume();
    }
  });
</script>

<template>
  <div
    ref="el"
    :class="
      cn('flex cursor-default overflow-hidden py-2 font-mono', props.class)
    "
  >
    <span v-for="(letter, i) in displayText" :key="i" class="min-w-[0.1em]">
      {{ letter }}
    </span>
  </div>
</template>
