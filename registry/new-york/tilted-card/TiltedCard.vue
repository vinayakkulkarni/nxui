<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useSlots,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    useMediaQuery,
    useMounted,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    FLIP_THRESHOLD,
    clamp,
    parseColor,
    smoother,
    step,
    toLength,
  } from './tilted-card-motion';
  import type { TiltedCardProps, TiltedCardSettings } from './types';

  const props = withDefaults(defineProps<TiltedCardProps>(), {
    imageSrc: undefined,
    altText: 'Tilted card image',
    captionText: '',
    containerHeight: '300px',
    containerWidth: '100%',
    imageHeight: '300px',
    imageWidth: '300px',
    scaleOnHover: 1.05,
    rotateAmplitude: 12,
    showTooltip: true,
    displayOverlayContent: false,
    overlayDepth: 30,
    flipOnClick: true,
    flipped: undefined,
    radius: 15,
    perspective: 800,
    smoothness: 0.6,
    glare: 0.5,
    glareColor: '#ffffff',
    shadow: 0.5,
    parallax: 1,
    axis: 'both',
    reverse: false,
    trackWindow: false,
    floating: false,
    gyroscope: true,
    intro: true,
    introDelay: 0,
    onClick: undefined,
    class: '',
  });

  const emit = defineEmits<{
    flip: [flipped: boolean];
    'update:flipped': [flipped: boolean];
  }>();

  const slots = useSlots();

  const figureRef = useTemplateRef<HTMLElement>('figure');
  const bodyRef = useTemplateRef<HTMLDivElement>('body');
  const shadowRef = useTemplateRef<HTMLDivElement>('shadow');
  const captionRef = useTemplateRef<HTMLElement>('caption');

  const innerFlipped = ref(false);
  const pending = ref(props.intro);
  const mounted = useMounted();
  const reducedMotion = usePreferredReducedMotion();
  const coarse = useMediaQuery('(hover: none) and (pointer: coarse)');

  const hasBack = computed(() => Boolean(slots.back));
  const controlled = computed(() => typeof props.flipped === 'boolean');
  const isFlipped = computed(
    () =>
      hasBack.value &&
      (controlled.value ? props.flipped === true : innerFlipped.value),
  );
  const flippable = computed(() => hasBack.value && props.flipOnClick);
  const interactive = computed(
    () => flippable.value || typeof props.onClick === 'function',
  );

  const settings = computed<TiltedCardSettings>(() => ({
    amplitude: clamp(props.rotateAmplitude, 0, 60),
    scale: Math.max(0.5, props.scaleOnHover),
    smoothness: clamp(props.smoothness, 0, 1),
    glare: clamp(props.glare, 0, 1),
    shadow: clamp(props.shadow, 0, 1),
    parallax: Math.max(0, props.parallax),
    axis: props.axis,
    reverse: props.reverse,
    trackWindow: props.trackWindow,
    floating: props.floating,
    gyroscope: props.gyroscope,
    intro: props.intro,
    introDelay: Math.max(0, props.introDelay),
    interactive: interactive.value,
    flipped: isFlipped.value,
    tooltip: props.showTooltip && Boolean(props.captionText),
  }));

  const corner = computed(() => toLength(props.radius));
  const glareRgb = computed(() =>
    (parseColor(props.glareColor) ?? [255, 255, 255]).join(', '),
  );
  const bleed = computed(
    () =>
      Math.ceil(
        Math.sin((clamp(props.rotateAmplitude, 0, 60) * Math.PI) / 180) *
          24 *
          Math.max(0, props.parallax),
      ) + 1,
  );

  const figureStyle = computed(() => ({
    width: toLength(props.containerWidth),
    height: toLength(props.containerHeight),
    perspective: toLength(props.perspective),
  }));
  const cardSize = computed(() => ({
    width: toLength(props.imageWidth),
    height: toLength(props.imageHeight),
  }));
  const bodyStyle = computed(() => ({
    ...cardSize.value,
    '--tc-radius': corner.value,
    '--tc-glare-rgb': glareRgb.value,
  }));
  const shadowStyle = computed(() => ({
    ...cardSize.value,
    borderRadius: corner.value,
  }));
  const imageStyle = computed(() => ({
    '--tc-depth': -24,
    top: `-${bleed.value}px`,
    left: `-${bleed.value}px`,
    width: `calc(100% + ${bleed.value * 2}px)`,
    height: `calc(100% + ${bleed.value * 2}px)`,
  }));
  const overlayStyle = computed(() => ({
    '--tc-lift': `${props.overlayDepth}px`,
  }));

  // ── Spring simulation (plain, non-reactive state driven by rAF) ──
  const state = {
    rx: 0,
    vrx: 0,
    ry: 0,
    vry: 0,
    lift: 0,
    vlift: 0,
    ty: 0,
    vty: 0,
    flip: 0,
    vflip: 0,
    press: 0,
    vpress: 0,
    tip: 0,
    vtip: 0,
    shown: 0,
    vshown: 0,
    tx: 0,
    tyy: 0,
  };
  const pointer = {
    nx: 0,
    ny: 0,
    x: 0,
    y: 0,
    inside: false,
    mouse: false,
    seen: false,
    vx: 0,
    last: 0,
  };
  const press = { active: false, x: 0, y: 0, moved: false };
  const tilt = {
    gamma: 0,
    beta: 0,
    baseGamma: 0,
    baseBeta: 0,
    calibrated: false,
    live: false,
    asked: false,
  };
  let opacity = 1;
  let entered = true;
  let introAt = -1;
  let time = 0;
  let focused = false;
  let raf = 0;
  let last = 0;
  let visible = true;

  function isReduced() {
    return reducedMotion.value === 'reduce';
  }

  function frame(now: number) {
    raf = 0;
    const figure = figureRef.value;
    const body = bodyRef.value;
    if (!figure || !body) return;
    const s = settings.value;
    const reduced = isReduced();
    const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
    last = Math.max(last, now);
    time += dt;
    let busy = false;

    const amplitude = s.amplitude * (reduced ? 0.3 : 1);
    const hovering = pointer.inside && pointer.mouse;
    const touching = press.active && !pointer.mouse;
    const following =
      hovering || touching || (s.trackWindow && pointer.seen && !coarse.value);
    let inputX = 0;
    let inputY = 0;
    if (following) {
      inputX = pointer.nx;
      inputY = pointer.ny;
    } else if (tilt.live && s.gyroscope) {
      inputX = clamp((tilt.gamma - tilt.baseGamma) / 22, -1, 1);
      inputY = clamp((tilt.beta - tilt.baseBeta) / 22, -1, 1);
      tilt.baseGamma += (tilt.gamma - tilt.baseGamma) * (1 - Math.exp(-dt / 4));
      tilt.baseBeta += (tilt.beta - tilt.baseBeta) * (1 - Math.exp(-dt / 4));
      busy = true;
    } else if (s.floating && !reduced && visible) {
      inputX =
        0.32 * Math.sin(time * 0.62) + 0.12 * Math.sin(time * 1.31 + 0.7);
      inputY = 0.26 * Math.sin(time * 0.83 + 1.9) + 0.1 * Math.sin(time * 1.57);
      busy = true;
    }
    if (s.axis === 'horizontal') inputY = 0;
    if (s.axis === 'vertical') inputX = 0;
    const sign = s.reverse ? -1 : 1;

    const omega = 20 * Math.pow(0.2, s.smoothness);
    const zeta = 1 - 0.3 * s.smoothness;
    const lifted = hovering || touching || focused ? 1 : 0;

    if (!entered && introAt >= 0 && now >= introAt) entered = true;
    const settle = entered || !s.intro || reduced;
    busy =
      step(
        state,
        'rx',
        settle ? -inputY * amplitude * sign : state.rx,
        omega,
        zeta,
        dt,
      ) || busy;
    busy =
      step(
        state,
        'ry',
        settle ? inputX * amplitude * sign : state.ry,
        omega,
        zeta,
        dt,
      ) || busy;
    const floatY =
      s.floating && !following && !reduced ? -4 * Math.sin(time * 0.9) : 0;
    busy =
      step(state, 'ty', settle ? floatY : state.ty, omega * 0.8, 0.9, dt) ||
      busy;
    busy = step(state, 'lift', lifted, omega, Math.max(zeta, 0.85), dt) || busy;
    busy =
      step(state, 'flip', s.flipped ? 180 : 0, reduced ? 18 : 9.5, 0.72, dt) ||
      busy;
    busy =
      step(
        state,
        'press',
        press.active && !press.moved && s.interactive ? 1 : 0,
        26,
        0.8,
        dt,
      ) || busy;
    if (settle && opacity < 1) {
      opacity = Math.min(1, opacity + dt / 0.45);
      busy = true;
    }
    const fade = opacity < 1 ? smoother(opacity) : 1;

    const active = lifted > 0 || state.lift > 0.01;
    if (active !== figure.hasAttribute('data-active')) {
      figure.toggleAttribute('data-active', active);
    }
    const scale = 1 + (s.scale - 1) * state.lift - 0.02 * state.press;
    const rx = state.rx;
    const ry = state.ry;
    const radiansX = (rx * Math.PI) / 180;
    const radiansY = (ry * Math.PI) / 180;
    body.style.transform = `translate3d(0, ${state.ty.toFixed(2)}px, 0) rotateX(${rx.toFixed(3)}deg) rotateY(${(ry + state.flip).toFixed(3)}deg) scale(${scale.toFixed(4)})`;
    body.style.opacity = opacity < 1 ? fade.toFixed(3) : '';
    body.style.setProperty(
      '--tc-px',
      (Math.sin(radiansY) * s.parallax).toFixed(4),
    );
    body.style.setProperty(
      '--tc-py',
      (-Math.sin(radiansX) * s.parallax).toFixed(4),
    );
    const reach = Math.max(amplitude, 1);
    body.style.setProperty(
      '--tc-gx',
      `${(50 + (ry / reach) * 46).toFixed(2)}%`,
    );
    body.style.setProperty(
      '--tc-gy',
      `${(50 - (rx / reach) * 46).toFixed(2)}%`,
    );
    const energy = Math.min(1, Math.hypot(rx, ry) / reach);
    body.style.setProperty(
      '--tc-glare',
      (s.glare * Math.max(state.lift, energy) * fade).toFixed(3),
    );

    const shade = shadowRef.value;
    if (shade) {
      const strength = s.shadow * fade;
      const offsetX = -Math.sin(radiansY) * 22;
      const offsetY =
        12 + 16 * state.lift + Math.sin(radiansX) * 18 - state.ty * 0.6;
      const turn = Math.abs(Math.cos((state.flip * Math.PI) / 180));
      const spread = scale * (0.86 + 0.04 * state.lift);
      shade.style.transform = `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0) scale(${(spread * (0.2 + 0.8 * turn)).toFixed(4)}, ${spread.toFixed(4)})`;
      shade.style.opacity = (strength * (0.6 + 0.4 * state.lift)).toFixed(3);
    }

    const caption = captionRef.value;
    if (caption) {
      const show = s.tooltip && hovering ? 1 : 0;
      busy = step(state, 'shown', show, 16, 1, dt) || busy;
      const follow = 1 - Math.exp(-dt / 0.035);
      state.tx += (pointer.x - state.tx) * follow;
      state.tyy += (pointer.y - state.tyy) * follow;
      if (
        Math.abs(pointer.x - state.tx) + Math.abs(pointer.y - state.tyy) >
        0.2
      )
        busy = true;
      pointer.vx *= Math.exp(-dt / 0.08);
      busy =
        step(
          state,
          'tip',
          reduced ? 0 : clamp(-pointer.vx * 0.012, -14, 14),
          18,
          0.62,
          dt,
        ) || busy;
      caption.style.transform = `translate3d(${state.tx.toFixed(1)}px, ${state.tyy.toFixed(1)}px, 0) rotate(${state.tip.toFixed(2)}deg)`;
      caption.style.opacity = Math.max(0, state.shown).toFixed(3);
    }

    if ((busy || (!settle && s.intro)) && visible) {
      raf = requestAnimationFrame(frame);
    }
  }

  function wake() {
    if (raf || !visible || !mounted.value) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function locate(event: PointerEvent, area: HTMLElement) {
    const rect = area.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
  }

  function isMouse(event: PointerEvent) {
    return event.pointerType === 'mouse' || event.pointerType === 'pen';
  }

  function track(event: PointerEvent) {
    const figure = figureRef.value;
    if (!figure) return;
    const spot = locate(event, figure);
    const now = performance.now();
    const elapsed = Math.max(8, now - (pointer.last || now - 16)) / 1000;
    const dx = spot.x - pointer.x;
    pointer.vx += (dx / elapsed - pointer.vx) * 0.5;
    pointer.last = now;
    pointer.x = spot.x;
    pointer.y = spot.y;
    pointer.nx = clamp((spot.x - spot.width / 2) / (spot.width / 2), -1, 1);
    pointer.ny = clamp((spot.y - spot.height / 2) / (spot.height / 2), -1, 1);
  }

  function anchorCaption(event: PointerEvent) {
    const figure = figureRef.value;
    if (!figure) return;
    const spot = locate(event, figure);
    pointer.x = spot.x;
    pointer.y = spot.y;
    state.tx = spot.x;
    state.tyy = spot.y;
    pointer.vx = 0;
  }

  function onEnter(event: PointerEvent) {
    pointer.inside = true;
    pointer.mouse = isMouse(event);
    anchorCaption(event);
    track(event);
    wake();
  }

  function onMove(event: PointerEvent) {
    pointer.mouse = isMouse(event);
    if (!pointer.inside && pointer.mouse) {
      pointer.inside = true;
      anchorCaption(event);
    }
    track(event);
    if (
      press.active &&
      Math.hypot(event.clientX - press.x, event.clientY - press.y) >
        FLIP_THRESHOLD
    ) {
      press.moved = true;
    }
    wake();
  }

  function onLeave() {
    pointer.inside = false;
    pointer.vx = 0;
    wake();
  }

  function askMotion() {
    if (!settings.value.gyroscope || !coarse.value || tilt.asked) return;
    tilt.asked = true;
    if (
      typeof DeviceOrientationEvent === 'undefined' ||
      !('requestPermission' in DeviceOrientationEvent)
    ) {
      return;
    }
    const request = DeviceOrientationEvent.requestPermission;
    if (typeof request === 'function') {
      Promise.resolve(Reflect.apply(request, DeviceOrientationEvent, [])).catch(
        () => {},
      );
    }
  }

  function onDown(event: PointerEvent) {
    press.active = true;
    press.moved = false;
    press.x = event.clientX;
    press.y = event.clientY;
    pointer.mouse = isMouse(event);
    if (!pointer.mouse) {
      pointer.inside = true;
      track(event);
    }
    askMotion();
    wake();
  }

  function onFocus() {
    focused = figureRef.value?.matches(':focus-visible') ?? false;
    wake();
  }

  function onBlur() {
    focused = false;
    wake();
  }

  useEventListener(
    'pointerup',
    (event: PointerEvent) => {
      if (!press.active) return;
      press.active = false;
      if (!isMouse(event)) pointer.inside = false;
      wake();
    },
    { passive: true },
  );
  useEventListener(
    'pointercancel',
    () => {
      press.active = false;
      press.moved = true;
      pointer.inside = false;
      wake();
    },
    { passive: true },
  );
  useEventListener(
    'pointermove',
    (event: PointerEvent) => {
      const figure = figureRef.value;
      if (!figure) return;
      const target = event.target;
      if (
        pointer.inside &&
        pointer.mouse &&
        !(target instanceof Node && figure.contains(target))
      ) {
        onLeave();
      }
      if (!settings.value.trackWindow || pointer.inside) return;
      const rect = figure.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      pointer.seen = true;
      pointer.nx = clamp(
        (event.clientX - cx) / Math.max(1, window.innerWidth / 2),
        -1,
        1,
      );
      pointer.ny = clamp(
        (event.clientY - cy) / Math.max(1, window.innerHeight / 2),
        -1,
        1,
      );
      wake();
    },
    { passive: true },
  );
  useEventListener(
    () => (mounted.value ? document.documentElement : undefined),
    'pointerleave',
    () => {
      pointer.seen = false;
      wake();
    },
  );
  useEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
    if (event.gamma == null || event.beta == null) return;
    tilt.gamma = event.gamma;
    tilt.beta = event.beta;
    if (!tilt.calibrated) {
      tilt.baseGamma = event.gamma;
      tilt.baseBeta = event.beta;
      tilt.calibrated = true;
    }
    tilt.live = coarse.value;
    wake();
  });

  useIntersectionObserver(figureRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible && !entered && introAt < 0) {
      introAt = performance.now() + settings.value.introDelay;
    }
    wake();
  });

  watch(settings, wake);

  onMounted(() => {
    time = Math.random() * 10;
    const body = bodyRef.value;
    if (props.intro && !isReduced() && body) {
      entered = false;
      opacity = 0;
      state.rx = 16;
      state.ty = 22;
      body.style.opacity = '0';
    }
    pending.value = false;
    wake();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    raf = 0;
  });

  function toggle() {
    const next = !isFlipped.value;
    if (!controlled.value) innerFlipped.value = next;
    emit('flip', next);
    emit('update:flipped', next);
  }

  function activate(event: MouseEvent) {
    if (!interactive.value || press.moved) return;
    if (flippable.value) toggle();
    props.onClick?.(event);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (
      !interactive.value ||
      event.target !== event.currentTarget ||
      (event.key !== 'Enter' && event.key !== ' ')
    ) {
      return;
    }
    event.preventDefault();
    if (flippable.value) toggle();
    props.onClick?.(event);
  }
