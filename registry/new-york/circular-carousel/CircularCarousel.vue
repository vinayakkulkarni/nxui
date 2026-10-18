<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import CircularCarouselDigits from './CircularCarouselDigits.vue';
  import {
    DEFAULT_ITEMS,
    DRAG_THRESHOLD,
    INTRO_LENGTH,
    PRESETS,
    SETTLE_SPEED,
    SPRING,
    SWAP_LENGTH,
    SWAP_SPREAD,
    TO_RAD,
    buildFaces,
    buildTiles,
    clamp,
    easeOut,
    easeOutQuint,
    fitRing,
    preloadImage,
    ringRadius,
    wrap,
  } from './circular-carousel-math';
  import type {
    CircularCarouselIntroPose,
    CircularCarouselItem,
    CircularCarouselLeaving,
    CircularCarouselPreset,
    CircularCarouselProps,
    CircularCarouselSettings,
    CircularCarouselState,
  } from './types';

  const props = withDefaults(defineProps<CircularCarouselProps>(), {
    items: () => DEFAULT_ITEMS,
    preset: 'cylinder',
    intro: 'rise',
    cardWidth: 220,
    aspectRatio: 1,
    gap: 25,
    curve: undefined,
    tilt: undefined,
    perspective: undefined,
    autoplay: 'drift',
    speed: 14,
    interval: 3,
    direction: 'left',
    draggable: true,
    momentum: 0.6,
    snap: true,
    pauseOnHover: true,
    focusOnClick: true,
    parallax: 0.3,
    stretch: 0.5,
    depthFade: 0.55,
    fadeColor: '#000000',
    innerShade: 0.6,
    cornerRadius: 12,
    captions: false,
    class: '',
  });

  const emit = defineEmits<{
    change: [index: number];
    itemClick: [item: CircularCarouselItem, index: number];
  }>();

  const incoming = computed(() =>
    props.items && props.items.length ? props.items : DEFAULT_ITEMS,
  );
  const list = shallowRef<CircularCarouselItem[]>(incoming.value);
  const leaving = shallowRef<CircularCarouselLeaving | null>(null);
  const active = ref(0);
  const ready = ref(false);
  const dragging = ref(false);

  const reducedPref = usePreferredReducedMotion();
  const reduced = computed(() => reducedPref.value === 'reduce');

  const count = computed(() => list.value.length);
  const shape = computed<CircularCarouselPreset>(() =>
    PRESETS[props.preset] ? props.preset : 'cylinder',
  );
  const layout = computed(() => PRESETS[shape.value]);
  const axis = computed(() => layout.value.axis);
  const tiltValue = computed(() => props.tilt ?? layout.value.tilt);
  const curveValue = computed(() =>
    layout.value.billboard ? 0 : clamp(props.curve ?? layout.value.curve, 0, 1),
  );
  const cardW = computed(() => Math.max(40, props.cardWidth));
  const cardH = computed(() => cardW.value / clamp(props.aspectRatio, 0.2, 5));
  const along = computed(() =>
    axis.value === 'x' ? cardH.value : cardW.value,
  );
  const step = computed(() => 360 / count.value);

  const radius = computed(() =>
    ringRadius(
      count.value,
      along.value,
      props.gap,
      layout.value.spread,
      curveValue.value,
    ),
  );

  const faces = computed(() =>
    buildFaces(
      buildTiles(
        along.value,
        axis.value,
        curveValue.value,
        layout.value.inward,
        radius.value,
      ),
      layout.value.backfaces,
      axis.value,
      along.value,
      cardW.value,
      cardH.value,
    ),
  );

  const settings = computed<CircularCarouselSettings>(() => ({
    count: count.value,
    step: step.value,
    radius: radius.value,
    layout: layout.value,
    axis: axis.value,
    tilt: tiltValue.value,
    perspective: layout.value.inward
      ? radius.value
      : (props.perspective ?? layout.value.perspective),
    cardW: cardW.value,
    cardH: cardH.value,
    intro: reduced.value
      ? 'none'
      : props.intro in INTRO_LENGTH
        ? props.intro
        : 'rise',
    autoplay: reduced.value ? 'off' : props.autoplay,
    speed: props.speed,
    interval: Math.max(0.5, props.interval),
    draggable: props.draggable,
    momentum: clamp(props.momentum, 0, 1),
    snap: props.snap,
    pauseOnHover: props.pauseOnHover,
    parallax: reduced.value ? 0 : clamp(props.parallax, 0, 1),
    stretch: reduced.value ? 0 : clamp(props.stretch, 0, 1),
    depthFade: clamp(props.depthFade, 0, 1),
    captions: props.captions,
    reduced: reduced.value,
  }));

  const dragSign = computed(() => (layout.value.inward ? -1 : 1));
  const directionSign = computed(
    () => (props.direction === 'right' ? 1 : -1) * dragSign.value,
  );

  const rootStyle = computed(() => ({
    '--cc-fade': props.fadeColor,
    '--cc-radius': `${Math.max(0, props.cornerRadius)}px`,
    '--cc-inner': (1 - clamp(props.innerShade, 0, 1)).toFixed(3),
  }));

  const current = computed(() => list.value[active.value] ?? list.value[0]);
  const label = computed(() => {
    const item = current.value;
    return item ? item.title || item.alt || `Image ${active.value + 1}` : '';
  });
  const totalLabel = computed(() => String(count.value).padStart(2, '0'));

  function cardLabel(item: CircularCarouselItem, index: number) {
    return `${item.title || item.alt || `Image ${index + 1}`}, ${index + 1} of ${count.value}`;
  }

  function leavingDelay(index: number) {
    const delay = leaving.value?.delays[index] ?? 0;
    return `${Math.round(delay)}ms`;
  }

  const rootRef = useTemplateRef<HTMLDivElement>('root');
  const stageRef = useTemplateRef<HTMLDivElement>('stage');
  const cameraRef = useTemplateRef<HTMLDivElement>('camera');
  const ringRef = useTemplateRef<HTMLDivElement>('ring');

  const state: CircularCarouselState = {
    angle: 0,
    velocity: 0,
    target: null,
    dir: directionSign.value,
    press: null,
    drag: false,
    hover: false,
    pointer: { inside: false, x: 0, y: 0 },
    yaw: 0,
    pitch: 0,
    intro: null,
    introDone: false,
    holdUntil: 0,
    stepAt: 0,
    suppressClick: false,
    wheelTimer: undefined,
    fit: 1,
    shift: 0,
    drop: 0,
    last: 0,
  };

  let raf = 0;
  let visible = true;
  let mounted = false;
  let activeIndex = 0;
  let loadToken = 0;

  const nearest = (angle: number) =>
    Math.round(angle / settings.value.step) * settings.value.step;

  function measure() {
    const root = rootRef.value;
    const stage = stageRef.value;
    if (!root || !stage) return;
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const s = settings.value;
    const result = fitRing(s, rect.width, rect.height);
    state.fit = result.fit;
    state.shift = result.shift;
    state.drop = result.drop;
    stage.style.perspective = `${s.perspective}px`;
    stage.style.transform = `translate3d(0, ${state.shift}px, 0) scale(${state.fit})`;
  }

  function introCard(
    elapsed: number,
    landing: number,
  ): CircularCarouselIntroPose {
    if (!state.intro) return { radius: 1, lift: 0 };
    const type = state.intro.type;
    const reach = Math.abs(wrap(landing + state.angle));
    if (type === 'assemble') {
      const delay = (reach / 180) * 420;
      const p = easeOut(clamp((elapsed - delay) / 1080, 0, 1));
      return { radius: 1 + 0.6 * (1 - p), lift: 0 };
    }
    if (type === 'rise') {
      const delay = (reach / 180) * 480;
      const p = easeOutQuint(clamp((elapsed - delay) / 900, 0, 1));
      return { radius: 1, lift: (1 - p) * state.drop };
    }
    if (type === 'spin') {
      const p = easeOut(clamp(elapsed / INTRO_LENGTH.spin, 0, 1));
      return { radius: 1 + 0.28 * (1 - p), lift: 0 };
    }
    return { radius: 1, lift: 0 };
  }

  function advance(s: CircularCarouselSettings, dt: number, now: number) {
    if (!state.introDone && ready.value) {
      if (!state.intro) {
        if (s.intro === 'none') state.introDone = true;
        else state.intro = { type: s.intro, start: now };
      }
      if (
        state.intro &&
        now - state.intro.start >= INTRO_LENGTH[state.intro.type]
      ) {
        state.intro = null;
        state.introDone = true;
      }
    }

    const paused =
      (s.pauseOnHover && state.hover) || state.drag || now < state.holdUntil;
    const cruise =
      s.autoplay === 'drift' && !paused && !state.intro
        ? s.speed * state.dir
        : 0;
    let busy = Boolean(state.intro) || state.drag;

    if (state.drag || state.intro) {
      state.velocity = state.drag ? state.velocity : 0;
    } else if (state.target !== null) {
      let remaining = dt;
      const damping = 2 * Math.sqrt(SPRING);
      while (remaining > 0) {
        const h = Math.min(remaining, 1 / 240);
        const accel =
          SPRING * (state.target - state.angle) - damping * state.velocity;
        state.velocity += accel * h;
        state.angle += state.velocity * h;
        remaining -= h;
      }
      if (
        Math.abs(state.target - state.angle) < 0.004 &&
        Math.abs(state.velocity) < 0.03
      ) {
        state.angle = state.target;
        state.velocity = 0;
        state.target = null;
      }
      busy = true;
    } else {
      const tau = 0.18 + s.momentum * 1.5;
      state.velocity += (cruise - state.velocity) * (1 - Math.exp(-dt / tau));
      state.angle += state.velocity * dt;
      if (cruise === 0 && s.snap && Math.abs(state.velocity) < SETTLE_SPEED) {
        state.target = nearest(state.angle);
      }
      busy =
        busy ||
        cruise !== 0 ||
        Math.abs(state.velocity) > 0.01 ||
        state.target !== null;
    }

    if (s.autoplay === 'step' && !paused && !state.intro && state.introDone) {
      if (!state.stepAt) state.stepAt = now + s.interval * 1000;
      if (now >= state.stepAt) {
        state.target =
          (state.target ?? nearest(state.angle)) + s.step * state.dir;
        state.stepAt = now + s.interval * 1000;
      }
      busy = true;
    } else {
      state.stepAt = 0;
    }

    if (now < state.holdUntil) busy = true;

    const ease = 1 - Math.exp(-dt / 0.35);
    const aimYaw = state.pointer.inside ? state.pointer.x * s.parallax * 9 : 0;
    const aimPitch = state.pointer.inside
      ? -state.pointer.y * s.parallax * 6
      : 0;
    state.yaw += (aimYaw - state.yaw) * ease;
    state.pitch += (aimPitch - state.pitch) * ease;
    if (
      Math.abs(aimYaw - state.yaw) > 0.01 ||
      Math.abs(aimPitch - state.pitch) > 0.01
    )
      busy = true;

    return busy;
  }

  function render(s: CircularCarouselSettings, now: number) {
    const camera = cameraRef.value;
    const ring = ringRef.value;
    if (!camera || !ring) return;
    const elapsed = state.intro ? now - state.intro.start : 0;
    const swell =
      1 + s.stretch * 0.12 * Math.min(1, Math.abs(state.velocity) / 420);
    let spinOffset = 0;
    if (state.intro?.type === 'spin') {
      const p = easeOut(clamp(elapsed / INTRO_LENGTH.spin, 0, 1));
      spinOffset = -300 * state.dir * (1 - p);
    } else if (state.intro?.type === 'assemble') {
      const p = easeOut(clamp(elapsed / INTRO_LENGTH.assemble, 0, 1));
      spinOffset = -32 * state.dir * (1 - p);
    }
    const angle = state.angle + spinOffset;
    const R = s.radius * swell;

    if (s.axis === 'x') {
      camera.style.transform = `translate3d(0, 0, ${-R}px) rotateY(${s.tilt + state.yaw}deg) rotateX(${state.pitch}deg)`;
      ring.style.transform = `rotateX(${-angle}deg)`;
    } else if (s.layout.inward) {
      camera.style.transform = `translate3d(0, 0, ${s.perspective - 1}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
      ring.style.transform = `rotateY(${angle}deg)`;
    } else {
      camera.style.transform = `translate3d(0, 0, ${-R}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
      ring.style.transform = `rotateY(${angle}deg)`;
    }

    const cards = ring.children;
    for (let index = 0; index < s.count; index++) {
      const card = cards[index];
      if (!(card instanceof HTMLElement)) continue;
      const base = index * s.step;
      const mod = introCard(elapsed, base);
      const r = R * mod.radius;
      let transform: string;
      if (s.axis === 'x') {
        transform = `rotateX(${-base}deg) translateZ(${r}px)`;
      } else if (s.layout.inward) {
        transform = `rotateY(${base}deg) translateZ(${-r}px)`;
      } else {
        transform = `rotateY(${base}deg) translateZ(${r}px)`;
        if (s.layout.billboard) transform += ` rotateY(${-(base + angle)}deg)`;
      }
      if (mod.lift)
        transform +=
          s.axis === 'x'
            ? ` translateX(${mod.lift}px)`
            : ` translateY(${mod.lift}px)`;
      card.style.transform = transform;

      const world = wrap(base + angle);
      const facing = Math.cos(world * TO_RAD);
      card.style.visibility =
        s.layout.inward && Math.abs(world) > 86 ? 'hidden' : '';
      const fade = s.depthFade * Math.pow((1 - facing) / 2, 1.25);
      card.style.setProperty('--cc-depth', fade.toFixed(3));
    }

    const index =
      ((Math.round(-state.angle / s.step) % s.count) + s.count) % s.count || 0;
    if (index !== activeIndex) {
      activeIndex = index;
      active.value = index;
      emit('change', index);
    }
  }

  function frame(now: number) {
    raf = 0;
    const s = settings.value;
    const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 1 / 60;
    state.last = now;
    const busy = advance(s, dt, now);
    render(s, now);
    if (busy && visible && !document.hidden) raf = requestAnimationFrame(frame);
    else state.last = 0;
  }

  function wake() {
    if (!mounted) return;
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function halt() {
    cancelAnimationFrame(raf);
    raf = 0;
    state.last = 0;
  }

  function loadItems(initial: boolean) {
    const token = ++loadToken;
    const next = incoming.value;
    const smooth = !initial && ready.value && next.length === list.value.length;
    if (!smooth) {
      ready.value = false;
      leaving.value = null;
      list.value = next;
    }
    const sources = next.slice(0, 16).map((item) => item.src);
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2400));
    Promise.race([Promise.all(sources.map(preloadImage)), timeout]).then(() => {
      if (token !== loadToken || !mounted) return;
      if (smooth) {
        const previous = list.value;
        const s = settings.value;
        if (!s.reduced && previous !== next) {
          leaving.value = {
            id: (leaving.value?.id ?? 0) + 1,
            items: previous,
            delays: previous.map(
              (_, index) =>
                (Math.abs(wrap(index * s.step + state.angle)) / 180) *
                SWAP_SPREAD,
            ),
          };
        }
        list.value = next;
        wake();
        return;
      }
      state.introDone = false;
      state.intro = null;
      ready.value = true;
      wake();
    });
  }

  const sourcesKey = computed(() =>
    incoming.value.map((item) => item.src).join('|'),
  );
  watch(sourcesKey, () => loadItems(false));

  watch(leaving, (value, _previous, onCleanup) => {
    if (!value) return;
    const timer = setTimeout(
      () => {
        leaving.value = null;
      },
      SWAP_LENGTH + SWAP_SPREAD + 80,
    );
    onCleanup(() => clearTimeout(timer));
  });

  watch(directionSign, (value) => {
    state.dir = value;
    wake();
  });

  watch(
    [
      radius,
      cardW,
      cardH,
      tiltValue,
      () => props.perspective,
      shape,
      () => props.captions,
      count,
    ],
    () => {
      measure();
      wake();
    },
    { flush: 'post' },
  );

  watch(settings, wake, { flush: 'post' });
  watch(ready, wake, { flush: 'post' });

  useResizeObserver(rootRef, () => {
    measure();
    wake();
  });

  useIntersectionObserver(rootRef, (entries) => {
    const entry = entries[0];
    if (!entry) return;
    visible = entry.isIntersecting;
    if (visible) wake();
    else halt();
  });

  const pageVisibility = useDocumentVisibility();
  watch(pageVisibility, (value) => {
    if (value === 'hidden') halt();
    else wake();
  });

  function onWheel(event: WheelEvent) {
    const s = settings.value;
    if (!s.draggable) return;
    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : 0;
    if (!delta) return;
    event.preventDefault();
    const sign = s.layout.inward ? -1 : 1;
    const perPixel = 180 / (Math.PI * s.radius * state.fit);
    state.target = null;
    state.angle -= delta * perPixel * sign;
    state.velocity = -delta * perPixel * sign * 30;
    state.holdUntil = performance.now() + 1600;
    clearTimeout(state.wheelTimer);
    state.wheelTimer = setTimeout(() => {
      if (settings.value.snap)
        state.target = nearest(state.angle + state.velocity * 0.12);
      wake();
    }, 140);
    wake();
  }
  useEventListener(rootRef, 'wheel', onWheel, { passive: false });

  onMounted(() => {
    mounted = true;
    loadItems(true);
    measure();
    render(settings.value, performance.now());
    wake();
  });

  onBeforeUnmount(() => {
    mounted = false;
    loadToken++;
    halt();
    clearTimeout(state.wheelTimer);
  });

  function focusIndex(index: number) {
    const s = settings.value;
    let target = -index * s.step;
    target += 360 * Math.round((state.angle - target) / 360);
    state.target = target;
    state.holdUntil = performance.now() + 2800;
    wake();
  }

  function stepBy(delta: number) {
    const s = settings.value;
    const base = state.target ?? Math.round(state.angle / s.step) * s.step;
    state.target = base - delta * s.step * (s.layout.inward ? -1 : 1);
    state.holdUntil = performance.now() + 2800;
    wake();
  }

  function updatePointer(event: PointerEvent) {
    const root = rootRef.value;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    state.pointer.x = clamp(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -1,
      1,
    );
    state.pointer.y = clamp(
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
      -1,
      1,
    );
  }

  function handlePointerDown(event: PointerEvent) {
    state.suppressClick = false;
    if (!props.draggable || event.button !== 0) return;
    state.press = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      angle: state.angle,
      moved: false,
      origin: 0,
      samples: [{ time: performance.now(), angle: state.angle }],
    };
  }

  function handlePointerMove(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      state.pointer.inside = true;
      updatePointer(event);
    }
    const press = state.press;
    if (!press || press.id !== event.pointerId) {
      wake();
      return;
    }
    const s = settings.value;
    const delta =
      s.axis === 'x' ? event.clientY - press.y : event.clientX - press.x;
    const cross =
      s.axis === 'x' ? event.clientX - press.x : event.clientY - press.y;
    if (!press.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      if (
        Math.abs(cross) > Math.abs(delta) * 1.2 &&
        event.pointerType !== 'mouse'
      ) {
        state.press = null;
        return;
      }
      press.moved = true;
      press.origin = delta;
      state.drag = true;
      state.target = null;
      state.velocity = 0;
      dragging.value = true;
      try {
        rootRef.value?.setPointerCapture(event.pointerId);
      } catch {
        // Pointer already released; dragging continues without capture.
      }
    }
    const perPixel = 180 / (Math.PI * s.radius * state.fit);
    state.angle =
      press.angle +
      (delta - press.origin) * perPixel * (s.layout.inward ? -1 : 1);
    const now = performance.now();
    press.samples.push({ time: now, angle: state.angle });
    while (
      press.samples.length > 2 &&
      now - (press.samples[0]?.time ?? now) > 110
    )
      press.samples.shift();
    wake();
  }

  function releasePointer(event: PointerEvent) {
    const press = state.press;
    if (!press || press.id !== event.pointerId) return;
    state.press = null;
    if (!press.moved) return;
    state.drag = false;
    dragging.value = false;
    state.suppressClick = true;
    const s = settings.value;
    const first = press.samples[0];
    const last = press.samples[press.samples.length - 1];
    let velocity = 0;
    if (first && last) {
      const span = (last.time - first.time) / 1000;
      velocity =
        span > 0.008
          ? clamp((last.angle - first.angle) / span, -1400, 1400)
          : 0;
    }
    state.velocity = velocity;
    if (Math.abs(velocity) > 60) state.dir = Math.sign(velocity);
    const coasting =
      s.autoplay === 'drift' &&
      !(s.pauseOnHover && state.hover && event.pointerType === 'mouse');
    if (s.snap && !coasting) {
      const tau = 0.18 + s.momentum * 1.5;
      state.target =
        Math.round((state.angle + velocity * tau * 0.55) / s.step) * s.step;
    }
    wake();
  }

  function handlePointerEnter(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    state.hover = true;
    wake();
  }

  function handlePointerLeave(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      state.hover = false;
      state.pointer.inside = false;
    }
    wake();
  }

  function handleClick(event: MouseEvent) {
    if (state.suppressClick) {
      state.suppressClick = false;
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) return;
    const card = target.closest('[data-cc-index]');
    if (!card) return;
    const index = Number(card.getAttribute('data-cc-index'));
    const item = list.value[index];
    if (!item) return;
    if (props.focusOnClick) focusIndex(index);
    emit('itemClick', item, index);
  }

  function handleKeyDown(event: KeyboardEvent) {
    const forward = axis.value === 'x' ? 'ArrowDown' : 'ArrowRight';
    const backward = axis.value === 'x' ? 'ArrowUp' : 'ArrowLeft';
    if (event.key === forward) stepBy(1);
    else if (event.key === backward) stepBy(-1);
    else if (event.key === 'Home') focusIndex(0);
    else if (event.key === 'End') focusIndex(count.value - 1);
    else if (event.key === 'Enter' || event.key === ' ') {
      const item = list.value[activeIndex];
      if (item) emit('itemClick', item, activeIndex);
    } else return;
    event.preventDefault();
  }

  // Re-render once the DOM reflects a new card count so new cards get placed.
  watch(count, () => nextTick(() => render(settings.value, performance.now())));
