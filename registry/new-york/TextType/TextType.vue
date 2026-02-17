<script setup lang="ts">
  import { useIntersectionObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string | string[];
      typingSpeed?: number;
      deletingSpeed?: number;
      pauseDuration?: number;
      loop?: boolean;
      showCursor?: boolean;
      cursorCharacter?: string;
      startOnView?: boolean;
      class?: string;
    }>(),
    {
      typingSpeed: 50,
      deletingSpeed: 30,
      pauseDuration: 2000,
      loop: true,
      showCursor: true,
      cursorCharacter: '|',
      startOnView: true,
      class: '',
    },
  );

  const el = ref<HTMLElement>();
  const displayedText = ref('');
  const charIndex = ref(0);
  const textIndex = ref(0);
  const isDeleting = ref(false);
  const isVisible = ref(!props.startOnView);

  const textArray = computed(() =>
    Array.isArray(props.text) ? props.text : [props.text],
  );

  if (props.startOnView) {
    useIntersectionObserver(el, ([entry]) => {
      if (entry?.isIntersecting) {
        isVisible.value = true;
      }
    });
  }

  let timeout: ReturnType<typeof setTimeout>;

  function tick() {
    if (!isVisible.value) return;

    const currentText = textArray.value[textIndex.value] ?? '';

    if (isDeleting.value) {
      if (displayedText.value.length > 0) {
        displayedText.value = displayedText.value.slice(0, -1);
        timeout = setTimeout(tick, props.deletingSpeed);
      } else {
        isDeleting.value = false;
        textIndex.value = (textIndex.value + 1) % textArray.value.length;
        charIndex.value = 0;
        timeout = setTimeout(tick, props.pauseDuration);
      }
    } else {
      if (charIndex.value < currentText.length) {
        displayedText.value += currentText[charIndex.value];
        charIndex.value++;
        timeout = setTimeout(tick, props.typingSpeed);
      } else {
        if (textArray.value.length === 1 && !props.loop) return;
        if (!props.loop && textIndex.value === textArray.value.length - 1)
          return;
        timeout = setTimeout(() => {
          isDeleting.value = true;
          tick();
        }, props.pauseDuration);
      }
    }
  }

  watch(isVisible, (visible) => {
    if (visible) tick();
  });

  onMounted(() => {
    if (isVisible.value) tick();
  });

  onUnmounted(() => {
    clearTimeout(timeout);
  });
</script>

<template>
  <span ref="el" :class="cn('inline-block whitespace-pre-wrap', props.class)">
    <span>{{ displayedText }}</span>
    <span
      v-if="showCursor"
      class="ml-0.5 inline-block animate-[cursor-blink_1s_steps(2)_infinite]"
    >
      {{ cursorCharacter }}
    </span>
  </span>
</template>

<style scoped>
  @keyframes cursor-blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
</style>