</script>

<template>
  <figure
    ref="figure"
    :class="cn('tilted-card', props.class)"
    :style="figureStyle"
    :data-interactive="interactive ? '' : undefined"
    :data-flipped="isFlipped ? '' : undefined"
    :tabindex="interactive ? 0 : undefined"
    :role="interactive ? 'button' : undefined"
    :aria-pressed="flippable ? isFlipped : undefined"
    :aria-label="interactive ? captionText || altText : undefined"
    @click="activate"
    @keydown="onKeyDown"
    @pointerenter="onEnter"
    @pointermove="onMove"
    @pointerleave="onLeave"
    @pointerdown="onDown"
    @focus="onFocus"
    @blur="onBlur"
  >
    <div
      ref="shadow"
      class="tilted-card__shadow"
      aria-hidden="true"
      :style="shadowStyle"
    />
    <div
      ref="body"
      class="tilted-card__body"
      :data-pending="pending ? '' : undefined"
      :style="bodyStyle"
    >
      <div class="tilted-card__face tilted-card__front">
        <img
          v-if="imageSrc"
          class="tilted-card__img"
          :src="imageSrc"
          :alt="altText"
          draggable="false"
          :style="imageStyle"
        />
        <slot></slot>
        <span class="tilted-card__glare" aria-hidden="true" />
        <span class="tilted-card__rim" aria-hidden="true" />
        <span class="tilted-card__edge" aria-hidden="true" />
      </div>
      <div
        v-if="hasBack"
        class="tilted-card__face tilted-card__back"
        :aria-hidden="!isFlipped"
      >
        <slot name="back"></slot>
        <span class="tilted-card__glare" aria-hidden="true" />
        <span class="tilted-card__rim" aria-hidden="true" />
        <span class="tilted-card__edge" aria-hidden="true" />
      </div>
      <div
        v-if="displayOverlayContent && $slots.overlay"
        class="tilted-card__overlay"
        :style="overlayStyle"
      >
        <slot name="overlay"></slot>
      </div>
    </div>
    <figcaption
      v-if="showTooltip && captionText"
      ref="caption"
      class="tilted-card__caption"
    >
      {{ captionText }}
    </figcaption>
  </figure>
