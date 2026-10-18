<script setup lang="ts">
  import { computed, onMounted, useTemplateRef, watch } from 'vue';
  import type { CSSProperties } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    ANGLES,
    DEFAULT_COLORS,
    clamp,
    gradientImage,
  } from './gradient-text-paint';
  import type {
    GradientPaintSettings,
    GradientPointerState,
    GradientTextProps,
  } from './types';

  const props = withDefaults(defineProps<GradientTextProps>(), {
    colors: () => DEFAULT_COLORS,
    animationSpeed: 8,
    variant: 'linear',
    angle: 90,
    direction: undefined,
    scale: 3,
    yoyo: true,
    glow: 0,
    showBorder: false,
    borderWidth: 1.5,
    pauseOnHover: false,
    followPointer: false,
    class: '',
  });

  const rootEl = useTemplateRef<HTMLElement>('rootEl');
  const reducedMotion = usePreferredReducedMotion();

  const palette = computed(() => {
    if (props.colors.length > 1) return props.colors;
    const only = props.colors[0] ?? '#ffffff';
    return [only, only];
  });

  const resolvedAngle = computed(() =>
    props.direction ? (ANGLES[props.direction] ?? props.angle) : props.angle,
  );

  const settings = computed<GradientPaintSettings>(() => ({
    colors: palette.value,
    speed: Math.max(0.2, props.animationSpeed),
    variant: props.variant,
    angle: resolvedAngle.value,
    scale: clamp(props.scale, 1, 6),
    yoyo: props.yoyo,
  }));

  const state: GradientPointerState = {
    time: 0,
    inside: false,
    visible: true,
    x: 0.5,
    y: 0.5,
    px: 0.5,
    py: 0.5,
    vx: 0,
    vy: 0,
    pull: 0,
  };

  function paint() {
    rootEl.value?.style.setProperty(
      '--gt-gradient',
      gradientImage(settings.value, state),
    );
  }

  const { pause, resume, isActive } = useRafFn(
    ({ delta }) => {
      const dt = Math.min(0.05, Math.max(0, delta / 1000));
      const paused =
        reducedMotion.value === 'reduce' ||
        (props.pauseOnHover && state.inside);
      if (!paused) state.time += dt;
      const target = props.followPointer && state.inside ? 1 : 0;
      state.pull += (target - state.pull) * (1 - Math.exp(-dt * 6));
      const stiffness = 160;
      const damping = 2 * Math.sqrt(stiffness);
      state.vx += ((state.x - state.px) * stiffness - state.vx * damping) * dt;
      state.vy += ((state.y - state.py) * stiffness - state.vy * damping) * dt;
      state.px += state.vx * dt;
      state.py += state.vy * dt;
      paint();
      const settling =
        Math.abs(state.pull - target) > 0.001 ||
        Math.abs(state.vx) + Math.abs(state.vy) > 0.001;
      if (!state.visible || (paused && !settling)) pause();
    },
    { immediate: false },
  );

  function wake() {
    if (!isActive.value) resume();
  }

  function locate(event: PointerEvent) {
    const root = rootEl.value;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    state.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    state.y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  }

  useEventListener(rootEl, 'pointerenter', (event: PointerEvent) => {
    locate(event);
    if (!state.inside) {
      state.px = state.x;
      state.py = state.y;
    }
    state.inside = true;
    wake();
  });
  useEventListener(rootEl, 'pointermove', (event: PointerEvent) => {
    locate(event);
    wake();
  });
  useEventListener(rootEl, 'pointerleave', () => {
    state.inside = false;
    wake();
  });

  useIntersectionObserver(rootEl, (entries) => {
    state.visible = entries.some((entry) => entry.isIntersecting);
    if (state.visible) wake();
  });

  onMounted(() => {
    paint();
    wake();
  });

  watch(
    [
      settings,
      reducedMotion,
      () => props.pauseOnHover,
      () => props.followPointer,
    ],
    () => {
      paint();
      wake();
    },
    { flush: 'post' },
  );

  const rootStyle = computed<CSSProperties>(() => ({
    '--gt-gradient': `linear-gradient(${resolvedAngle.value}deg, ${[...palette.value, palette.value[0]].join(', ')})`,
    '--gt-border': `${props.borderWidth}px`,
    '--gt-glow': clamp(props.glow, 0, 1),
  }));
</script>

<template>
  <span
    ref="rootEl"
    :class="
      cn(
        'gradient-text relative isolate inline-flex max-w-full items-center justify-center',
        showBorder &&
          'gradient-text--border rounded-full px-[0.75em] py-[0.35em]',
        props.class,
      )
    "
    :style="rootStyle"
  >
    <span class="relative inline-block">
      <span class="gradient-text__fill inline-block"><slot></slot></span>
      <span
        v-if="glow > 0"
        aria-hidden="true"
        class="gradient-text__fill gradient-text__glow pointer-events-none absolute inset-0 -z-1 select-none"
        ><slot></slot
      ></span>
    </span>
  </span>
</template>

<style scoped>
  .gradient-text--border::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: var(--gt-border);
    border-radius: inherit;
    background-image: var(--gt-gradient);
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#000 0 0) content-box exclude,
      linear-gradient(#000 0 0);
    pointer-events: none;
  }

  .gradient-text__fill {
    background-image: var(--gt-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .gradient-text__glow {
    filter: blur(0.3em) saturate(1.4);
    opacity: var(--gt-glow);
  }
</style>
