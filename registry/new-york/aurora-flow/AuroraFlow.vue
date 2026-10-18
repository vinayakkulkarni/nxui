<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    AURORA_FLOW_PRESETS,
    clamp,
    hexToRgb01,
    sanitizeHexColor,
  } from './aurora-flow-presets';
  import { createAuroraFlowRenderer } from './aurora-flow-renderer';
  import type {
    AuroraFlowProps,
    AuroraFlowRenderer,
    AuroraFlowSettings,
  } from './types';

  const props = withDefaults(defineProps<AuroraFlowProps>(), {
    colors: undefined,
    preset: 'ocean',
    speed: 1,
    intensity: 1,
    opacity: 1,
    blur: 1,
    contrast: 1.04,
    brightness: 1,
    grain: true,
    grainOpacity: 0.22,
    layers: 6,
    flowScale: 1,
    flowStrength: 1,
    flowDirection: -18,
    animationSpeed: 1,
    pointerInteraction: true,
    pointerStrength: 0.7,
    scrollInteraction: false,
    parallaxStrength: 0.5,
    lighting: true,
    lightingIntensity: 0.8,
    lightingRadius: 1,
    lightingSpeed: 0.8,
    ambientGlow: true,
    ambientOpacity: 0.7,
    noise: true,
    noiseOpacity: 0.16,
    noiseScale: 1,
    vignette: true,
    vignetteStrength: 0.55,
    borderRadius: 0,
    class: undefined,
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const renderer = shallowRef<AuroraFlowRenderer | null>(null);
  const hasWebGLError = ref(false);
  const isVisible = ref(false);

  const motionPreference = usePreferredReducedMotion();
  const reducedMotion = computed(() => motionPreference.value === 'reduce');
  const documentVisibility = useDocumentVisibility();

  const pointer = { x: 0.5, y: 0.5 };
  const targetPointer = { x: 0.5, y: 0.5 };
  let scroll = 0;
  let targetScroll = 0;
  let elapsed = 0;

  const palette = computed(() => {
    const fallback = AURORA_FLOW_PRESETS[props.preset];
    return fallback.map((color, index) =>
      sanitizeHexColor(props.colors?.[index], color),
    );
  });

  const settings = computed<AuroraFlowSettings>(() => ({
    palette: palette.value.map(hexToRgb01),
    speed: clamp(props.speed, 0, 3),
    intensity: clamp(props.intensity, 0, 2),
    opacity: clamp(props.opacity, 0, 1),
    blur: clamp(props.blur, 0.25, 2),
    contrast: clamp(props.contrast, 0.6, 1.6),
    brightness: clamp(props.brightness, 0.5, 1.5),
    grainOpacity: props.grain ? clamp(props.grainOpacity, 0, 1) : 0,
    layers: clamp(Math.round(props.layers), 3, 7),
    flowScale: clamp(props.flowScale, 0.35, 2.5),
    flowStrength: clamp(props.flowStrength, 0, 2),
    flowDirection: props.flowDirection,
    animationSpeed: clamp(props.animationSpeed, 0, 3),
    pointerStrength: props.pointerInteraction
      ? clamp(props.pointerStrength, 0, 1.5)
      : 0,
    scrollInteraction: props.scrollInteraction,
    parallaxStrength: clamp(props.parallaxStrength, 0, 1.5),
    lighting: props.lighting ? 1 : 0,
    lightingIntensity: clamp(props.lightingIntensity, 0, 2),
    lightingRadius: clamp(props.lightingRadius, 0.3, 2),
    lightingSpeed: clamp(props.lightingSpeed, 0, 2),
    ambientGlow: props.ambientGlow ? 1 : 0,
    ambientOpacity: clamp(props.ambientOpacity, 0, 1.5),
    noiseOpacity: props.noise ? clamp(props.noiseOpacity, 0, 1) : 0,
    noiseScale: clamp(props.noiseScale, 0.4, 3),
    vignette: props.vignette ? clamp(props.vignetteStrength, 0, 1.5) : 0,
    pointerInteraction: props.pointerInteraction,
  }));

  const rootStyle = computed(() => ({
    borderRadius:
      typeof props.borderRadius === 'number'
        ? `${props.borderRadius}px`
        : props.borderRadius,
  }));

  const staticBackground = computed(() => {
    const [base, depth, flow, light] = palette.value;
    return {
      background: [
        `radial-gradient(ellipse at 18% 28%, ${flow}99, transparent 52%)`,
        `radial-gradient(ellipse at 78% 34%, ${light}66, transparent 48%)`,
        `radial-gradient(ellipse at 52% 82%, ${depth}aa, transparent 58%)`,
        base,
      ].join(', '),
    };
  });

  function render() {
    const current = settings.value;
    pointer.x += (targetPointer.x - pointer.x) * 0.035;
    pointer.y += (targetPointer.y - pointer.y) * 0.035;
    scroll += (targetScroll - scroll) * 0.025;
    renderer.value?.draw({
      settings: current,
      time: elapsed,
      pointerX: pointer.x,
      pointerY: pointer.y,
      pointerStrength: reducedMotion.value ? 0 : current.pointerStrength,
      scroll: reducedMotion.value || !current.scrollInteraction ? 0 : scroll,
    });
  }

  const { pause, resume } = useRafFn(
    ({ delta }) => {
      elapsed += Math.min(delta / 1000, 0.05);
      render();
    },
    { immediate: false },
  );

  function resize() {
    const container = containerRef.value;
    if (!container || !renderer.value) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const rect = container.getBoundingClientRect();
    renderer.value.resize(
      Math.max(1, Math.floor(rect.width * dpr)),
      Math.max(1, Math.floor(rect.height * dpr)),
    );
    render();
  }

  function handlePointerMove(event: PointerEvent) {
    const container = containerRef.value;
    if (!container || !settings.value.pointerInteraction || reducedMotion.value)
      return;
    const rect = container.getBoundingClientRect();
    targetPointer.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    targetPointer.y = clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
  }

  function handlePointerLeave() {
    targetPointer.x = 0.5;
    targetPointer.y = 0.5;
  }

  function handleScroll() {
    if (!settings.value.scrollInteraction || reducedMotion.value) return;
    targetScroll = window.scrollY / Math.max(window.innerHeight, 1);
  }

  useEventListener(containerRef, 'pointermove', handlePointerMove, {
    passive: true,
  });
  useEventListener(containerRef, 'pointerleave', handlePointerLeave);
  useEventListener('scroll', handleScroll, { passive: true });
  useResizeObserver(containerRef, resize);
  useIntersectionObserver(containerRef, ([entry]) => {
    isVisible.value = entry?.isIntersecting ?? false;
  });

  const shouldRun = computed(
    () =>
      renderer.value !== null &&
      isVisible.value &&
      documentVisibility.value === 'visible' &&
      !reducedMotion.value,
  );

  watch(shouldRun, (run) => {
    if (run) resume();
    else pause();
  });

  watch(reducedMotion, (reduce) => {
    if (reduce) {
      elapsed = 7.25;
      render();
    }
  });

  watch(settings, () => {
    if (reducedMotion.value) render();
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const created = createAuroraFlowRenderer(canvas);
    if (!created) {
      hasWebGLError.value = true;
      return;
    }
    elapsed = reducedMotion.value ? 7.25 : 0;
    renderer.value = created;
    resize();
  });

  onBeforeUnmount(() => {
    pause();
    renderer.value?.dispose();
    renderer.value = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative min-h-105 w-full overflow-hidden', props.class)"
    :style="rootStyle"
  >
    <div
      aria-hidden="true"
      class="absolute inset-0"
      :style="staticBackground"
    />
    <canvas
      v-if="!hasWebGLError"
      ref="canvasRef"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 size-full"
    />
    <div v-if="$slots.default" class="relative z-10 size-full">
      <slot />
    </div>
  </div>
</template>