</script>

<template>
  <div
    ref="root"
    :class="['circular-carousel', props.class]"
    :style="rootStyle"
    role="region"
    aria-roledescription="carousel"
    aria-label="Image carousel"
    tabindex="0"
    :data-axis="axis"
    :data-shape="shape"
    :data-ready="ready ? '' : undefined"
    :data-draggable="draggable ? '' : undefined"
    :data-dragging="dragging ? '' : undefined"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="releasePointer"
    @pointercancel="releasePointer"
    @pointerenter="handlePointerEnter"
    @pointerleave="handlePointerLeave"
    @click="handleClick"
    @keydown="handleKeyDown"
  >
    <div class="circular-carousel__view">
      <div ref="stage" class="circular-carousel__stage">
        <div ref="camera" class="circular-carousel__camera">
          <div ref="ring" class="circular-carousel__ring">
            <div
              v-for="(item, index) in list"
              :key="index"
              class="circular-carousel__card"
              :data-cc-index="index"
              role="group"
              aria-roledescription="slide"
              :aria-label="cardLabel(item, index)"
            >
              <div
                v-for="face in faces"
                :key="face.key"
                class="circular-carousel__tile"
                :style="face.tileStyle"
                aria-hidden="true"
              >
                <div class="circular-carousel__frame" :style="face.frameStyle">
                  <img
                    class="circular-carousel__photo"
                    :src="item.src"
                    alt=""
                    draggable="false"
                    decoding="async"
                    :style="face.photoStyle"
                  />
                  <img
                    v-if="leaving && leaving.items[index]"
                    :key="`leaving-${leaving.id}`"
                    class="circular-carousel__photo circular-carousel__photo--leaving"
                    :src="leaving.items[index]?.src"
                    alt=""
                    draggable="false"
                    decoding="async"
                    :style="[
                      face.photoStyle,
                      { animationDelay: leavingDelay(index) },
                    ]"
                  />
                  <div v-if="face.back" class="circular-carousel__inner"></div>
                  <div class="circular-carousel__shade"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="captions && current"
      class="circular-carousel__caption"
      aria-hidden="true"
    >
      <span :key="active" class="circular-carousel__title">
        {{ current.title || current.alt }}
        <span v-if="current.subtitle" class="circular-carousel__subtitle">{{
          current.subtitle
        }}</span>
      </span>
      <span class="circular-carousel__count">
        <CircularCarouselDigits :value="active + 1" />
        <span class="circular-carousel__slash">/</span>
        <span>{{ totalLabel }}</span>
      </span>
    </div>
    <div class="circular-carousel__live" aria-live="polite" aria-atomic="true">
      {{ `${label}, ${active + 1} of ${count}` }}
    </div>
  </div>