</template>

<style scoped>
  .tilted-card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    outline: none;
    touch-action: pan-y pinch-zoom;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .tilted-card[data-interactive] {
    cursor: pointer;
  }

  .tilted-card[data-active] {
    z-index: 2;
  }

  .tilted-card__shadow {
    position: absolute;
    inset: 0;
    margin: auto;
    max-width: 100%;
    max-height: 100%;
    background: var(--tc-shadow-color, rgba(0, 0, 0, 0.55));
    filter: blur(20px);
    opacity: 0;
    pointer-events: none;
    will-change: transform, opacity;
  }

  .tilted-card__body {
    position: relative;
    max-width: 100%;
    max-height: 100%;
    transform-style: preserve-3d;
  }

  .tilted-card__body[data-pending] {
    opacity: 0;
  }

  .tilted-card__face {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: var(--tc-radius);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    isolation: isolate;
  }

  .tilted-card__back {
    transform: rotateY(180deg);
  }

  .tilted-card__img {
    position: absolute;
    display: block;
    max-width: none;
    object-fit: cover;
    pointer-events: none;
    transform: translate3d(
      calc(var(--tc-px, 0) * var(--tc-depth, 0) * 1px),
      calc(var(--tc-py, 0) * var(--tc-depth, 0) * 1px),
      0
    );
  }

  .tilted-card__glare {
    position: absolute;
    inset: 0;
    z-index: 5;
    background: radial-gradient(
      farthest-corner circle at var(--tc-gx, 50%) var(--tc-gy, 50%),
      rgba(var(--tc-glare-rgb, 255, 255, 255), calc(var(--tc-glare, 0) * 0.34))
        0%,
      rgba(var(--tc-glare-rgb, 255, 255, 255), calc(var(--tc-glare, 0) * 0.331))
        9%,
      rgba(var(--tc-glare-rgb, 255, 255, 255), calc(var(--tc-glare, 0) * 0.285))
        18%,
      rgba(var(--tc-glare-rgb, 255, 255, 255), calc(var(--tc-glare, 0) * 0.202))
        27%,
      rgba(var(--tc-glare-rgb, 255, 255, 255), calc(var(--tc-glare, 0) * 0.108))
        36%,
      rgba(var(--tc-glare-rgb, 255, 255, 255), calc(var(--tc-glare, 0) * 0.035))
        45%,
      rgba(var(--tc-glare-rgb, 255, 255, 255), calc(var(--tc-glare, 0) * 0.003))
        54%,
      rgba(var(--tc-glare-rgb, 255, 255, 255), 0) 60%
    );
    mix-blend-mode: screen;
    pointer-events: none;
  }

  .tilted-card__rim {
    position: absolute;
    inset: 0;
    z-index: 6;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--tc-rim-color, rgba(255, 255, 255, 0.08)),
      inset 0 1px 0 var(--tc-rim-light, rgba(255, 255, 255, 0.12));
    pointer-events: none;
  }

  .tilted-card__edge {
    position: absolute;
    inset: 0;
    z-index: 7;
    box-sizing: border-box;
    padding: 1px;
    border-radius: inherit;
    background: radial-gradient(
      farthest-side circle at var(--tc-gx, 50%) var(--tc-gy, 50%),
      rgba(var(--tc-glare-rgb, 255, 255, 255), calc(var(--tc-glare, 0) * 0.85))
        0%,
      rgba(var(--tc-glare-rgb, 255, 255, 255), calc(var(--tc-glare, 0) * 0.71))
        18%,
      rgba(var(--tc-glare-rgb, 255, 255, 255), calc(var(--tc-glare, 0) * 0.43))
        36%,
      rgba(var(--tc-glare-rgb, 255, 255, 255), calc(var(--tc-glare, 0) * 0.16))
        54%,
      rgba(var(--tc-glare-rgb, 255, 255, 255), calc(var(--tc-glare, 0) * 0.02))
        72%,
      rgba(var(--tc-glare-rgb, 255, 255, 255), 0) 85%
    );
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#000 0 0) content-box exclude,
      linear-gradient(#000 0 0);
    pointer-events: none;
  }

  .tilted-card:focus-visible .tilted-card__rim {
    box-shadow:
      inset 0 0 0 2px rgba(255, 255, 255, 0.7),
      inset 0 0 0 3px rgba(0, 0, 0, 0.35);
  }

  .tilted-card__overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    transform: translateZ(var(--tc-lift, 30px));
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .tilted-card__caption {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
    margin: 16px 0 0 14px;
    padding: 5px 9px;
    border-radius: 7px;
    background: #ffffff;
    box-shadow:
      0 0 0 1px rgba(24, 24, 27, 0.08),
      0 8px 18px -8px rgba(0, 0, 0, 0.45);
    color: #18181b;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transform-origin: 0 0;
    will-change: transform, opacity;
  }
</style>
