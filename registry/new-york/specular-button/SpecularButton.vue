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
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { SpecularLight } from './specular-light';
  import type { SpecularButtonProps, SpecularSettings } from './types';

  const props = withDefaults(defineProps<SpecularButtonProps>(), {
    size: 'lg',
    radius: 18,
    tint: '#ffffff',
    tintOpacity: 0.04,
    blur: 0,
    textColor: '#f5f5f5',
    lineColor: '#ffffff',
    baseColor: '#525252',
    intensity: 1,
    idleIntensity: 0.35,
    shineSize: 10,
    shineFade: 34,
    thickness: 1.2,
    glow: 1,
    speed: 0.35,
    followMouse: true,
    proximity: 250,
    autoAnimate: false,
    disabled: false,
    type: 'button',
    class: '',
  });

  const buttonRef = ref<HTMLButtonElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const rootEl = ref<HTMLElement>();
  const light = shallowRef<SpecularLight | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  function getSettings(): SpecularSettings {
    return {
      radius: Math.max(0, props.radius),
      lineColor: String(props.lineColor),
      baseColor: String(props.baseColor),
      intensity: Math.max(0, props.intensity),
      idleIntensity: Math.min(1, Math.max(0, props.idleIntensity)),
      shineSize: Math.max(0, props.shineSize),
      shineFade: Math.max(0, props.shineFade),
      thickness: Math.max(0, props.thickness),
      glow: Math.max(0, props.glow),
      speed: props.speed,
      followMouse: props.followMouse,
      proximity: Math.max(1, props.proximity),
      autoAnimate: props.autoAnimate,
      disabled: props.disabled,
      reduceMotion: reducedMotion.value === 'reduce',
    };
  }

  onMounted(() => {
    const button = buttonRef.value;
    const canvas = canvasRef.value;
    if (!button || !canvas) return;
    light.value = SpecularLight.create(button, canvas, getSettings);
    light.value?.measure();
    rootEl.value = document.documentElement;
  });

  onBeforeUnmount(() => {
    light.value?.destroy();
    light.value = null;
  });

  watch([props, reducedMotion], () => light.value?.wake());

  useResizeObserver(buttonRef, (entries) => {
    light.value?.measure(entries[entries.length - 1]);
  });

  useIntersectionObserver(buttonRef, (entries) => {
    light.value?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  useEventListener(
    'pointermove',
    (e: PointerEvent) => light.value?.setPointer(e.clientX, e.clientY),
    { passive: true },
  );

  function onPointerEnd(e: PointerEvent) {
    if (e.pointerType === 'mouse') return;
    light.value?.clearPointer();
  }

  useEventListener('pointerup', onPointerEnd, { passive: true });
  useEventListener('pointercancel', onPointerEnd, { passive: true });
  useEventListener(rootEl, 'pointerleave', () => light.value?.clearPointer());
  useEventListener(buttonRef, 'pointerdown', (e: PointerEvent) =>
    light.value?.press(e.clientX, e.clientY),
  );

  const buttonStyle = computed(() => ({
    '--sb-radius': `${props.radius}px`,
    '--sb-tint': props.tint,
    '--sb-tint-opacity': props.tintOpacity,
    '--sb-blur': `${props.blur}px`,
    '--sb-text-color': props.textColor,
  }));
</script>

<template>
  <button
    ref="buttonRef"
    :type="type"
    :disabled="disabled"
    :class="['specular-button', `specular-button--${size}`, props.class]"
    :style="buttonStyle"
  >
    <canvas ref="canvasRef" class="specular-button__light" aria-hidden="true" />
    <span class="specular-button__label">
      <slot>Get Started</slot>
    </span>
  </button>
</template>

<style scoped>
  .specular-button {
    --sb-radius: 18px;
    --sb-tint: #ffffff;
    --sb-tint-opacity: 0.04;
    --sb-blur: 0px;
    --sb-text-color: #f5f5f5;

    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    margin: 0;
    border: 0;
    border-radius: var(--sb-radius);
    font: inherit;
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.01em;
    color: var(--sb-text-color);
    background: color-mix(
      in srgb,
      var(--sb-tint) calc(var(--sb-tint-opacity) * 100%),
      transparent
    );
    box-shadow: 0 10px 24px -14px rgba(0, 0, 0, 0.45);
    -webkit-backdrop-filter: blur(var(--sb-blur));
    backdrop-filter: blur(var(--sb-blur));
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .specular-button:active {
    transform: scale(0.97);
  }

  .specular-button:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--sb-text-color) 55%, transparent);
    outline-offset: 3px;
  }

  .specular-button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .specular-button:disabled:active {
    transform: none;
  }

  .specular-button--sm {
    padding: 10px 20px;
    font-size: 0.875rem;
  }

  .specular-button--md {
    padding: 14px 28px;
    font-size: 1rem;
  }

  .specular-button--lg {
    padding: 18px 38px;
    font-size: 1.125rem;
  }

  .specular-button__light {
    position: absolute;
    inset: -24px;
    z-index: 1;
    display: block;
    width: calc(100% + 48px);
    height: calc(100% + 48px);
    pointer-events: none;
  }

  .specular-button__label {
    position: relative;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: inherit;
  }

  @media (prefers-reduced-motion: reduce) {
    .specular-button {
      transition: none;
    }
  }
</style>
