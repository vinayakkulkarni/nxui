<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, inject } from 'vue';
  import type { Ref } from 'vue';
  import type { EyeTrackingVariant } from '~/types/components';

  const props = withDefaults(
    defineProps<{
      eyeSize?: number;
      irisColor?: string;
      irisColorSecondary?: string;
      pupilColor?: string;
      scleraColor?: string;
      pupilRange?: number;
      showReflection?: boolean;
      showIrisDetail?: boolean;
      idleAnimation?: boolean;
      blinkInterval?: number;
      variant?: EyeTrackingVariant;
      reactivePupil?: boolean;
      showEyelids?: boolean;
      index?: number;
    }>(),
    {
      eyeSize: 120,
      irisColor: '#4A6741',
      irisColorSecondary: '#6B8F62',
      pupilColor: '#0a0a0a',
      scleraColor: '#F5F0EB',
      pupilRange: 0.7,
      showReflection: true,
      showIrisDetail: true,
      idleAnimation: true,
      blinkInterval: 4000,
      variant: 'realistic',
      reactivePupil: true,
      showEyelids: true,
      index: 0,
    },
  );

  const mouseX = inject<Ref<number>>('eye-tracking-mouse-x', ref(0));
  const mouseY = inject<Ref<number>>('eye-tracking-mouse-y', ref(0));
  const hasMouseMoved = inject<Ref<boolean>>(
    'eye-tracking-has-mouse-moved',
    ref(false),
  );

  const eyeRef = ref<HTMLElement | null>(null);
  const isBlinking = ref(false);
  const idleOffsetX = ref(0);
  const idleOffsetY = ref(0);
  const irisX = ref(0);
  const irisY = ref(0);

  const irisSize = computed(() => props.eyeSize * 0.45);
  const pupilBaseSize = computed(() => irisSize.value * 0.45);
  const maxOffset = computed(
    () => (props.eyeSize / 2 - irisSize.value / 2) * props.pupilRange,
  );

  let blinkTimer: ReturnType<typeof setTimeout> | undefined;
  let blinkTimeout: ReturnType<typeof setTimeout> | undefined;
  let idleTimer: ReturnType<typeof setInterval> | undefined;
  let rafId: number | undefined;

  function scheduleBlink(): void {
    const interval =
      props.blinkInterval + Math.random() * 1000 + props.index * 200;
    blinkTimer = setTimeout(() => {
      isBlinking.value = true;
      blinkTimeout = setTimeout(() => {
        isBlinking.value = false;
        scheduleBlink();
      }, 150);
    }, interval);
  }

  function startIdleAnimation(): void {
    if (!props.idleAnimation) return;
    idleTimer = setInterval(() => {
      if (!hasMouseMoved.value) {
        idleOffsetX.value = (Math.random() - 0.5) * 30;
        idleOffsetY.value = (Math.random() - 0.5) * 30;
      }
    }, 2000);
  }

  function updateIrisPosition(): void {
    if (!eyeRef.value) {
      rafId = requestAnimationFrame(updateIrisPosition);
      return;
    }

    const rect = eyeRef.value.getBoundingClientRect();
    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;

    let targetX: number;
    let targetY: number;

    if (hasMouseMoved.value) {
      const dx = mouseX.value - eyeCenterX;
      const dy = mouseY.value - eyeCenterY;
      const angle = Math.atan2(dy, dx);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const clampedDistance = Math.min(distance, maxOffset.value * 3);
      const ratio = clampedDistance / (maxOffset.value * 3);

      targetX = Math.cos(angle) * maxOffset.value * ratio;
      targetY = Math.sin(angle) * maxOffset.value * ratio;
    } else {
      targetX = idleOffsetX.value * (maxOffset.value / 30);
      targetY = idleOffsetY.value * (maxOffset.value / 30);
    }

    // Spring-like interpolation (stiffness: 300, damping: 25 equivalent)
    const springFactor = 0.12;
    irisX.value += (targetX - irisX.value) * springFactor;
    irisY.value += (targetY - irisY.value) * springFactor;

    rafId = requestAnimationFrame(updateIrisPosition);
  }

  const pupilSize = computed(() => {
    if (!props.reactivePupil || !eyeRef.value) return pupilBaseSize.value;
    if (!hasMouseMoved.value) return pupilBaseSize.value;

    const rect = eyeRef.value?.getBoundingClientRect();
    if (!rect) return pupilBaseSize.value;

    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;
    const dx = mouseX.value - eyeCenterX;
    const dy = mouseY.value - eyeCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Closer cursor = larger pupil (dilation)
    const maxDistance = 400;
    const ratio = Math.min(distance / maxDistance, 1);
    const minScale = 0.8;
    const maxScale = 1.4;
    const scale = maxScale - ratio * (maxScale - minScale);

    return pupilBaseSize.value * scale;
  });

  // Variant-specific computed styles
  const scleraBg = computed(() => {
    switch (props.variant) {
      case 'cyber':
        return '#0a0f1a';
      case 'cartoon':
      case 'minimal':
        return '#ffffff';
      default:
        return `radial-gradient(circle, ${props.scleraColor} 40%, ${darkenColor(props.scleraColor, 0.85)} 100%)`;
    }
  });

  const eyeBorder = computed(() => {
    switch (props.variant) {
      case 'cartoon':
        return `3px solid #0a0a0a`;
      case 'minimal':
        return `1px solid #d4d4d4`;
      case 'cyber':
        return `2px solid #00f0ff`;
      default:
        return 'none';
    }
  });

  const eyeShadow = computed(() => {
    switch (props.variant) {
      case 'cyber':
        return '0 0 15px rgba(0, 240, 255, 0.3), inset 0 0 20px rgba(0, 240, 255, 0.1)';
      case 'cartoon':
        return '4px 4px 0px rgba(0, 0, 0, 0.2)';
      default:
        return 'inset 0 2px 8px rgba(0, 0, 0, 0.15)';
    }
  });

  const irisGradient = computed(() => {
    switch (props.variant) {
      case 'cyber':
        return `conic-gradient(from 0deg, #00f0ff, #004455, #00f0ff, #002233, #00f0ff)`;
      case 'cartoon':
        return props.irisColor;
      case 'minimal':
        return props.irisColor;
      default:
        return `radial-gradient(circle, ${props.irisColorSecondary} 0%, ${props.irisColor} 60%, ${darkenColor(props.irisColor, 0.7)} 100%)`;
    }
  });

  function darkenColor(hex: string, factor: number): string {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
  }

  onMounted(() => {
    scheduleBlink();
    startIdleAnimation();
    rafId = requestAnimationFrame(updateIrisPosition);
  });

  onBeforeUnmount(() => {
    if (blinkTimer) clearTimeout(blinkTimer);
    if (blinkTimeout) clearTimeout(blinkTimeout);
    if (idleTimer) clearInterval(idleTimer);
    if (rafId) cancelAnimationFrame(rafId);
  });
