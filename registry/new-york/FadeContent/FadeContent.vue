<script setup lang="ts">
  import { ref } from 'vue';
  import { useIntersectionObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      blur?: boolean;
      duration?: number;
      ease?: string;
      delay?: number;
      threshold?: number;
      initialOpacity?: number;
      class?: string;
    }>(),
    {
      blur: false,
      duration: 1,
      ease: 'cubic-bezier(0.33, 1, 0.68, 1)',
      delay: 0,
      threshold: 0.1,
      initialOpacity: 0,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const isVisible = ref(false);
  const hasAnimated = ref(false);

  useIntersectionObserver(
    containerRef,
    ([{ isIntersecting }]) => {
      if (isIntersecting && !hasAnimated.value) {
        isVisible.value = true;
        hasAnimated.value = true;
      }
    },
    { threshold: props.threshold },
  );
</script>

<template>
  <div
    ref="containerRef"
    :class="cn($props.class)"
    :style="{
      opacity: isVisible ? '1' : String(initialOpacity),
      filter: isVisible ? 'blur(0px)' : blur ? 'blur(10px)' : 'blur(0px)',
      transition: `opacity ${duration}s ${ease} ${delay}s, filter ${duration}s ${ease} ${delay}s`,
      willChange: 'opacity, filter',
    }"
  >
    <slot></slot>
  </div>
</template>
