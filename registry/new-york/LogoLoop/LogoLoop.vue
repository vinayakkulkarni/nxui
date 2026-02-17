<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const SMOOTH_TAU = 0.25;
  const MIN_COPIES = 2;
  const COPY_HEADROOM = 2;

  const props = withDefaults(
    defineProps<{
      speed?: number;
      direction?: 'left' | 'right' | 'up' | 'down';
      logoHeight?: number;
      gap?: number;
      pauseOnHover?: boolean;
      hoverSpeed?: number;
      fadeOut?: boolean;
      fadeOutColor?: string;
      scaleOnHover?: boolean;
      ariaLabel?: string;
      class?: string;
    }>(),
    {
      speed: 120,
      direction: 'left',
      logoHeight: 28,
      gap: 32,
      pauseOnHover: false,
      hoverSpeed: undefined,
      fadeOut: false,
      fadeOutColor: undefined,
      scaleOnHover: false,
      ariaLabel: 'Logo marquee',
      class: '',
    },
  );

  const containerRef = ref<HTMLElement | null>(null);
  const trackRef = ref<HTMLElement | null>(null);
  const seqRef = ref<HTMLElement | null>(null);

  const seqWidth = ref(0);
  const seqHeight = ref(0);
  const copyCount = ref(MIN_COPIES);
  const isHovered = ref(false);

  const isVertical = computed(() => props.direction === 'up' || props.direction === 'down');

  const effectiveHoverSpeed = computed(() => {
    if (props.hoverSpeed !== undefined) return props.hoverSpeed;
    if (props.pauseOnHover) return 0;
    return undefined;
  });

  const targetVelocity = computed(() => {
    const magnitude = Math.abs(props.speed);
    let dirMul: number;
    if (isVertical.value) {
      dirMul = props.direction === 'up' ? 1 : -1;
    } else {
      dirMul = props.direction === 'left' ? 1 : -1;
    }
    const speedMul = props.speed < 0 ? -1 : 1;
    return magnitude * dirMul * speedMul;
  });

  const cssVars = computed(() => ({
    '--ll-gap': `${props.gap}px`,
    '--ll-h': `${props.logoHeight}px`,
    ...(props.fadeOutColor ? { '--ll-fade': props.fadeOutColor } : {}),
  }));

  const copies = computed(() => Array.from({ length: copyCount.value }, (_, i) => i));

  /* ---------- sizing ---------- */
  function updateDimensions(): void {
    const containerWidth = containerRef.value?.clientWidth ?? 0;
    const rect = seqRef.value?.getBoundingClientRect();
    const sw = rect?.width ?? 0;
    const sh = rect?.height ?? 0;

    if (isVertical.value) {
      const parentH = containerRef.value?.parentElement?.clientHeight ?? 0;
      if (containerRef.value && parentH > 0) {
        containerRef.value.style.height = `${Math.ceil(parentH)}px`;
      }
      if (sh > 0) {
        seqHeight.value = Math.ceil(sh);
        const viewport = containerRef.value?.clientHeight ?? parentH ?? sh;
        copyCount.value = Math.max(MIN_COPIES, Math.ceil(viewport / sh) + COPY_HEADROOM);
      }
    } else if (sw > 0) {
      seqWidth.value = Math.ceil(sw);
      copyCount.value = Math.max(MIN_COPIES, Math.ceil(containerWidth / sw) + COPY_HEADROOM);
    }
  }

  useResizeObserver(containerRef, updateDimensions);
  useResizeObserver(seqRef, updateDimensions);

  /* ---------- animation loop ---------- */
  let rafId = 0;
  let lastTs: number | null = null;
  let offsetVal = 0;
  let velocityVal = 0;

  function animate(ts: number): void {
    if (lastTs === null) lastTs = ts;
    const dt = Math.max(0, ts - lastTs) / 1000;
    lastTs = ts;

    const target =
      isHovered.value && effectiveHoverSpeed.value !== undefined
        ? effectiveHoverSpeed.value
        : targetVelocity.value;

    const ease = 1 - Math.exp(-dt / SMOOTH_TAU);
    velocityVal += (target - velocityVal) * ease;

    const seqSize = isVertical.value ? seqHeight.value : seqWidth.value;
    if (seqSize > 0 && trackRef.value) {
      let next = offsetVal + velocityVal * dt;
      next = ((next % seqSize) + seqSize) % seqSize;
      offsetVal = next;
      trackRef.value.style.transform = isVertical.value
        ? `translate3d(0,${-offsetVal}px,0)`
        : `translate3d(${-offsetVal}px,0,0)`;
    }

    rafId = requestAnimationFrame(animate);
  }

  function handleEnter(): void {
    if (effectiveHoverSpeed.value !== undefined) isHovered.value = true;
  }
  function handleLeave(): void {
    if (effectiveHoverSpeed.value !== undefined) isHovered.value = false;
  }

  /* ---------- lifecycle ---------- */
  onMounted(() => {
    updateDimensions();
    rafId = requestAnimationFrame(animate);
  });

  onUnmounted(() => {
    cancelAnimationFrame(rafId);
  });

  watch(
    () => [props.speed, props.direction, props.gap, props.logoHeight],
    () => updateDimensions(),
  );
</script>

<template>
  <div
    ref="containerRef"
    :class="cn(
      'relative overflow-hidden',
      isVertical ? 'inline-block h-full' : 'w-full',
      fadeOut && 'logo-loop-fade',
      scaleOnHover && 'logo-loop-scale',
      props.class,
    )"
    :style="cssVars"
    role="region"
    :aria-label="ariaLabel"
  >
    <div
      ref="trackRef"
      class="flex will-change-transform select-none relative z-0"
      :class="isVertical ? 'flex-col h-max w-full' : 'w-max'"
      @mouseenter="handleEnter"
      @mouseleave="handleLeave"
    >
      <div
        v-for="c in copies"
        :key="c"
        class="flex items-center shrink-0"
        :class="isVertical ? 'flex-col' : ''"
        :style="{ gap: `${gap}px`, fontSize: `${logoHeight}px`, lineHeight: '1', [isVertical ? 'paddingBottom' : 'paddingRight']: `${gap}px` }"
        :aria-hidden="c > 0 || undefined"
        :ref="(el: unknown) => { if (c === 0) seqRef = el as HTMLElement; }"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .logo-loop-fade::before,
  .logo-loop-fade::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: clamp(24px, 8%, 120px);
    pointer-events: none;
    z-index: 10;
  }
  .logo-loop-fade::before {
    left: 0;
    background: linear-gradient(to right, var(--ll-fade, var(--background)) 0%, transparent 100%);
  }
  .logo-loop-fade::after {
    right: 0;
    background: linear-gradient(to left, var(--ll-fade, var(--background)) 0%, transparent 100%);
  }
  .logo-loop-scale :deep(li):hover > * {
    transform: scale(1.2);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>