</script>

<template>
  <div
    ref="eyeRef"
    class="eye-tracking-eye"
    :style="{
      width: `${eyeSize}px`,
      height: `${eyeSize}px`,
      background: scleraBg,
      border: eyeBorder,
      boxShadow: eyeShadow,
      borderRadius: '50%',
      position: 'relative',
      overflow: 'hidden',
      transform: isBlinking ? 'scaleY(0.05)' : 'scaleY(1)',
      transition: 'transform 0.15s ease-in-out',
    }"
  >
    <!-- Blood vessels (realistic only) -->
    <svg
      v-if="variant === 'realistic'"
      class="absolute inset-0 size-full"
      :viewBox="`0 0 ${eyeSize} ${eyeSize}`"
    >
      <line
        v-for="i in 6"
        :key="`vessel-${i}`"
        :x1="eyeSize / 2 + Math.cos((i * Math.PI) / 3) * irisSize * 0.6"
        :y1="eyeSize / 2 + Math.sin((i * Math.PI) / 3) * irisSize * 0.6"
        :x2="
          eyeSize / 2 + Math.cos((i * Math.PI) / 3 + 0.1) * (eyeSize / 2 - 2)
        "
        :y2="
          eyeSize / 2 + Math.sin((i * Math.PI) / 3 + 0.1) * (eyeSize / 2 - 2)
        "
        stroke="rgba(180, 60, 50, 0.15)"
        stroke-width="0.5"
        stroke-linecap="round"
      />
    </svg>

    <!-- Eyelid shadow (realistic + showEyelids) -->
    <div
      v-if="showEyelids && (variant === 'realistic' || variant === 'cyber')"
      class="pointer-events-none absolute inset-0 z-30 rounded-full"
      :style="{
        background:
          variant === 'cyber'
            ? 'linear-gradient(to bottom, rgba(0, 240, 255, 0.08) 0%, transparent 30%, transparent 70%, rgba(0, 240, 255, 0.08) 100%)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.08) 100%)',
      }"
    />

    <!-- Iris -->
    <div
      class="absolute rounded-full"
      :style="{
        width: `${irisSize}px`,
        height: `${irisSize}px`,
        left: `${eyeSize / 2 - irisSize / 2 + irisX}px`,
        top: `${eyeSize / 2 - irisSize / 2 + irisY}px`,
        background: irisGradient,
        transition: 'none',
      }"
    >
      <!-- Iris fiber detail (realistic + showIrisDetail) -->
      <svg
        v-if="showIrisDetail && variant === 'realistic'"
        class="absolute inset-0 size-full opacity-30"
        :viewBox="`0 0 ${irisSize} ${irisSize}`"
      >
        <line
          v-for="i in 12"
          :key="`fiber-${i}`"
          :x1="irisSize / 2"
          :y1="irisSize / 2"
          :x2="irisSize / 2 + Math.cos((i * Math.PI) / 6) * (irisSize / 2 - 1)"
          :y2="irisSize / 2 + Math.sin((i * Math.PI) / 6) * (irisSize / 2 - 1)"
          stroke="rgba(255,255,255,0.3)"
          stroke-width="0.5"
        />
      </svg>

      <!-- Cyber circuit pattern -->
      <svg
        v-if="showIrisDetail && variant === 'cyber'"
        class="absolute inset-0 size-full opacity-40"
        :viewBox="`0 0 ${irisSize} ${irisSize}`"
      >
        <circle
          :cx="irisSize / 2"
          :cy="irisSize / 2"
          :r="irisSize * 0.35"
          fill="none"
          stroke="#00f0ff"
          stroke-width="0.5"
          stroke-dasharray="3 2"
        />
        <circle
          :cx="irisSize / 2"
          :cy="irisSize / 2"
          :r="irisSize * 0.2"
          fill="none"
          stroke="#00f0ff"
          stroke-width="0.3"
        />
      </svg>

      <!-- Pupil -->
      <div
        class="absolute left-1/2 top-1/2 rounded-full"
        :style="{
          width: `${pupilSize}px`,
          height: `${pupilSize}px`,
          background: variant === 'cyber' ? '#00f0ff' : pupilColor,
          transform: 'translate(-50%, -50%)',
          boxShadow:
            variant === 'cyber' ? '0 0 8px rgba(0, 240, 255, 0.6)' : 'none',
        }"
      >
        <!-- Reflection highlight -->
        <div
          v-if="showReflection"
          class="absolute rounded-full bg-white"
          :style="{
            width: `${pupilSize * 0.3}px`,
            height: `${pupilSize * 0.3}px`,
            top: `${pupilSize * 0.15}px`,
            left: `${pupilSize * 0.55}px`,
            opacity: variant === 'cyber' ? 0.8 : 0.9,
          }"
        />
      </div>
    </div>

    <!-- Scan line (cyber only) -->
    <div
      v-if="variant === 'cyber'"
      class="eye-tracking-scanline pointer-events-none absolute left-0 z-20 w-full"
      :style="{
        height: '2px',
        background:
          'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.4), transparent)',
      }"
    />
  </div>
</template>

<style scoped>
  @keyframes eye-tracking-scan {
    0% {
      top: 0;
    }
    100% {
      top: 100%;
    }
  }

  .eye-tracking-scanline {
    animation: eye-tracking-scan 2s linear infinite;
  }
</style>
