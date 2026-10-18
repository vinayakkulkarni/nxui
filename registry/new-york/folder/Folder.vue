<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createFolderEngine } from './folder-engine';
  import { createGlass } from './folder-glass';
  import {
    DEFAULT_ITEMS,
    MAX_ITEMS,
    backPath,
    clamp,
    luma,
    measureFolder,
    mixRgb,
    parseColor,
    rgbString,
    toFolderItem,
  } from './folder-math';
  import type {
    FolderEmits,
    FolderEngine,
    FolderEntry,
    FolderGlassRenderer,
    FolderProps,
    FolderSettings,
    FolderSlots,
  } from './types';

  const props = withDefaults(defineProps<FolderProps>(), {
    items: undefined,
    label: undefined,
    mode: 'flap',
    variant: 'solid',
    color: '#3d8bff',
    paperColor: '#ffffff',
    tabPosition: 'right',
    layout: 'spread',
    size: 1,
    openOn: 'click',
    open: undefined,
    defaultOpen: false,
    draggable: true,
    zoomOnClick: true,
    peek: true,
    intro: true,
    tilt: 0.5,
    bounce: 0.4,
    speed: 1,
    frost: 0.25,
    closeOnOutsideClick: true,
    theme: 'dark',
    class: '',
  });

  const emit = defineEmits<FolderEmits>();
  defineSlots<FolderSlots>();

  const rootRef = ref<HTMLDivElement | null>(null);
  const backRef = ref<HTMLDivElement | null>(null);
  const frontRef = ref<HTMLDivElement | null>(null);
  const groundRef = ref<HTMLSpanElement | null>(null);
  const castRef = ref<HTMLSpanElement | null>(null);
  const shadeRef = ref<HTMLSpanElement | null>(null);
  const glassRef = ref<HTMLCanvasElement | null>(null);
  const measureRef = ref<HTMLSpanElement | null>(null);
  const itemEls: (HTMLElement | null)[] = [];

  const internalOpen = ref(props.defaultOpen);
  const labelWidth = ref(0);
  const outside = ref<number[]>([]);
  const gpu = ref(false);
  const renderer = shallowRef<FolderGlassRenderer | null>(null);
  let engine: FolderEngine | null = null;

  const motion = usePreferredReducedMotion();

  const isOpen = computed(() =>
    props.open !== undefined ? props.open : internalOpen.value,
  );
  const book = computed(() => props.mode === 'book');
  const glass = computed(() => props.variant === 'glass');

  const entries = computed<FolderEntry[]>(() =>
    (props.items?.length ? props.items : DEFAULT_ITEMS).slice(0, MAX_ITEMS),
  );
  const pages = computed(() => entries.value.map(toFolderItem));

  const scale = computed(() => Math.max(0.3, Number(props.size) || 1));
  const geometry = computed(() =>
    measureFolder(
      book.value,
      scale.value,
      labelWidth.value,
      Boolean(props.label),
      props.tabPosition,
    ),
  );
  const total = computed(() => geometry.value.tabH + geometry.value.h);
  const view = computed(() => {
    const g = geometry.value;
    return book.value
      ? {
          x: -0.75 * g.w,
          y: -0.25 * total.value,
          width: 2.5 * g.w,
          height: 1.5 * total.value,
        }
      : {
          x: -0.25 * g.w,
          y: -0.1 * total.value,
          width: 1.5 * g.w,
          height: 1.3 * total.value,
        };
  });

  const rgb = computed(() => parseColor(props.color));
  const paper = computed(() => parseColor(props.paperColor));
  const backTone = computed(() => mixRgb(rgb.value, [0, 0, 0], 0.16));
  const insideTopRgb = computed(() => mixRgb(rgb.value, [0, 0, 0], 0.08));
  const depth = computed(() =>
    Math.round(Math.max(geometry.value.w, geometry.value.h) * 5),
  );

  const settings = computed<FolderSettings>(() => ({
    open: isOpen.value,
    layout: props.layout,
    openOn: props.openOn,
    peek: props.peek,
    draggable: props.draggable,
    zoomOnClick: props.zoomOnClick,
    closeOnOutsideClick: props.closeOnOutsideClick,
    tilt: clamp(props.tilt, 0, 1.5),
    bounce: clamp(props.bounce, 0, 1),
    speed: clamp(props.speed, 0.2, 3),
    frost: clamp(props.frost, 0, 1),
    count: entries.value.length,
    entries: entries.value,
    glass: glass.value,
    light: props.theme === 'light',
    tint: rgb.value,
    insideTop: rgbString(insideTopRgb.value),
    insideBottom: rgbString(backTone.value),
    insideTone: [
      insideTopRgb.value.map((v) => v / 255),
      backTone.value.map((v) => v / 255),
    ],
    content: `${props.mode}|${scale.value}|${props.paperColor}|${props.color}|${geometry.value.tabX}|${geometry.value.tabW}`,
    depth: depth.value,
    view: view.value,
    g: geometry.value,
  }));

  const shape = computed(() => backPath(geometry.value));

  const vars = computed(() => {
    const g = geometry.value;
    return {
      '--folder-rgb': rgb.value.join(', '),
      '--folder-base': rgbString(rgb.value),
      '--folder-front-top': rgbString(mixRgb(rgb.value, [255, 255, 255], 0.12)),
      '--folder-front-bottom': rgbString(mixRgb(rgb.value, [0, 0, 0], 0.06)),
      '--folder-inside-top': rgbString(insideTopRgb.value),
      '--folder-inside-bottom': rgbString(backTone.value),
      '--folder-tab-ink':
        luma(backTone.value) > 0.6
          ? 'rgba(0, 0, 0, 0.72)'
          : 'rgba(255, 255, 255, 0.92)',
      '--folder-paper': rgbString(paper.value),
      '--folder-paper-ink': rgbString(mixRgb(paper.value, [0, 0, 0], 0.11)),
      '--folder-paper-ink-strong': rgbString(
        mixRgb(paper.value, [0, 0, 0], 0.28),
      ),
      '--folder-paper-text': rgbString(mixRgb(paper.value, [0, 0, 0], 0.72)),
      '--folder-w': `${g.w}px`,
      '--folder-h': `${g.h}px`,
      '--folder-tab-h': `${g.tabH}px`,
      '--folder-front-y': `${g.frontTop}px`,
      '--folder-front-h': `${g.frontH}px`,
      '--folder-r': `${g.r}px`,
      '--folder-front-radius': book.value
        ? `0 ${g.r}px ${g.r}px 0`
        : `${g.r}px`,
      '--folder-doc-w': `${g.docW}px`,
      '--folder-doc-h': `${g.docH}px`,
      '--folder-frost': `${(1.5 + clamp(props.frost, 0, 1) * 10) * scale.value}px`,
      '--folder-depth': `${depth.value}px`,
      '--folder-scale': String(scale.value),
    };
  });

  const glassStyle = computed(() => ({
    left: `${view.value.x}px`,
    top: `${view.value.y}px`,
    width: `${view.value.width}px`,
    height: `${view.value.height}px`,
  }));

  function setOpen(value: boolean) {
    const current = isOpen.value;
    if (props.open === undefined) internalOpen.value = value;
    if (value !== current) emit('update:open', value);
  }

  function setOutside(list: number[]) {
    const previous = outside.value;
    if (
      previous.length === list.length &&
      previous.every((value, i) => value === list[i])
    )
      return;
    outside.value = list;
  }

  function setItemRef(
    el: Element | ComponentPublicInstance | null,
    index: number,
  ) {
    itemEls[index] = el instanceof HTMLElement ? el : null;
  }

  function measureLabel() {
    const node = measureRef.value;
    if (node) labelWidth.value = node.offsetWidth;
  }

  function toggle() {
    if (engine?.blur()) return;
    if (props.openOn === 'hover') return;
    setOpen(!isOpen.value);
  }

  function onStageKey(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  }

  function isInteractive(index: number) {
    return isOpen.value || outside.value.includes(index);
  }

  function onItemActivate(event: MouseEvent, index: number) {
    if (!engine) return;
    if (engine.consumeClick()) {
      event.stopPropagation();
      return;
    }
    if (!engine.interactive(index)) return;
    event.stopPropagation();
    engine.select(index);
  }

  function onItemKey(event: KeyboardEvent, index: number) {
    if (!isInteractive(index) || (event.key !== 'Enter' && event.key !== ' '))
      return;
    event.preventDefault();
    event.stopPropagation();
    engine?.select(index);
  }

  function onRootMove(event: PointerEvent) {
    engine?.onMove(event);
  }

  function onRootLeave(event: PointerEvent) {
    engine?.onLeave(event);
  }

  function onRootDown(event: PointerEvent) {
    engine?.onDown(event);
  }

  function onWindowUp(event: PointerEvent) {
    engine?.onUp(event);
  }

  useEventListener('pointerup', onWindowUp);
  useEventListener('pointercancel', onWindowUp);

  watch([() => props.label, scale], measureLabel, { flush: 'post' });
  watch(settings, () => engine?.wake(), { flush: 'post' });

  function onContextLost(event: Event) {
    event.preventDefault();
    renderer.value = null;
    gpu.value = false;
  }

  watch(
    glassRef,
    (canvas, _previous, onCleanup) => {
      if (!canvas) return;
      const created = createGlass(canvas);
      if (!created) return;
      renderer.value = created;
      gpu.value = true;
      canvas.addEventListener('webglcontextlost', onContextLost);
      engine?.invalidate();
      onCleanup(() => {
        canvas.removeEventListener('webglcontextlost', onContextLost);
        created.dispose();
        if (renderer.value === created) renderer.value = null;
        gpu.value = false;
      });
    },
    { flush: 'post' },
  );

  onMounted(() => {
    const root = rootRef.value;
    if (!root) return;
    measureLabel();
    engine = createFolderEngine({
      elements: {
        root,
        back: () => backRef.value,
        front: () => frontRef.value,
        ground: () => groundRef.value,
        cast: () => castRef.value,
        shade: () => shadeRef.value,
        canvas: () => glassRef.value,
        item: (index) => itemEls[index] ?? null,
        renderer: () => renderer.value,
      },
      settings: () => settings.value,
      reduce: () => motion.value === 'reduce',
      setOpen,
      setOutside,
      onItemClick: (item, index) => emit('itemClick', item, index),
      onItemDrop: (item, index, inside) =>
        emit('itemDrop', item, index, inside),
    });

    useEventListener(document, 'pointerdown', (event: PointerEvent) =>
      engine?.onDocumentDown(event),
    );
    useEventListener(document, 'keydown', (event: KeyboardEvent) =>
      engine?.onKey(event),
    );

    void document.fonts.ready.then(() => {
      measureLabel();
      engine?.invalidate();
    });

    if (props.intro && motion.value !== 'reduce') {
      engine.waitForIntro();
      const { stop } = useIntersectionObserver(
        root,
        (observed) => {
          if (!observed.some((entry) => entry.isIntersecting)) return;
          stop();
          engine?.beginIntro();
        },
        { threshold: 0.2 },
      );
    }

    if (glassRef.value && renderer.value) engine.invalidate();
    engine.wake();
  });

  onBeforeUnmount(() => {
    engine?.dispose();
    engine = null;
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('folder-root', props.class)"
    :data-mode="book ? 'book' : 'flap'"
    :data-variant="variant"
    :data-theme="theme === 'light' ? 'light' : 'dark'"
    :data-open="isOpen ? '' : undefined"
    :data-gl="glass && gpu ? '' : undefined"
    :data-draggable="draggable ? '' : undefined"
    :style="vars"
    @pointermove="onRootMove"
    @pointerleave="onRootLeave"
    @pointerdown="onRootDown"
  >
    <div
      class="folder-stage"
      role="button"
      tabindex="0"
      :aria-expanded="isOpen"
      :aria-label="label ? `${label} folder` : 'Folder'"
      @click="toggle"
      @keydown="onStageKey"
    >
      <span
        ref="groundRef"
        class="folder-layer folder-ground"
        aria-hidden="true"
      ></span>
      <span
        v-if="book"
        ref="castRef"
        class="folder-layer folder-cast"
        aria-hidden="true"
      ></span>

      <div ref="backRef" class="folder-layer folder-back" aria-hidden="true">
        <div class="folder-back-fill" :style="{ clipPath: `path('${shape}')` }">
          <span v-if="book" class="folder-gutter"></span>
        </div>
        <svg
          class="folder-back-rim"
          :width="geometry.w"
          :height="total"
          :viewBox="`0 0 ${geometry.w} ${total}`"
        >
          <path class="folder-focus" :d="shape" />
        </svg>
        <span
          v-if="label"
          class="folder-tab-text"
          :style="{ left: `${geometry.tabX}px`, width: `${geometry.tabW}px` }"
        >
          {{ label }}
        </span>
      </div>

      <div
        v-for="(page, index) in pages"
        :key="index"
        :ref="(el) => setItemRef(el, index)"
        class="folder-layer folder-item"
        :data-folder-item="index"
        :role="isInteractive(index) ? 'button' : undefined"
        :tabindex="isInteractive(index) ? 0 : -1"
        :aria-label="page.title || page.alt || undefined"
        @click="onItemActivate($event, index)"
        @keydown="onItemKey($event, index)"
      >
        <slot name="item" :item="entries[index]!" :index="index">
          <div v-if="page.image" class="folder-photo">
            <img
              :src="page.image"
              :alt="page.alt ?? page.title ?? ''"
              :crossorigin="page.crossOrigin"
              draggable="false"
            />
          </div>
          <div v-else class="folder-doc">
            <span v-if="page.title" class="folder-doc-title">
              {{ page.title }}
            </span>
            <span v-else class="folder-doc-heading"></span>
            <span v-if="page.description" class="folder-doc-text">
              {{ page.description }}
            </span>
            <span class="folder-doc-line" style="width: 92%"></span>
            <span class="folder-doc-line" style="width: 84%"></span>
            <span class="folder-doc-line" style="width: 88%"></span>
            <span class="folder-doc-block"></span>
            <span class="folder-doc-line" style="width: 80%"></span>
            <span class="folder-doc-line" style="width: 62%"></span>
          </div>
        </slot>
      </div>

      <span
        v-if="book"
        ref="shadeRef"
        class="folder-layer folder-shade"
        aria-hidden="true"
      ></span>

      <div
        ref="frontRef"
        class="folder-layer folder-front"
        data-face="outer"
        aria-hidden="true"
      >
        <div class="folder-face folder-face-outer"></div>
        <div v-if="book" class="folder-face folder-face-inner">
          <span class="folder-inner-gutter"></span>
        </div>
      </div>

      <canvas
        v-if="glass"
        ref="glassRef"
        class="folder-glass"
        aria-hidden="true"
        :style="glassStyle"
      ></canvas>
    </div>

    <span
      v-if="label"
      ref="measureRef"
      class="folder-tab-text folder-measure"
      aria-hidden="true"
    >
      {{ label }}
    </span>
  </div>
</template>

<style scoped>
  .folder-root {
    --folder-ground: rgba(0, 0, 0, 0.42);
    --folder-ground-soft: rgba(0, 0, 0, 0.26);
    --folder-focus: #ffffff;
    position: relative;
    display: inline-block;
    width: var(--folder-w);
    height: calc(var(--folder-tab-h) + var(--folder-h));
    vertical-align: middle;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .folder-root[data-theme='light'] {
    --folder-ground: rgba(24, 22, 40, 0.16);
    --folder-ground-soft: rgba(24, 22, 40, 0.1);
    --folder-focus: #18181b;
  }

  .folder-stage {
    position: absolute;
    inset: 0;
    perspective: var(--folder-depth);
    perspective-origin: calc(var(--folder-w) / 2)
      calc(var(--folder-tab-h) + var(--folder-h) / 2);
    cursor: pointer;
    outline: none;
    isolation: isolate;
  }

  .folder-layer {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    will-change: transform;
  }

  .folder-ground {
    z-index: 1;
    width: var(--folder-w);
    pointer-events: none;
  }

  .folder-root[data-mode='book'] .folder-ground,
  .folder-cast {
    height: var(--folder-h);
    border-radius: var(--folder-front-radius);
    box-shadow:
      0 calc(1px * var(--folder-scale)) calc(2px * var(--folder-scale))
        var(--folder-ground),
      0 calc(10px * var(--folder-scale)) calc(28px * var(--folder-scale))
        var(--folder-ground-soft);
  }

  .folder-cast {
    z-index: 1;
    width: var(--folder-w);
    height: calc(var(--folder-h) - var(--folder-front-y) + var(--folder-tab-h));
    pointer-events: none;
  }

  .folder-root[data-mode='flap'] .folder-ground {
    height: calc(var(--folder-h) * 0.14);
    margin-top: calc(var(--folder-h) * -0.07);
    border-radius: 50%;
    background: var(--folder-ground);
    filter: blur(calc(var(--folder-h) * 0.05));
  }

  .folder-back {
    z-index: 4;
    width: var(--folder-w);
    height: calc(var(--folder-tab-h) + var(--folder-h));
  }

  .folder-back-fill {
    position: absolute;
    inset: 0;
  }

  .folder-gutter {
    position: absolute;
    top: var(--folder-tab-h);
    bottom: 0;
    left: 0;
    width: calc(12px * var(--folder-scale));
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0));
    opacity: var(--folder-gutter, 0);
  }

  .folder-back-rim {
    position: absolute;
    inset: 0;
    overflow: visible;
    pointer-events: none;
  }

  .folder-focus {
    fill: none;
    stroke: none;
  }

  .folder-stage:focus-visible .folder-focus {
    stroke: var(--folder-focus);
    stroke-width: 2;
  }

  .folder-tab-text {
    position: absolute;
    top: 0;
    display: flex;
    height: var(--folder-tab-h);
    box-sizing: border-box;
    align-items: center;
    justify-content: center;
    padding-top: calc(1px * var(--folder-scale));
    overflow: hidden;
    color: var(--folder-tab-ink);
    opacity: var(--folder-label, 1);
    font-size: calc(10.5px * var(--folder-scale));
    font-weight: 600;
    letter-spacing: -0.005em;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .folder-measure {
    left: 0;
    width: auto;
    padding: 0;
    visibility: hidden;
    pointer-events: none;
  }

  .folder-item {
    z-index: 10;
    width: var(--folder-doc-w);
    height: var(--folder-doc-h);
    overflow: hidden;
    border-radius: calc(7px * var(--folder-scale));
    background: var(--folder-paper);
    box-shadow:
      0 0 0 0.5px rgba(0, 0, 0, 0.06),
      0 calc(1px * var(--folder-scale)) calc(2px * var(--folder-scale))
        rgba(0, 0, 0, 0.12),
      0 calc((2px + var(--folder-lift, 0) * 16px) * var(--folder-scale))
        calc((5px + var(--folder-lift, 0) * 26px) * var(--folder-scale))
        rgba(0, 0, 0, calc(0.1 + var(--folder-lift, 0) * 0.14));
    outline: none;
  }

  .folder-root[data-open] .folder-item {
    cursor: pointer;
  }

  .folder-root[data-draggable] .folder-item {
    cursor: grab;
    touch-action: none;
  }

  .folder-root[data-dragging],
  .folder-root[data-dragging] * {
    cursor: grabbing !important;
  }

  .folder-item:focus-visible {
    outline: 2px solid var(--folder-focus);
    outline-offset: 3px;
  }

  .folder-shade {
    z-index: 39;
    width: var(--folder-w);
    height: var(--folder-front-h);
    border-radius: var(--folder-front-radius);
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.34),
      rgba(0, 0, 0, 0.16)
    );
    filter: blur(calc(6px * var(--folder-scale)));
    opacity: 0;
    pointer-events: none;
  }

  .folder-front {
    z-index: 40;
    width: var(--folder-w);
    height: var(--folder-front-h);
  }

  .folder-face {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: var(--folder-front-radius);
  }

  .folder-face::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      linear-gradient(
        rgba(255, 255, 255, var(--folder-glint, 0)),
        rgba(255, 255, 255, var(--folder-glint, 0))
      ),
      rgba(0, 0, 0, var(--folder-dim, 0));
    pointer-events: none;
  }

  .folder-face-inner,
  .folder-front[data-face='inner'] .folder-face-outer {
    visibility: hidden;
  }

  .folder-face-inner {
    left: -1px;
  }

  .folder-front[data-face='inner'] .folder-face-inner {
    visibility: visible;
  }

  .folder-inner-gutter {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: calc(12px * var(--folder-scale));
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0));
  }

  .folder-root[data-variant='solid'] .folder-back-fill,
  .folder-root[data-variant='solid'] .folder-face-inner {
    background: linear-gradient(
      180deg,
      var(--folder-inside-top),
      var(--folder-inside-bottom)
    );
  }

  .folder-root[data-variant='solid'] .folder-face-outer {
    background: linear-gradient(
      160deg,
      var(--folder-front-top) 0%,
      var(--folder-base) 48%,
      var(--folder-front-bottom) 100%
    );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.28),
      inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  .folder-root[data-variant='glass'] .folder-back-fill {
    background: linear-gradient(
      180deg,
      var(--folder-inside-top),
      var(--folder-inside-bottom)
    );
  }

  .folder-root[data-variant='glass'] .folder-face-outer,
  .folder-root[data-variant='glass'] .folder-face-inner {
    background:
      linear-gradient(
        160deg,
        rgba(255, 255, 255, 0.34) 0%,
        rgba(255, 255, 255, 0.08) 46%,
        rgba(255, 255, 255, 0.16) 100%
      ),
      rgba(var(--folder-rgb), 0.24);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.34),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    -webkit-backdrop-filter: blur(var(--folder-frost)) saturate(1.8);
    backdrop-filter: blur(var(--folder-frost)) saturate(1.8);
  }

  .folder-root[data-gl] .folder-face {
    visibility: hidden;
  }

  .folder-glass {
    position: absolute;
    z-index: 40;
    pointer-events: none;
  }

  .folder-root[data-variant='matte'] .folder-back-fill,
  .folder-root[data-variant='matte'] .folder-face-inner {
    background: var(--folder-inside-bottom);
  }

  .folder-root[data-variant='matte'] .folder-face-outer {
    background: var(--folder-base);
  }

  .folder-doc {
    display: flex;
    height: 100%;
    box-sizing: border-box;
    flex-direction: column;
    gap: calc(6px * var(--folder-scale));
    padding: calc(14px * var(--folder-scale)) calc(13px * var(--folder-scale));
  }

  .folder-doc-title {
    overflow: hidden;
    margin-bottom: calc(4px * var(--folder-scale));
    color: var(--folder-paper-text);
    font-size: calc(11px * var(--folder-scale));
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .folder-doc-text {
    margin-top: calc(-6px * var(--folder-scale));
    margin-bottom: calc(4px * var(--folder-scale));
    color: var(--folder-paper-ink-strong);
    font-size: calc(9px * var(--folder-scale));
    line-height: 1.3;
  }

  .folder-doc-heading {
    width: 56%;
    height: calc(7px * var(--folder-scale));
    flex: none;
    margin-bottom: calc(4px * var(--folder-scale));
    border-radius: 999px;
    background: var(--folder-paper-ink-strong);
  }

  .folder-doc-line {
    height: calc(4px * var(--folder-scale));
    flex: none;
    border-radius: 999px;
    background: var(--folder-paper-ink);
  }

  .folder-doc-block {
    height: calc(40px * var(--folder-scale));
    flex: none;
    margin: calc(3px * var(--folder-scale)) 0;
    border-radius: calc(5px * var(--folder-scale));
    background: var(--folder-paper-ink);
    opacity: 0.75;
  }

  .folder-photo {
    position: absolute;
    inset: calc(5px * var(--folder-scale));
    overflow: hidden;
    border-radius: calc(3px * var(--folder-scale));
  }

  .folder-photo img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    -webkit-user-drag: none;
  }
</style>
