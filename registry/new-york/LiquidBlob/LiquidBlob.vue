<script setup lang="ts">
  import { useMouseInElement, useRafFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      color1?: string;
      color2?: string;
      size?: number;
      speed?: number;
      class?: string;
    }>(),
    {
      color1: '#7c3aed',
      color2: '#06b6d4',
      size: 300,
      speed: 1,
      class: '',
    },
  );

  const containerRef = ref<HTMLElement>();
  const { elementX, elementY, isOutside } = useMouseInElement(containerRef);

  const blobX = ref(50);
  const blobY = ref(50);
  const time = ref(0);

  useRafFn(({ timestamp }) => {
    time.value = timestamp * 0.001 * props.speed;

    if (!isOutside.value && containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect();
      const targetX = (elementX.value / rect.width) * 100;
      const targetY = (elementY.value / rect.height) * 100;
      blobX.value += (targetX - blobX.value) * 0.05;
      blobY.value += (targetY - blobY.value) * 0.05;
    } else {
      blobX.value += (50 - blobX.value) * 0.02;
      blobY.value += (50 - blobY.value) * 0.02;
    }
  });

  const blobStyle = computed(() => {
    const t = time.value;
    const r1 = 40 + Math.sin(t) * 10;
    const r2 = 40 + Math.cos(t * 0.8) * 15;
    const r3 = 40 + Math.sin(t * 1.2) * 10;
    const r4 = 40 + Math.cos(t * 0.6) * 15;

    return {
      width: `${props.size}px`,
      height: `${props.size}px`,
      left: `${blobX.value}%`,
      top: `${blobY.value}%`,
      transform: 'translate(-50%, -50%)',
      background: `linear-gradient(135deg, ${props.color1}, ${props.color2})`,
      borderRadius: `${r1}% ${100 - r1}% ${r2}% ${100 - r2}% / ${r3}% ${r4}% ${100 - r4}% ${100 - r3}%`,
      filter: 'blur(40px)',
      opacity: 0.7,
    };
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative overflow-hidden', props.class)">
    <div class="absolute transition-none" :style="blobStyle"></div>
    <div class="relative z-10">
      <slot></slot>
    </div>
  </div>
</template>
