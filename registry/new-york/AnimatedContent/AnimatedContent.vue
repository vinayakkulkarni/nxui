<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useIntersectionObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      distance?: number;
      direction?: 'vertical' | 'horizontal';
      reverse?: boolean;
      duration?: number;
      ease?: string;
      initialOpacity?: number;
      animateOpacity?: boolean;
      scale?: number;
      threshold?: number;
      delay?: number;
      class?: string;
    }>(),
    {
      distance: 100,
      direction: 'vertical',
      reverse: false,
      duration: 0.8,
      ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
      initialOpacity: 0,
      animateOpacity: true,
      scale: 1,
      threshold: 0.1,
      delay: 0,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const isVisible = ref(false);
  const hasAnimated = ref(false);

  const offset = props.reverse ? -props.distance : props.distance;
  const axis = props.direction === 'horizontal' ? 'X' : 'Y';

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

  onMounted(() => {
    if (!containerRef.value) return;
    // Set initial state
    containerRef.value.style.transform = `translate${axis}(${offset}px) scale(${props.scale})`;
    containerRef.value.style.opacity = props.animateOpacity
      ? String(props.initialOpacity)
      : '1';
    containerRef.value.style.willChange = 'transform, opacity';
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn($props.class)"
    :style="{
      transform: isVisible
        ? 'translateY(0) scale(1)'
        : `translate${axis}(${offset}px) scale(${props.scale})`,
      opacity: isVisible ? '1' : animateOpacity ? String(initialOpacity) : '1',
      transition: `transform ${duration}s ${ease} ${delay}s, opacity ${duration}s ${ease} ${delay}s`,
      willChange: 'transform, opacity',
    }"
  >
    <slot></slot>
  </div>
</template>
