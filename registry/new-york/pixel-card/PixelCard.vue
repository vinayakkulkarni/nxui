<script setup lang="ts">
  import {
    computed,
    onMounted,
    ref,
    shallowRef,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    PIXEL_CARD_SHAPES,
    PIXEL_CARD_TRIGGERS,
    PIXEL_CARD_VARIANTS,
    clamp,
    createPixelCardEngine,
    toColorList,
  } from './pixel-card-engine';
  import type {
    PixelCardEngine,
    PixelCardProps,
    PixelCardSettings,
  } from './types';

  const props = withDefaults(defineProps<PixelCardProps>(), {
    variant: 'default',
    colors: undefined,
    gap: undefined,
    speed: undefined,
    pixelSize: 2,
    shape: 'square',
    origin: 'center',
    revealDuration: 600,
    spotlight: 0.5,
    glow: 0.5,
    glowColor: undefined,
    opacity: 1,
    fade: 0,
    trigger: 'hover',
    clickPulse: true,
    intro: true,
    introDelay: 0,
    noFocus: undefined,
    theme: 'dark',
    radius: 24,
    class: '',
  });

  defineSlots<{ default?: () => unknown }>();

  const rootRef = useTemplateRef<HTMLElement>('rootEl');
  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasEl');
  const engine = shallowRef<PixelCardEngine | null>(null);
  const active = ref(false);

  const reducedMotion = usePreferredReducedMotion();
  const reduce = (): boolean => reducedMotion.value === 'reduce';

  const tone = computed(() => (props.theme === 'light' ? 'light' : 'dark'));
  const preset = computed(
    () => PIXEL_CARD_VARIANTS[props.variant] ?? PIXEL_CARD_VARIANTS.default,
  );
  const focusOff = computed(() => props.noFocus ?? preset.value.noFocus);

  const settings = computed<PixelCardSettings>(() => {
    const base = preset.value;
    const palette = props.colors ? toColorList(props.colors) : [];
    const gap = Number(props.gap ?? base.gap) || base.gap;
    return {
      colors: palette.length ? palette : base.colors[tone.value],
      gap: Math.max(2, gap),
      speed: clamp(Number(props.speed ?? base.speed) || 0, 0, 100),
      pixelSize: Math.max(0.5, props.pixelSize),
      shape: PIXEL_CARD_SHAPES[props.shape] ?? 0,
      origin: props.origin,
      revealDuration: Math.max(50, props.revealDuration),
      spotlight: clamp(props.spotlight, 0, 1),
      glow: clamp(props.glow, 0, 1),
      glowColor: props.glowColor || base.glow[tone.value],
      opacity: clamp(props.opacity, 0, 1),
      fade: clamp(props.fade, 0, 1),
      trigger: PIXEL_CARD_TRIGGERS.includes(props.trigger)
        ? props.trigger
        : 'hover',
      clickPulse: props.clickPulse,
      intro: props.intro,
      introDelay: Math.max(0, props.introDelay),
    };
  });

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      if (!engine.value?.frame(timestamp)) pause();
    },
    { immediate: false },
  );

  function wake(): void {
    if (engine.value && !isActive.value) resume();
  }

  onMounted(() => {
    const container = rootRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine.value = createPixelCardEngine({
      container,
      canvas,
      getSettings: () => settings.value,
      reduce,
      onActive: (value) => {
        active.value = value;
      },
      wake,
    });
  });

  watch(settings, () => {
    engine.value?.sync();
    wake();
  });

  useResizeObserver(rootRef, () => {
    engine.value?.build();
    wake();
  });

  useIntersectionObserver(rootRef, (entries) => {
    engine.value?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  useEventListener(rootRef, 'pointerenter', (event: PointerEvent) =>
    engine.value?.enter(event),
  );
  useEventListener(rootRef, 'pointermove', (event: PointerEvent) =>
    engine.value?.move(event),
  );
  useEventListener(rootRef, 'pointerleave', (event: PointerEvent) =>
    engine.value?.leave(event),
  );
  useEventListener(rootRef, 'pointerdown', (event: PointerEvent) =>
    engine.value?.down(event),
  );
  useEventListener('pointerdown', (event: PointerEvent) =>
    engine.value?.outside(event.target),
  );

  useEventListener(rootRef, 'keydown', (event: KeyboardEvent) => {
    if (settings.value.trigger !== 'click') return;
    if (event.target !== rootRef.value) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    engine.value?.toggle();
  });

  function within(event: FocusEvent): boolean {
    const root = rootRef.value;
    return Boolean(
      root &&
      event.relatedTarget instanceof Node &&
      root.contains(event.relatedTarget),
    );
  }

  useEventListener(rootRef, 'focusin', (event: FocusEvent) => {
    if (focusOff.value || within(event)) return;
    engine.value?.focus();
  });

  useEventListener(rootRef, 'focusout', (event: FocusEvent) => {
    if (focusOff.value || within(event)) return;
    engine.value?.blur();
  });
</script>

<template>
  <div
    ref="rootEl"
    :class="cn('pixel-card h-100 w-75', props.class)"
    :data-theme="tone"
    :data-active="active ? 'true' : undefined"
    :style="{ '--pixel-card-radius': `${radius}px` }"
    :tabindex="focusOff ? -1 : 0"
    :role="trigger === 'click' ? 'button' : undefined"
    :aria-pressed="trigger === 'click' ? active : undefined"
  >
    <canvas ref="canvasEl" class="pixel-card-canvas" aria-hidden="true" />
    <slot />
  </div>
</template>

<style scoped>
  .pixel-card {
    --pixel-card-surface: linear-gradient(180deg, #17151c 0%, #0f0e13 100%);
    --pixel-card-edge: rgba(255, 255, 255, 0.08);
    --pixel-card-edge-active: rgba(255, 255, 255, 0.16);
    --pixel-card-highlight: rgba(255, 255, 255, 0.06);
    --pixel-card-shadow:
      0 24px 48px -24px rgba(0, 0, 0, 0.85), 0 8px 18px -10px rgba(0, 0, 0, 0.6);
    position: relative;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: var(--pixel-card-radius, 24px);
    background: var(--pixel-card-surface);
    box-shadow: var(--pixel-card-shadow);
    isolation: isolate;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .pixel-card[data-theme='light'] {
    --pixel-card-surface: linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%);
    --pixel-card-edge: rgba(24, 24, 27, 0.08);
    --pixel-card-edge-active: rgba(24, 24, 27, 0.16);
    --pixel-card-highlight: rgba(255, 255, 255, 1);
    --pixel-card-shadow:
      0 24px 48px -26px rgba(24, 24, 27, 0.32),
      0 8px 18px -12px rgba(24, 24, 27, 0.18);
  }

  .pixel-card::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--pixel-card-edge),
      inset 0 1px 0 var(--pixel-card-highlight);
    pointer-events: none;
    transition: box-shadow 260ms ease;
  }

  .pixel-card[data-active]::after {
    box-shadow:
      inset 0 0 0 1px var(--pixel-card-edge-active),
      inset 0 1px 0 var(--pixel-card-highlight);
  }

  .pixel-card:focus-visible {
    box-shadow:
      var(--pixel-card-shadow),
      0 0 0 3px rgba(127, 127, 140, 0.45);
  }

  .pixel-card-canvas {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .pixel-card > :deep(:not(.pixel-card-canvas)) {
    position: relative;
    z-index: 1;
  }
</style>