</template>

<style scoped>
  .circular-carousel {
    --cc-fade: #000000;
    --cc-radius: 12px;
    --cc-inner: 0.4;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    outline: none;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .circular-carousel[data-axis='x'] {
    touch-action: pan-x;
  }

  .circular-carousel[data-draggable] {
    cursor: grab;
  }

  .circular-carousel[data-dragging] {
    cursor: grabbing;
  }

  .circular-carousel:focus-visible {
    box-shadow: inset 0 0 0 2px rgba(128, 128, 140, 0.55);
  }

  .circular-carousel__view {
    position: absolute;
    inset: 0;
  }

  .circular-carousel[data-shape='wheel'] .circular-carousel__view {
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent,
      #000000 18%,
      #000000 82%,
      transparent
    );
    mask-image: linear-gradient(
      to bottom,
      transparent,
      #000000 18%,
      #000000 82%,
      transparent
    );
  }

  .circular-carousel[data-shape='panorama'] .circular-carousel__view {
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      #000000 12%,
      #000000 88%,
      transparent
    );
    mask-image: linear-gradient(
      to right,
      transparent,
      #000000 12%,
      #000000 88%,
      transparent
    );
  }

  .circular-carousel__stage {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.45s ease;
  }

  .circular-carousel[data-ready] .circular-carousel__stage {
    opacity: 1;
  }

  .circular-carousel__camera,
  .circular-carousel__ring,
  .circular-carousel__card {
    width: 0;
    height: 0;
    transform-style: preserve-3d;
  }

  .circular-carousel__camera {
    position: relative;
  }

  .circular-carousel__ring,
  .circular-carousel__card {
    position: absolute;
    left: 0;
    top: 0;
  }

  .circular-carousel__tile {
    position: absolute;
    outline: 1px solid transparent;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .circular-carousel__frame {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    overflow: hidden;
  }

  .circular-carousel__photo {
    position: absolute;
    display: block;
    max-width: none;
    object-fit: cover;
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
  }

  .circular-carousel__photo--leaving {
    animation: circular-carousel-leave 700ms cubic-bezier(0.33, 1, 0.68, 1) both;
  }

  .circular-carousel__shade,
  .circular-carousel__inner {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .circular-carousel__shade {
    background: var(--cc-fade);
    opacity: var(--cc-depth, 0);
  }

  .circular-carousel__inner {
    background: #000000;
    opacity: var(--cc-inner);
  }

  .circular-carousel__caption {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    color: inherit;
    text-align: center;
    pointer-events: none;
    animation: circular-carousel-reveal 900ms ease both;
  }

  .circular-carousel__title {
    display: flex;
    max-width: 100%;
    flex-direction: column;
    align-items: center;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.35;
    animation: circular-carousel-title 520ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .circular-carousel__subtitle {
    font-weight: 400;
    opacity: 0.6;
  }

  .circular-carousel__count {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    opacity: 0.5;
  }

  .circular-carousel__slash {
    opacity: 0.6;
  }

  .circular-carousel__live {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @keyframes circular-carousel-title {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes circular-carousel-leave {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes circular-carousel-reveal {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .circular-carousel__stage {
      transition: none;
    }

    .circular-carousel__caption,
    .circular-carousel__title {
      animation: none;
    }
  }
</style>
