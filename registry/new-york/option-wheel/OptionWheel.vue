<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import { useEventListener, usePreferredReducedMotion } from '@vueuse/core';
  import type { OptionWheelDrag, OptionWheelProps } from './types';

  const props = withDefaults(defineProps<OptionWheelProps>(), {
    items: () => [
      'Ambient',
      'House',
      'Techno',
      'Jazz',
      'Lo-Fi',
      'Synthwave',
      'Trance',
      'Funk',
      'Disco',
      'Hip-Hop',
      'Chillwave',
      'Drum & Bass',
    ],
    defaultSelected: 3,
    textColor: '#a6a6a6',
    activeColor: '#ffffff',
    side: 'left',
    fontSize: 3,
    spacing: 1.4,
    curve: 1,
    tilt: 6,
    blur: 2,
    fade: 0.25,
    minOpacity: 0.05,
    smoothing: 200,
    inset: 80,
    loop: false,
    draggable: true,
    soundUrl: '',
    soundVolume: 0.5,
    class: '',
  });

  const emit = defineEmits<{
    change: [index: number, item: string];
  }>();

  const rootRef = useTemplateRef<HTMLDivElement>('root');
  const selectedIndex = ref(props.defaultSelected);
  const isDragging = ref(false);
  const ready = ref(false);
  const remPx = ref(16);
  const motion = usePreferredReducedMotion();

  const rowH = computed(() =>
    Math.max(props.fontSize * props.spacing * remPx.value, 1),
  );

  const rootStyle = computed(() => ({
    '--ow-text-color': props.textColor,
    '--ow-active-color': props.activeColor,
    '--ow-font-size': `${props.fontSize}rem`,
    '--ow-inset': `${props.inset}px`,
  }));

  let pos = props.defaultSelected;
  let target = props.defaultSelected;
  let selected = props.defaultSelected;
  let raf = 0;
  let last = 0;
  let wheelTimer: ReturnType<typeof setTimeout> | undefined;
  let drag: OptionWheelDrag | null = null;
  let dragMoved = false;
  let audio: HTMLAudioElement | null = null;
  let audioUrl = '';
  let lastTick = 0;

  // One rAF loop eases the wheel position toward its target with
  // frame-rate independent exponential smoothing, then lays every option
  // out along the curve based on its distance from the current position.
  function runFrame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const tau = Math.max(props.smoothing, 1) / 1000;
    const k = motion.value === 'reduce' ? 1 : 1 - Math.exp(-dt / tau);

    let next = pos + (target - pos) * k;
    const settled = Math.abs(target - next) < 0.001;
    if (settled) next = target;
    pos = next;

    const root = rootRef.value;
    const n = props.items.length;
    const mirror = props.side === 'right' ? -1 : 1;
    // Options sit on a circle whose radius keeps the arc length between two
    // neighbours equal to one row height, so tilt controls the curl.
    const tiltRad = (props.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? rowH.value / tiltRad : 0;
    const els = root ? root.children : null;
    for (let i = 0; i < n && els; i++) {
      const el = els[i];
      if (!(el instanceof HTMLElement)) continue;
      let d = i - next;
      if (props.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const dist = Math.abs(d);
      let x = 0;
      let y = d * rowH.value;
      let rot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * props.curve;
        rot = (mirror * ang * 180) / Math.PI;
      }
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      el.style.opacity = String(
        Math.max(props.minOpacity, 1 - dist * props.fade),
      );
      el.style.filter =
        props.blur > 0 ? `blur(${(dist * props.blur).toFixed(2)}px)` : 'none';
      el.style.setProperty(
        '--ow-p',
        Math.max(0, 1 - Math.min(dist, 1)).toFixed(4),
      );
    }

    raf = settled ? 0 : requestAnimationFrame(runFrame);
  }

  function startLoop() {
    if (raf) cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(runFrame);
  }

  // Optional tick on selection change, throttled so fast scrolling can't
  // spam it, with playback failures (autoplay policies) ignored.
  function playTick() {
    if (!props.soundUrl) return;
    const now = performance.now();
    if (now - lastTick < 70) return;
    lastTick = now;
    if (!audio || audioUrl !== props.soundUrl) {
      audio = new Audio(props.soundUrl);
      audio.preload = 'auto';
      audioUrl = props.soundUrl;
    }
    audio.volume = Math.min(Math.max(props.soundVolume, 0), 1);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function applyTarget(value: number, snap: boolean) {
    const count = props.items.length;
    if (!count) return;
    let v = value;
    if (!props.loop) v = Math.min(Math.max(v, 0), Math.max(count - 1, 0));
    if (snap) v = Math.round(v);
    target = v;
    const idx = ((Math.round(v) % count) + count) % count;
    if (idx !== selected) {
      selected = idx;
      selectedIndex.value = idx;
      emit('change', idx, props.items[idx] ?? '');
      playTick();
    }
    startLoop();
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaMode === 1 ? event.deltaY * 24 : event.deltaY;
    // One step per event at most, so notchy mouse wheels move exactly one
    // option per click while touchpads still scroll continuously.
    const step = Math.max(-1, Math.min(1, delta / rowH.value));
    applyTarget(target + step, false);
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => applyTarget(target, true), 140);
  }
  useEventListener(rootRef, 'wheel', onWheel, { passive: false });

  function handlePointerDown(event: PointerEvent) {
    if (!props.draggable) return;
    drag = { y: event.clientY, start: target, id: event.pointerId };
    dragMoved = false;
    isDragging.value = true;
  }

  function handlePointerMove(event: PointerEvent) {
    if (!drag) return;
    const dy = event.clientY - drag.y;
    if (!dragMoved && Math.abs(dy) > 4) {
      dragMoved = true;
      // Capture only once a real drag starts, so plain clicks still reach
      // the items.
      rootRef.value?.setPointerCapture(drag.id);
    }
    if (dragMoved) applyTarget(drag.start - dy / rowH.value, false);
  }

  function handlePointerEnd() {
    if (!drag) return;
    drag = null;
    isDragging.value = false;
    if (dragMoved) applyTarget(target, true);
  }

  function handleItemClick(index: number) {
    if (dragMoved) return;
    const count = props.items.length;
    let d = index - (((target % count) + count) % count);
    if (props.loop && count > 1) {
      if (d > count / 2) d -= count;
      else if (d < -count / 2) d += count;
    }
    applyTarget(target + d, true);
  }

  function handleKeyDown(event: KeyboardEvent) {
    let delta: number | null = null;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') delta = -1;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') delta = 1;
    if (delta === null) return;
    event.preventDefault();
    applyTarget(Math.round(target) + delta, true);
  }

  watch(
    [
      () => props.items,
      () => props.fontSize,
      () => props.spacing,
      () => props.curve,
      () => props.tilt,
      () => props.blur,
      () => props.fade,
      () => props.minOpacity,
      () => props.side,
      () => props.loop,
      () => props.smoothing,
    ],
    () => applyTarget(target, false),
    { flush: 'post' },
  );

  onMounted(() => {
    remPx.value =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16;
    applyTarget(target, false);
    ready.value = true;
  });

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(wheelTimer);
    audio?.pause();
  });
