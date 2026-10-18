<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    defaultDocument,
    defaultWindow,
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    EFFECTS,
    FONT,
    HIDDEN,
    LINE_STYLES,
    clamp,
    toRgb,
  } from './crosshair-utils';
  import type {
    CrosshairBox,
    CrosshairInk,
    CrosshairProps,
    CrosshairPulse,
    CrosshairSettings,
  } from './types';

  const props = withDefaults(defineProps<CrosshairProps>(), {
    color: '#ffffff',
    container: null,
    thickness: 1,
    opacity: 0.85,
    lineStyle: 'solid',
    gap: 0,
    fade: 0,
    smoothing: 0.35,
    showCoordinates: true,
    targetEffect: 'lock',
    targetSelector: 'a, button, [data-crosshair-target]',
    clickPulse: true,
    hideCursor: false,
    blendMode: 'normal',
    class: '',
  });

  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<CrosshairSettings>(() => ({
    color: props.color,
    thickness: clamp(props.thickness, 0.5, 8),
    opacity: clamp(props.opacity, 0, 1),
    lineStyle: LINE_STYLES.includes(props.lineStyle)
      ? props.lineStyle
      : 'solid',
    gap: Math.max(0, props.gap),
    fade: clamp(props.fade, 0, 1),
    smoothing: clamp(props.smoothing, 0, 1),
    showCoordinates: props.showCoordinates,
    targetEffect: EFFECTS.includes(props.targetEffect)
      ? props.targetEffect
      : 'lock',
    targetSelector: props.targetSelector,
    clickPulse: props.clickPulse,
    hideCursor: props.hideCursor,
  }));

  const canvasStyle = computed(() => ({
    position: props.container ? ('absolute' as const) : ('fixed' as const),
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
    zIndex: 10000,
    mixBlendMode: props.blendMode,
  }));

  const state: {
    x: number;
    y: number;
    tx: number;
    ty: number;
    clientX: number;
    clientY: number;
    inside: boolean;
    seen: boolean;
    presence: number;
    glitch: number;
    target: Element | null;
    lock: CrosshairBox & { alpha: number };
    pulses: CrosshairPulse[];
  } = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    clientX: 0,
    clientY: 0,
    inside: false,
    seen: false,
    presence: 0,
    glitch: 0,
    target: null,
    lock: { x: 0, y: 0, w: 0, h: 0, alpha: 0 },
    pulses: [],
  };
  const size = { w: 0, h: 0, dpr: 1 };
  let ctx: CanvasRenderingContext2D | null = null;
  let ink: CrosshairInk = { r: 255, g: 255, b: 255, a: 1 };
  let inkSource = '';
  let raf = 0;
  let last = 0;
  let alive = false;
  let cursorOwner: HTMLElement | null = null;

  function reduce(): boolean {
    return reducedMotion.value === 'reduce';
  }

  function resize() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    size.dpr = Math.min(window.devicePixelRatio || 1, 2);
    size.w = rect.width;
    size.h = rect.height;
    canvas.width = Math.max(1, Math.round(rect.width * size.dpr));
    canvas.height = Math.max(1, Math.round(rect.height * size.dpr));
    wake();
  }

  function rgba(alpha: number): string {
    return `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${clamp(alpha * ink.a, 0, 1)})`;
  }

  function crisp(value: number, width: number): number {
    const device = Math.round(width * size.dpr);
    return (Math.round(value * size.dpr) + (device % 2 ? 0.5 : 0)) / size.dpr;
  }

  function tag(
    c: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    align: 'center' | 'middle',
  ) {
    c.font = FONT;
    const width = c.measureText(text).width + 10;
    const height = 16;
    let left = align === 'center' ? x - width / 2 : x;
    let top = align === 'middle' ? y - height / 2 : y;
    left = clamp(left, 4, size.w - width - 4);
    top = clamp(top, 4, size.h - height - 4);
    const light = ink.r * 0.2126 + ink.g * 0.7152 + ink.b * 0.0722 > 150;
    c.fillStyle = rgba(1);
    c.beginPath();
    c.roundRect(left, top, width, height, 3);
    c.fill();
    c.fillStyle = light ? '#0a0a0a' : '#ffffff';
    c.textBaseline = 'middle';
    c.textAlign = 'center';
    c.fillText(text, left + width / 2, top + height / 2 + 0.5);
  }

  function segment(
    c: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    horizontal: boolean,
    s: CrosshairSettings,
  ) {
    const length = horizontal ? x2 - x1 : y2 - y1;
    if (length <= 0) return;
    if (s.fade > 0) {
      const gradient = horizontal
        ? c.createLinearGradient(0, 0, size.w, 0)
        : c.createLinearGradient(0, 0, 0, size.h);
      const at = clamp(
        horizontal ? state.x / size.w : state.y / size.h,
        0.001,
        0.999,
      );
      gradient.addColorStop(0, rgba(1 - s.fade));
      gradient.addColorStop(at, rgba(1));
      gradient.addColorStop(1, rgba(1 - s.fade));
      c.strokeStyle = gradient;
    } else {
      c.strokeStyle = rgba(1);
    }
    c.beginPath();
    if (state.glitch > 0.01) {
      const pieces = Math.max(4, Math.round(length / 28));
      for (let i = 0; i < pieces; i++) {
        const jitter = (Math.random() - 0.5) * 14 * state.glitch;
        const from = i / pieces;
        const to = (i + 1) / pieces;
        if (horizontal) {
          c.moveTo(x1 + length * from, y1 + jitter);
          c.lineTo(x1 + length * to, y1 + jitter);
        } else {
          c.moveTo(x1 + jitter, y1 + length * from);
          c.lineTo(x1 + jitter, y1 + length * to);
        }
      }
    } else {
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
    }
    c.stroke();
  }

  function brackets(
    c: CanvasRenderingContext2D,
    box: CrosshairBox,
    alpha: number,
  ) {
    const { x, y, w, h } = box;
    const arm = Math.min(14, w / 3, h / 3);
    c.strokeStyle = rgba(alpha);
    c.lineWidth = Math.max(1.5, settings.value.thickness);
    c.setLineDash([]);
    c.lineCap = 'square';
    c.beginPath();
    c.moveTo(x, y + arm);
    c.lineTo(x, y);
    c.lineTo(x + arm, y);
    c.moveTo(x + w - arm, y);
    c.lineTo(x + w, y);
    c.lineTo(x + w, y + arm);
    c.moveTo(x + w, y + h - arm);
    c.lineTo(x + w, y + h);
    c.lineTo(x + w - arm, y + h);
    c.moveTo(x + arm, y + h);
    c.lineTo(x, y + h);
    c.lineTo(x, y + h - arm);
    c.stroke();
  }

  function draw(c: CanvasRenderingContext2D) {
    const s = settings.value;
    c.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    c.clearRect(0, 0, size.w, size.h);
    if (state.presence > 0.001) {
      c.globalAlpha = state.presence * s.opacity * (1 - 0.6 * state.lock.alpha);
      c.lineWidth = s.thickness;
      c.lineCap = s.lineStyle === 'dotted' ? 'round' : 'butt';
      if (s.lineStyle === 'dashed')
        c.setLineDash([s.thickness * 6, s.thickness * 5]);
      else if (s.lineStyle === 'dotted') c.setLineDash([0, s.thickness * 4]);
      else c.setLineDash([]);
      const x = crisp(state.x, s.thickness);
      const y = crisp(state.y, s.thickness);
      segment(c, 0, y, x - s.gap, y, true, s);
      segment(c, x + s.gap, y, size.w, y, true, s);
      segment(c, x, 0, x, y - s.gap, false, s);
      segment(c, x, y + s.gap, x, size.h, false, s);
      if (s.hideCursor) {
        c.fillStyle = rgba(1);
        c.beginPath();
        c.arc(
          state.x,
          state.y,
          Math.max(1.5, s.thickness * 1.5),
          0,
          Math.PI * 2,
        );
        c.fill();
      }
      if (s.showCoordinates && state.lock.alpha < 0.999) {
        c.globalAlpha = state.presence * s.opacity * (1 - state.lock.alpha);
        tag(c, String(Math.round(state.x)), state.x, 8, 'center');
        tag(c, String(Math.round(state.y)), 8, state.y, 'middle');
      }
    }
    if (state.lock.alpha > 0.001) {
      const lock = state.lock;
      c.globalAlpha = lock.alpha * s.opacity;
      brackets(c, lock, 1);
      if (s.showCoordinates && state.target) {
        const box = state.target.getBoundingClientRect();
        tag(
          c,
          `${Math.round(box.width)} × ${Math.round(box.height)}`,
          lock.x + lock.w / 2,
          lock.y + lock.h + 8,
          'center',
        );
      }
    }
    for (const pulse of state.pulses) {
      const t = pulse.age / 0.55;
      const eased = 1 - (1 - t) ** 3;
      c.globalAlpha = (1 - t) ** 2 * s.opacity;
      c.strokeStyle = rgba(1);
      c.lineWidth = Math.max(1, s.thickness);
      c.setLineDash([]);
      c.beginPath();
      c.arc(pulse.x, pulse.y, 3 + 30 * eased, 0, Math.PI * 2);
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  function relative(): DOMRect | null {
    const canvas = canvasRef.value;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    state.tx = state.clientX - rect.left;
    state.ty = state.clientY - rect.top;
    return rect;
  }

  function tick(now: number) {
    raf = 0;
    if (!alive || !ctx) return;
    const s = settings.value;
    const reduced = reduce();
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    if (s.color !== inkSource) {
      inkSource = s.color;
      ink = toRgb(ctx, s.color);
    }
    const rect = relative();
    if (!rect) return;
    const follow =
      reduced || s.smoothing === 0
        ? 1
        : 1 - Math.exp(-dt / (0.008 + s.smoothing * 0.16));
    state.x += (state.tx - state.x) * follow;
    state.y += (state.ty - state.y) * follow;
    const wanted = state.inside ? 1 : 0;
    state.presence +=
      (wanted - state.presence) *
      (reduced ? 1 : 1 - Math.exp(-dt / (wanted ? 0.12 : 0.25)));
    if (Math.abs(wanted - state.presence) < 0.002) state.presence = wanted;
    const lock = state.lock;
    const locked =
      s.targetEffect === 'lock' && state.inside ? state.target : null;
    let goal: CrosshairBox;
    if (locked) {
      const box = locked.getBoundingClientRect();
      goal = {
        x: box.left - rect.left - 6,
        y: box.top - rect.top - 6,
        w: box.width + 12,
        h: box.height + 12,
      };
    } else {
      goal = { x: state.x - 10, y: state.y - 10, w: 20, h: 20 };
    }
    const snap = reduced ? 1 : 1 - Math.exp(-dt / 0.085);
    lock.x += (goal.x - lock.x) * snap;
    lock.y += (goal.y - lock.y) * snap;
    lock.w += (goal.w - lock.w) * snap;
    lock.h += (goal.h - lock.h) * snap;
    const shown = locked ? 1 : 0;
    lock.alpha +=
      (shown - lock.alpha) *
      (reduced ? 1 : 1 - Math.exp(-dt / (shown ? 0.08 : 0.14)));
    if (Math.abs(shown - lock.alpha) < 0.002) lock.alpha = shown;
    state.glitch = reduced ? 0 : Math.max(0, state.glitch - dt / 0.5);
    state.pulses = state.pulses.filter((pulse) => (pulse.age += dt) < 0.55);
    draw(ctx);
    const settling =
      Math.abs(state.tx - state.x) > 0.05 ||
      Math.abs(state.ty - state.y) > 0.05 ||
      state.presence !== wanted ||
      lock.alpha !== shown ||
      (locked &&
        Math.abs(goal.w - lock.w) +
          Math.abs(goal.x - lock.x) +
          Math.abs(goal.y - lock.y) >
          0.1) ||
      state.glitch > 0 ||
      state.pulses.length > 0;
    if (settling) raf = requestAnimationFrame(tick);
  }

  function wake() {
    if (raf || !alive) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function setCursorHidden(hidden: boolean) {
    const owner = props.container ?? defaultDocument?.documentElement ?? null;
    if (cursorOwner && cursorOwner !== owner)
      cursorOwner.classList.remove(HIDDEN);
    cursorOwner = owner;
    owner?.classList.toggle(HIDDEN, hidden);
  }

  function pick(element: EventTarget | null): Element | null {
    const s = settings.value;
    if (s.targetEffect === 'none' || !(element instanceof Element)) return null;
    let found: Element | null;
    try {
      found = element.closest(s.targetSelector);
    } catch {
      found = null;
    }
    if (found && props.container && !props.container.contains(found))
      return null;
    return found;
  }

  function retarget(element: EventTarget | null) {
    const next = pick(element);
    if (next === state.target) return;
    state.target = next;
    if (next && settings.value.targetEffect === 'glitch') state.glitch = 1;
  }

  function enter() {
    if (!state.seen) {
      state.seen = true;
      relative();
      state.x = state.tx;
      state.y = state.ty;
      state.lock.x = state.x - 10;
      state.lock.y = state.y - 10;
      state.lock.w = 20;
      state.lock.h = 20;
    }
    state.inside = true;
    setCursorHidden(settings.value.hideCursor);
  }

  function leave() {
    state.inside = false;
    state.target = null;
    setCursorHidden(false);
    wake();
  }

  function onMove(event: PointerEvent) {
    state.clientX = event.clientX;
    state.clientY = event.clientY;
    if (event.pointerType === 'touch' && event.buttons === 0) return;
    enter();
    retarget(event.target);
    wake();
  }

  function onDown(event: PointerEvent) {
    onMove(event);
    if (!settings.value.clickPulse || reduce()) return;
    relative();
    state.pulses.push({ x: state.tx, y: state.ty, age: 0 });
    wake();
  }

  function onUp(event: PointerEvent) {
    if (event.pointerType !== 'mouse') leave();
  }

  function onWindowOut(event: PointerEvent) {
    if (!event.relatedTarget) leave();
  }

  function onScroll() {
    if (!state.inside) return;
    retarget(document.elementFromPoint(state.clientX, state.clientY));
    wake();
  }

  function scope(): HTMLElement | Window | undefined {
    return props.container ?? defaultWindow;
  }

  function hostTarget(): HTMLElement | undefined {
    return props.container ?? undefined;
  }

  function documentTarget(): Document | undefined {
    return props.container ? undefined : defaultDocument;
  }

  useEventListener(scope, 'pointermove', onMove);
  useEventListener(scope, 'pointerdown', onDown);
  useEventListener('pointerup', onUp);
  useEventListener('pointercancel', onUp);
  useEventListener('scroll', onScroll, { capture: true, passive: true });
  useEventListener(hostTarget, 'pointerleave', leave);
  useEventListener(documentTarget, 'pointerout', onWindowOut);
  useResizeObserver(canvasRef, resize);

  watch(settings, () => {
    setCursorHidden(state.inside && settings.value.hideCursor);
    wake();
  });

  watch(
    () => props.container,
    () => {
      leave();
      state.seen = false;
      resize();
    },
  );

  onMounted(() => {
    ctx = canvasRef.value?.getContext('2d') ?? null;
    alive = true;
    resize();
  });

  onBeforeUnmount(() => {
    alive = false;
    cancelAnimationFrame(raf);
    raf = 0;
    cursorOwner?.classList.remove(HIDDEN);
  });
</script>

<template>
  <canvas
    ref="canvas"
    aria-hidden="true"
    :class="cn(props.class)"
    :style="canvasStyle"
  />
</template>

<style>
  .crosshair-cursor-hidden,
  .crosshair-cursor-hidden * {
    cursor: none !important;
  }
</style>
