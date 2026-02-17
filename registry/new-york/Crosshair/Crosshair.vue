<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  withDefaults(
    defineProps<{
      color?: string;
      class?: string;
    }>(),
    {
      color: 'white',
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const lineHRef = ref<HTMLDivElement>();
  const lineVRef = ref<HTMLDivElement>();

  let mouseX = 0;
  let mouseY = 0;
  let smoothX = 0;
  let smoothY = 0;
  let animationId = 0;
  let started = false;

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (lineHRef.value) lineHRef.value.style.opacity = '1';
    if (lineVRef.value) lineVRef.value.style.opacity = '1';

    if (!started) {
      started = true;
      smoothX = mouseX;
      smoothY = mouseY;
    }
  });

  useEventListener(containerRef, 'mouseleave', () => {
    if (lineHRef.value) lineHRef.value.style.opacity = '0';
    if (lineVRef.value) lineVRef.value.style.opacity = '0';
  });

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  onMounted(() => {
    function render() {
      animationId = requestAnimationFrame(render);
      smoothX = lerp(smoothX, mouseX, 0.15);
      smoothY = lerp(smoothY, mouseY, 0.15);

      if (lineVRef.value)
        lineVRef.value.style.transform = `translateX(${smoothX}px)`;
      if (lineHRef.value)
        lineHRef.value.style.transform = `translateY(${smoothY}px)`;
    }
    animationId = requestAnimationFrame(render);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full', $props.class)"
    style="cursor: none"
  >
    <slot></slot>
    <div class="pointer-events-none absolute inset-0 z-[10000]">
      <div
        ref="lineHRef"
        class="absolute w-full"
        :style="{
          height: '1px',
          background: color,
          opacity: 0,
          transition: 'opacity 0.3s ease-out',
        }"
      ></div>
      <div
        ref="lineVRef"
        class="absolute h-full"
        :style="{
          width: '1px',
          background: color,
          opacity: 0,
          transition: 'opacity 0.3s ease-out',
        }"
      ></div>
    </div>
  </div>
</template>