</script>

<template>
  <div
    ref="root"
    role="listbox"
    tabindex="0"
    aria-label="Option wheel"
    :class="[
      'option-wheel',
      side === 'right' && 'option-wheel--right',
      isDragging && 'option-wheel--dragging',
      props.class,
    ]"
    :data-ready="ready ? '' : undefined"
    :style="rootStyle"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerEnd"
    @pointercancel="handlePointerEnd"
    @keydown="handleKeyDown"
  >
    <div
      v-for="(label, index) in items"
      :key="`${label}-${index}`"
      role="option"
      :aria-selected="selectedIndex === index"
      :class="[
        'option-wheel__item',
        selectedIndex === index && 'option-wheel__item--selected',
      ]"
      @click="handleItemClick(index)"
    >
      {{ label }}
    </div>
  </div>
</template>

<style scoped>
  .option-wheel {
    --ow-text-color: #a6a6a6;
    --ow-active-color: #ffffff;
    --ow-font-size: 3rem;
    --ow-inset: 80px;

    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    cursor: grab;
    user-select: none;
    touch-action: none;
    outline: none;
  }

  .option-wheel:focus-visible {
    box-shadow: inset 0 0 0 2px
      color-mix(in srgb, var(--ow-active-color) 45%, transparent);
  }

  .option-wheel--dragging {
    cursor: grabbing;
  }

  /* Each option is absolutely centred, then offset along the curve by the
     rAF loop through transform/opacity/filter, so everything stays in step. */
  .option-wheel__item {
    position: absolute;
    top: 50%;
    left: var(--ow-inset);
    white-space: nowrap;
    font-size: var(--ow-font-size);
    line-height: 1;
    font-weight: 200;
    transform-origin: left center;
    cursor: pointer;
    will-change: transform, opacity, filter;
    /* --ow-p goes 0 -> 1 as an option approaches the middle of the wheel */
    color: color-mix(
      in srgb,
      var(--ow-active-color) calc(var(--ow-p, 0) * 100%),
      var(--ow-text-color)
    );
  }

  .option-wheel:not([data-ready]) .option-wheel__item {
    visibility: hidden;
  }

  .option-wheel--right .option-wheel__item {
    left: auto;
    right: var(--ow-inset);
    transform-origin: right center;
  }

  .option-wheel__item--selected {
    font-weight: 500;
  }
</style>
