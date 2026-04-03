<script setup lang="ts">
  import { useElementHover, useIntersectionObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      speed?: number;
      maxIterations?: number;
      sequential?: boolean;
      revealDirection?: 'start' | 'end' | 'center';
      characters?: string;
      animateOn?: 'view' | 'hover' | 'both';
      class?: string;
      encryptedClass?: string;
    }>(),
    {
      speed: 50,
      maxIterations: 10,
      sequential: true,
      revealDirection: 'start',
      characters:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
      animateOn: 'hover',
      class: '',
      encryptedClass: '',
    },
  );

  const el = ref<HTMLElement>();
  const isHovered = useElementHover(el);
  const isTriggered = ref(false);
  const isScrambling = ref(false);
  const displayText = ref(props.text.split(''));
  const revealedIndices = ref(new Set<number>());

  if (props.animateOn === 'view' || props.animateOn === 'both') {
    useIntersectionObserver(el, ([entry]) => {
      if (entry?.isIntersecting) {
        isTriggered.value = true;
      }
    });
  }

  const shouldAnimate = computed(() => {
    if (props.animateOn === 'hover') return isHovered.value;
    if (props.animateOn === 'view') return isTriggered.value;
    return isHovered.value || isTriggered.value;
  });

  function getNextIndex(revealed: Set<number>): number {
    const len = props.text.length;
    if (props.revealDirection === 'end') return len - 1 - revealed.size;
    if (props.revealDirection === 'center') {
      const mid = Math.floor(len / 2);
      const offset = Math.floor(revealed.size / 2);
      const next = revealed.size % 2 === 0 ? mid + offset : mid - offset - 1;
      if (next >= 0 && next < len && !revealed.has(next)) return next;
      for (let i = 0; i < len; i++) {
        if (!revealed.has(i)) return i;
      }
    }
    return revealed.size;
  }

  function randomChar(): string {
    return props.characters[
      Math.floor(Math.random() * props.characters.length)
    ];
  }

  let interval: ReturnType<typeof setInterval> | undefined;
  let iteration = 0;

  function startScramble() {
    if (isScrambling.value) return;
    isScrambling.value = true;
    iteration = 0;
    revealedIndices.value = new Set();

    interval = setInterval(() => {
      if (props.sequential) {
        if (revealedIndices.value.size < props.text.length) {
          const next = getNextIndex(revealedIndices.value);
          revealedIndices.value.add(next);
        }
        displayText.value = props.text.split('').map((char, i) => {
          if (char === ' ') return ' ';
          if (revealedIndices.value.has(i)) return char;
          return randomChar();
        });
        if (revealedIndices.value.size >= props.text.length) {
          clearInterval(interval);
          isScrambling.value = false;
        }
      } else {
        displayText.value = props.text.split('').map((char) => {
          if (char === ' ') return ' ';
          return randomChar();
        });
        iteration++;
        if (iteration >= props.maxIterations) {
          clearInterval(interval);
          displayText.value = props.text.split('');
          isScrambling.value = false;
        }
      }
    }, props.speed);
  }

  function reset() {
    clearInterval(interval);
    displayText.value = props.text.split('');
    revealedIndices.value = new Set();
    isScrambling.value = false;
  }

  watch(shouldAnimate, (active) => {
    if (active) {
      startScramble();
    } else {
      reset();
    }
  });

  onUnmounted(() => {
    clearInterval(interval);
  });
</script>

<template>
  <span
    ref="el"
    :class="cn('inline-block whitespace-pre-wrap cursor-default', props.class)"
  >
    <span class="sr-only">{{ text }}</span>
    <span aria-hidden="true">
      <span
        v-for="(char, i) in displayText"
        :key="i"
        :class="revealedIndices.has(i) || !isScrambling ? '' : encryptedClass"
        >{{ char }}</span
      >
    </span>
  </span>
</template>
