<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useMediaQuery } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      imageSrc?: string;
      altText?: string;
      captionText?: string;
      containerHeight?: string;
      containerWidth?: string;
      imageHeight?: string;
      imageWidth?: string;
      scaleOnHover?: number;
      rotateAmplitude?: number;
      showMobileWarning?: boolean;
      showTooltip?: boolean;
      class?: string;
    }>(),
    {
      imageSrc: '',
      altText: 'Tilted card image',
      captionText: '',
      containerHeight: '300px',
      containerWidth: '100%',
      imageHeight: '300px',
      imageWidth: '300px',
      scaleOnHover: 1.1,
      rotateAmplitude: 14,
      showMobileWarning: true,
      showTooltip: true,
      class: '',
    },
  );

  const figureRef = ref<HTMLElement>();
  const isMobile = useMediaQuery('(max-width: 640px)');

  const rotateX = ref(0);
  const rotateY = ref(0);
  const scale = ref(1);
  const tooltipX = ref(0);
  const tooltipY = ref(0);
  const tooltipOpacity = ref(0);
  const tooltipRotate = ref(0);
  let lastY = 0;

  // Spring-like damped animation via rAF
  const target = { rx: 0, ry: 0, s: 1, tr: 0 };
  let rafId = 0;

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  function animate() {
    rotateX.value = lerp(rotateX.value, target.rx, 0.15);
    rotateY.value = lerp(rotateY.value, target.ry, 0.15);
    scale.value = lerp(scale.value, target.s, 0.15);
    tooltipRotate.value = lerp(tooltipRotate.value, target.tr, 0.15);
    rafId = requestAnimationFrame(animate);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!figureRef.value) return;
    const rect = figureRef.value.getBoundingClientRect();
    const offX = e.clientX - rect.left - rect.width / 2;
    const offY = e.clientY - rect.top - rect.height / 2;
    target.rx = (offY / (rect.height / 2)) * -props.rotateAmplitude;
    target.ry = (offX / (rect.width / 2)) * props.rotateAmplitude;
    tooltipX.value = e.clientX - rect.left;
    tooltipY.value = e.clientY - rect.top;
    const velY = offY - lastY;
    target.tr = -velY * 0.6;
    lastY = offY;
  }

  function handleMouseEnter() {
    target.s = props.scaleOnHover;
    tooltipOpacity.value = 1;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(animate);
  }

  function handleMouseLeave() {
    target.s = 1;
    target.rx = 0;
    target.ry = 0;
    target.tr = 0;
    tooltipOpacity.value = 0;
  }

  const innerStyle = computed(() => ({
    width: props.imageWidth,
    height: props.imageHeight,
    transform: `perspective(800px) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) scale(${scale.value})`,
    transformStyle: 'preserve-3d' as const,
    willChange: 'transform',
  }));

  const captionStyle = computed(() => ({
    left: `${tooltipX.value}px`,
    top: `${tooltipY.value}px`,
    opacity: tooltipOpacity.value,
    transform: `rotate(${tooltipRotate.value}deg)`,
  }));
</script>

<template>
  <figure
    ref="figureRef"
    :class="
      cn('relative flex flex-col items-center justify-center', $props.class)
    "
    :style="{
      height: containerHeight,
      width: containerWidth,
      perspective: '800px',
    }"
    @mousemove="handleMouseMove"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div
      v-if="showMobileWarning && isMobile"
      class="absolute top-4 text-center text-sm text-muted-foreground"
    >
      This effect is not optimized for mobile. Check on desktop.
    </div>

    <div :style="innerStyle">
      <img
        :src="imageSrc"
        :alt="altText"
        class="absolute inset-0 size-full rounded-[15px] object-cover"
        :style="{ width: imageWidth, height: imageHeight }"
      />
      <slot></slot>
    </div>

    <figcaption
      v-if="showTooltip && captionText && !isMobile"
      class="pointer-events-none absolute z-10 rounded bg-white px-2.5 py-1 text-[10px] text-zinc-800"
      :style="captionStyle"
    >
      {{ captionText }}
    </figcaption>
  </figure>
</template>
