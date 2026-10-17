<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    shallowRef,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import { MAX_JETS } from './flying-button-shaders';
  import { SIZES, clamp, createEngine, num } from './flying-button-engine';
  import type {
    FlyingButtonEngine,
    FlyingButtonEngineProps,
    FlyingButtonProps,
    FlyingButtonPropsRef,
  } from './types';

  const props = withDefaults(defineProps<FlyingButtonProps>(), {
    label: 'Take off',
    theme: 'dark',
    size: 'medium',
    radius: undefined,
    altitude: 170,
    hoverTime: 2.4,
    jets: 2,
    thrusters: true,
    trigger: 'hover',
    carryCursor: true,
    ramp: false,
    smoke: 1,
    turbulence: 1,
    wobble: 1,
    thrustColor: undefined,
    smokeColor: undefined,
    buttonColor: undefined,
    textColor: undefined,
    rampColor: undefined,
    class: undefined,
  });

  const emit = defineEmits<{
    click: [event: MouseEvent | PointerEvent];
  }>();

  const rootRef = useTemplateRef<HTMLDivElement>('rootRef');
  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef');
  const buttonRef = useTemplateRef<HTMLButtonElement>('buttonRef');
  const cursorRef = useTemplateRef<SVGSVGElement>('cursorRef');
  const rampRef = useTemplateRef<SVGSVGElement>('rampRef');
  const engine = shallowRef<FlyingButtonEngine | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const NO_PODS: number[] = [];

  const light = computed(() => props.theme === 'light');
  const dims = computed(() => SIZES[props.size] ?? SIZES.medium);
  const thrust = computed(
    () => props.thrustColor || (light.value ? '#4f8cff' : '#8ec5ff'),
  );
  const smokeTone = computed(
    () => props.smokeColor || (light.value ? '#e9ebf0' : '#eef1f6'),
  );
  const body = computed(
    () => props.buttonColor || (light.value ? '#18181b' : '#27272a'),
  );
  const ink = computed(
    () => props.textColor || (light.value ? '#fafafa' : '#f5f5f5'),
  );
  const deck = computed(
    () => props.rampColor || (light.value ? '#ececf0' : '#25222b'),
  );
  const jetCount = computed(() =>
    clamp(Math.round(num(props.jets, 2)), 1, MAX_JETS),
  );
  const pods = computed(() => {
    if (!props.thrusters) return NO_PODS;
    const n = jetCount.value;
    const spread = n === 1 ? 0 : n === 2 ? 0.3 : 0.34;
    return Array.from({ length: n }, (_, k) =>
      n === 1 ? 50 : 50 + spread * 100 * ((2 * k) / (n - 1) - 1),
    );
  });

  const rootStyle = computed(() => ({
    '--fly-bg': body.value,
    '--fly-ink': ink.value,
    '--fly-glow': thrust.value,
    '--fly-ramp': deck.value,
    '--fly-h': `${dims.value.h}px`,
    '--fly-px': `${dims.value.px}px`,
    '--fly-fs': `${dims.value.fs}px`,
    '--fly-scale': String(dims.value.k),
    ...(props.radius !== undefined && props.radius !== null
      ? { '--fly-radius': `${num(props.radius, 0)}px` }
      : {}),
  }));

  function handleClick(event: MouseEvent | PointerEvent) {
    emit('click', event);
  }

  const engineProps = computed<FlyingButtonEngineProps>(() => ({
    size: props.size,
    altitude: props.altitude,
    hoverTime: props.hoverTime,
    jets: jetCount.value,
    thrusters: Boolean(props.thrusters),
    trigger: props.trigger,
    carryCursor: props.carryCursor,
    ramp: Boolean(props.ramp),
    smoke: props.smoke,
    turbulence: props.turbulence,
    wobble: props.wobble,
    thrustColor: thrust.value,
    smokeColor: smokeTone.value,
    theme: props.theme,
    reducedMotion: reducedMotion.value === 'reduce',
    onClick: handleClick,
  }));

  const propsRef: FlyingButtonPropsRef = {
    get current() {
      return engineProps.value;
    },
  };

  onMounted(() => {
    const root = rootRef.value;
    const canvas = canvasRef.value;
    const button = buttonRef.value;
    if (!root || !canvas || !button) return;
    engine.value = createEngine({
      root,
      canvas,
      button,
      cursor: cursorRef.value,
      ramp: rampRef.value,
      props: propsRef,
    });
  });

  onBeforeUnmount(() => {
    engine.value?.destroy();
    engine.value = null;
  });

  useIntersectionObserver(rootRef, (entries) => {
    const entry = entries[0];
    if (entry) engine.value?.setVisible(entry.isIntersecting);
  });

  watch(
    [
      () => props.size,
      jetCount,
      () => props.thrusters,
      () => props.radius,
      () => props.label,
    ],
    () => engine.value?.refresh(),
    { flush: 'post' },
  );

  watch(
    () => props.ramp,
    () => engine.value?.rehome(),
    { flush: 'post' },
  );
</script>

