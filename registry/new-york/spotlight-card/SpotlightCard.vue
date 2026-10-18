<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    SPOTLIGHT_CARD_NOISE,
    SPOTLIGHT_CARD_THEMES,
    clamp,
    falloff,
    spotlightGradient,
  } from './spotlight-card-utils';
  import type { SpotlightCardProps, SpotlightCardSettings } from './types';

  const props = withDefaults(defineProps<SpotlightCardProps>(), {
    spotlightColor: undefined,
    intensity: 0.15,
    spotlightSize: 240,
    softness: 0.7,
    shape: 'circle',
    borderGlow: 0.6,
    proximity: 80,
    smoothing: 0.3,
    ambient: false,
    flare: true,
    grain: 0,
    theme: 'dark',
    class: '',
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const lightRef = ref<HTMLSpanElement | null>(null);
  const grainRef = ref<HTMLSpanElement | null>(null);
  const edgeRef = ref<HTMLSpanElement | null>(null);

  const reducedMotion = usePreferredReducedMotion();

  const palette = computed(
    () => SPOTLIGHT_CARD_THEMES[props.theme] ?? SPOTLIGHT_CARD_THEMES.dark,
  );

  const settings = computed<SpotlightCardSettings>(() => {
    const color = props.spotlightColor ?? palette.value.light;
    return {
      shape: props.shape === 'beam' ? 'beam' : 'circle',
      fill: falloff(color, props.softness),
      edge: falloff(color, 1),
      size: Math.max(20, props.spotlightSize),
      intensity: clamp(props.intensity, 0, 1) * palette.value.fill,
      borderGlow: clamp(props.borderGlow, 0, 1) * palette.value.edge,
      proximity: Math.max(0, props.proximity),
      smoothing: clamp(props.smoothing, 0, 1),
      ambient: props.ambient,
      flare: props.flare,
      grain: clamp(props.grain, 0, 1),
    };
  });

  const rootStyle = computed(() => ({
    '--spotlight-card-surface': palette.value.surface,
    '--spotlight-card-border': palette.value.border,
    '--spotlight-card-shadow': palette.value.shadow,
  }));

  const state = {
    x: 0,
    y: 0,
    presence: 0,
    flare: 0,
    time: 0,
    pressed: false,
    visible: true,
  };
  const pointer = { x: 0, y: 0, active: false };
  const drawn = { light: '', edge: '', noise: '' };
  let focusTarget: Element | null = null;
  let raf = 0;
  let last = 0;
  let alive = false;

  function paint(s: SpotlightCardSettings) {
    const light = lightRef.value;
    const edge = edgeRef.value;
    const noise = grainRef.value;
    if (!light || !edge || !noise) return;
    const size = s.size * (1 + 0.2 * state.flare);
    const boost = 1 + 0.7 * state.flare;
    const fill = spotlightGradient(s, size, state.x, state.y, s.fill);
    const rim = spotlightGradient(
      s,
      size * 0.6,
      state.x,
      s.shape === 'beam' ? 0 : state.y,
      s.edge,
    );
    if (fill !== drawn.light) {
      drawn.light = fill;
      light.style.background = fill;
    }
    if (rim !== drawn.edge) {
      drawn.edge = rim;
      edge.style.background = rim;
    }
    light.style.opacity = String(
      Math.min(1, state.presence * s.intensity * boost),
    );
    edge.style.opacity = String(
      Math.min(1, state.presence * s.borderGlow * boost),
    );
    const grainy =
      s.grain > 0
        ? spotlightGradient(
            s,
            size,
            state.x,
            state.y,
            '#000 0%, transparent 100%',
          )
        : 'none';
    if (grainy !== drawn.noise) {
      drawn.noise = grainy;
      noise.style.setProperty('-webkit-mask-image', grainy);
      noise.style.maskImage = grainy;
    }
    noise.style.opacity = String(state.presence * s.grain);
  }

  function tick(now: number) {
    raf = 0;
    const root = rootRef.value;
    if (!alive || !root) return;
    const s = settings.value;
    const reduce = reducedMotion.value === 'reduce';
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    const rect = root.getBoundingClientRect();
    let tx = state.x;
    let ty = state.y;
    let target = 0;
    if (focusTarget && root.contains(focusTarget)) {
      const box = focusTarget.getBoundingClientRect();
      tx = box.left + box.width / 2 - rect.left;
      ty = box.top + box.height / 2 - rect.top;
      target = 1;
    } else if (pointer.active) {
      tx = pointer.x - rect.left;
      ty = pointer.y - rect.top;
      const gap = Math.hypot(
        Math.max(0, -tx, tx - rect.width),
        Math.max(0, -ty, ty - rect.height),
      );
      if (gap === 0) target = 1;
      else if (s.proximity > 0)
        target = Math.max(0, 1 - gap / s.proximity) ** 2;
    }
    if (target < 0.6 && s.ambient && state.visible) {
      if (!reduce) state.time += dt;
      const drift = 0.6 - target;
      tx +=
        (rect.width * (0.5 + 0.34 * Math.sin(state.time * 0.43)) - tx) *
        (drift / 0.6);
      ty +=
        (rect.height * (0.5 + 0.3 * Math.sin(state.time * 0.61 + 1.3)) - ty) *
        (drift / 0.6);
      target = 0.6;
    }
    if (state.presence < 0.02 && target > 0 && !s.ambient) {
      state.x = tx;
      state.y = ty;
    }
    const follow =
      reduce || s.smoothing === 0
        ? 1
        : 1 - Math.exp(-dt / (0.015 + s.smoothing * 0.22));
    state.x += (tx - state.x) * follow;
    state.y += (ty - state.y) * follow;
    const fade = reduce
      ? 1
      : 1 - Math.exp(-dt / (target > state.presence ? 0.1 : 0.32));
    state.presence += (target - state.presence) * fade;
    if (Math.abs(target - state.presence) < 0.002) state.presence = target;
    const press = state.pressed && s.flare && !reduce ? 1 : 0;
    state.flare +=
      (press - state.flare) * (1 - Math.exp(-dt / (press ? 0.05 : 0.28)));
    if (Math.abs(press - state.flare) < 0.002) state.flare = press;
    paint(s);
    const moving = Math.abs(tx - state.x) > 0.1 || Math.abs(ty - state.y) > 0.1;
    const settled =
      !moving && state.presence === target && state.flare === press;
    if (!settled || (s.ambient && state.visible && !reduce))
      raf = requestAnimationFrame(tick);
  }

  function wake() {
    if (raf || !alive) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function onMove(event: PointerEvent) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    const root = rootRef.value;
    if (
      state.presence > 0 ||
      settings.value.proximity > 0 ||
      (root && event.target instanceof Node && root.contains(event.target))
    )
      wake();
  }

  function onOut(event: PointerEvent) {
    if (event.relatedTarget) return;
    pointer.active = false;
    wake();
  }

  function onDown(event: PointerEvent) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    state.pressed = true;
    wake();
  }

  function onUp(event: PointerEvent) {
    if (event.pointerType !== 'mouse') pointer.active = false;
    if (!state.pressed && event.pointerType === 'mouse') return;
    state.pressed = false;
    wake();
  }

  function onFocusIn(event: FocusEvent) {
    if (
      !(event.target instanceof Element) ||
      !event.target.matches(':focus-visible')
    )
      return;
    focusTarget = event.target;
    wake();
  }

  function onFocusOut(event: FocusEvent) {
    const root = rootRef.value;
    if (
      root &&
      event.relatedTarget instanceof Node &&
      root.contains(event.relatedTarget)
    )
      return;
    focusTarget = null;
    wake();
  }

  function onScroll() {
    if (pointer.active || state.presence > 0) wake();
  }

  useEventListener('pointermove', onMove, { passive: true });
  useEventListener('pointerup', onUp);
  useEventListener('pointercancel', onUp);
  useEventListener('scroll', onScroll, { capture: true, passive: true });
  useEventListener(
    () => (rootRef.value ? rootRef.value.ownerDocument : null),
    'pointerout',
    onOut,
  );
  useEventListener(rootRef, 'pointerdown', onDown);
  useEventListener(rootRef, 'focusin', onFocusIn);
  useEventListener(rootRef, 'focusout', onFocusOut);

  useIntersectionObserver(rootRef, (entries) => {
    state.visible = entries.some((entry) => entry.isIntersecting);
    if (state.visible) wake();
  });

  watch(settings, wake);

  onMounted(() => {
    state.time = Math.random() * 60;
    alive = true;
    wake();
  });

  onBeforeUnmount(() => {
    alive = false;
    cancelAnimationFrame(raf);
    raf = 0;
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="
      cn(
        'relative isolate overflow-hidden rounded-3xl bg-(--spotlight-card-surface) p-8 shadow-(--spotlight-card-shadow)',
        props.class,
      )
    "
    :style="rootStyle"
  >
    <span ref="lightRef" class="spotlight-card__light" aria-hidden="true" />
    <span
      ref="grainRef"
      class="spotlight-card__grain"
      :style="{ backgroundImage: SPOTLIGHT_CARD_NOISE }"
      aria-hidden="true"
    />
    <slot />
    <span class="spotlight-card__border" aria-hidden="true" />
    <span ref="edgeRef" class="spotlight-card__edge" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .spotlight-card__light,
  .spotlight-card__grain,
  .spotlight-card__border,
  .spotlight-card__edge {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
  }

  .spotlight-card__light,
  .spotlight-card__grain {
    z-index: -1;
    opacity: 0;
  }

  .spotlight-card__grain {
    background-size: 160px 160px;
    mix-blend-mode: overlay;
  }

  .spotlight-card__border,
  .spotlight-card__edge {
    z-index: 1;
    padding: 1px;
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#000 0 0) content-box exclude,
      linear-gradient(#000 0 0);
  }

  .spotlight-card__border {
    background: var(--spotlight-card-border);
  }

  .spotlight-card__edge {
    opacity: 0;
  }
</style>