<template>
  <div
    ref="rootRef"
    :class="['flying-button', props.class]"
    :data-theme="props.theme"
    :data-trigger="props.ramp ? 'click' : props.trigger"
    :style="rootStyle"
  >
    <svg
      v-show="props.ramp"
      ref="rampRef"
      class="flying-button__ramp"
      aria-hidden="true"
    >
      <path class="flying-button__ramp-body" />
      <path class="flying-button__ramp-edge" />
    </svg>
    <canvas ref="canvasRef" class="flying-button__smoke" aria-hidden="true" />
    <button ref="buttonRef" type="button" class="flying-button__craft">
      <span class="flying-button__face" aria-hidden="true" />
      <span class="flying-button__label"
        ><slot>{{ props.label }}</slot></span
      >
      <span
        v-for="left in pods"
        :key="left"
        class="flying-button__pod"
        :style="{ left: `${left}%` }"
        aria-hidden="true"
      />
    </button>
    <svg
      ref="cursorRef"
      class="flying-button__cursor"
      viewBox="0 0 24 34"
      aria-hidden="true"
    >
      <path
        d="M2.2 2.1v24.6l6.1-5.9 4.1 9.6 4.4-1.9-4.1-9.4h8.6z"
        fill="#0a0a0c"
        stroke="#fff"
        stroke-width="1.9"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<style scoped>
  .flying-button {
    --fly-bg: #27272a;
    --fly-ink: #f5f5f5;
    --fly-pod: #18181b;
    --fly-glow: #8ec5ff;
    --fly-thrust: 0;
    --fly-h: 44px;
    --fly-px: 22px;
    --fly-fs: 14px;
    --fly-scale: 1;
    --fly-ramp: #25222b;

    position: relative;
    width: 100%;
    height: 100%;
    min-height: 240px;
    overflow: hidden;
    isolation: isolate;
    touch-action: manipulation;
  }

  .flying-button[data-carry] {
    cursor: none;
  }

  .flying-button__ramp {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    fill: none;
    pointer-events: none;
  }

  .flying-button__ramp-body {
    stroke: var(--fly-ramp);
    stroke-linejoin: round;
  }

  .flying-button__ramp-edge {
    stroke: color-mix(in srgb, var(--fly-ramp) 72%, #fff);
    stroke-width: 1.5;
    stroke-linejoin: round;
  }

  .flying-button[data-theme='light'] .flying-button__ramp-edge {
    stroke: color-mix(in srgb, var(--fly-ramp) 82%, #000);
  }

  .flying-button[data-dragging]:not([data-carry]) {
    cursor: grabbing;
  }

  .flying-button__smoke {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
  }

  .flying-button__craft {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--fly-h);
    margin: 0;
    padding: 0 var(--fly-px);
    border: 0;
    border-radius: var(--fly-radius, calc(var(--fly-h) / 2));
    background: var(--fly-bg);
    color: var(--fly-ink);
    font-family: inherit;
    font-size: var(--fly-fs);
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.01em;
    white-space: nowrap;
    cursor: pointer;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
    transform-origin: 50% 50%;
    will-change: transform;
    visibility: hidden;
  }

  .flying-button[data-ready] .flying-button__craft {
    visibility: visible;
  }

  .flying-button[data-trigger='hover'] .flying-button__craft {
    cursor: default;
  }

  .flying-button[data-carry] .flying-button__craft {
    pointer-events: none;
    cursor: none;
  }

  .flying-button__craft:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--fly-ink) 60%, transparent);
    outline-offset: 3px;
  }

  .flying-button__face {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.09),
        rgba(255, 255, 255, 0) 46%
      ),
      linear-gradient(
        0deg,
        color-mix(
          in srgb,
          var(--fly-glow) calc(var(--fly-thrust) * 34%),
          transparent
        ),
        transparent 62%
      );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.25);
    pointer-events: none;
  }

  .flying-button[data-theme='light'] .flying-button__face {
    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.7),
        rgba(255, 255, 255, 0) 50%
      ),
      linear-gradient(
        0deg,
        color-mix(
          in srgb,
          var(--fly-glow) calc(var(--fly-thrust) * 30%),
          transparent
        ),
        transparent 62%
      );
    box-shadow:
      inset 0 0 0 1px rgba(0, 0, 0, 0.06),
      inset 0 -1px 0 rgba(0, 0, 0, 0.08);
  }

  .flying-button__label {
    position: relative;
  }

  .flying-button__craft[data-hover] {
    filter: brightness(1.12);
  }

  .flying-button[data-theme='light'] .flying-button__craft[data-hover] {
    filter: brightness(0.97);
  }

  .flying-button__craft[data-pressed] .flying-button__label {
    transform: scale(0.96);
  }

  .flying-button__pod {
    position: absolute;
    top: calc(100% - 3px * var(--fly-scale));
    width: calc(14px * var(--fly-scale));
    height: calc(8px * var(--fly-scale));
    border-radius: 2px 2px 5px 5px;
    background: linear-gradient(
      180deg,
      var(--fly-pod),
      color-mix(in srgb, var(--fly-pod) 80%, #000)
    );
    transform: translateX(-50%);
    z-index: -1;
    pointer-events: none;
  }

  .flying-button__pod::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 0;
    width: calc(7px * var(--fly-scale));
    height: calc(2px * var(--fly-scale));
    border-radius: 2px 2px 1px 1px;
    transform: translateX(-50%);
    background: color-mix(
      in srgb,
      var(--fly-glow) calc(var(--fly-thrust) * 100%),
      #3f3f46
    );
    box-shadow: 0 1px 4px
      color-mix(
        in srgb,
        var(--fly-glow) calc(var(--fly-thrust) * 90%),
        transparent
      );
  }

  .flying-button[data-theme='light'] .flying-button__pod::after {
    background: color-mix(
      in srgb,
      var(--fly-glow) calc(var(--fly-thrust) * 100%),
      #52525b
    );
  }

  .flying-button__cursor {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 3;
    width: 20px;
    height: 28px;
    pointer-events: none;
    display: none;
    will-change: transform;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.28));
  }

  .flying-button[data-carry] .flying-button__cursor {
    display: block;
  }
</style>
