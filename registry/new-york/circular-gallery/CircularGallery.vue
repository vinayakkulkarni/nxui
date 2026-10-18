<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    defaultDocument,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createGalleryEngine } from './circular-gallery-engine';
  import { DEFAULT_FONT, resolveFont } from './circular-gallery-font';
  import { DEFAULT_GALLERY_ITEMS } from './circular-gallery-items';
  import type {
    CircularGalleryProps,
    GalleryEngine,
    GalleryItem,
    GallerySettings,
  } from './types';

  const props = withDefaults(defineProps<CircularGalleryProps>(), {
    items: undefined,
    bend: 3,
    textColor: '#ffffff',
    borderRadius: 0.05,
    font: 'bold 30px Figtree',
    fontUrl: undefined,
    scrollSpeed: 2,
    scrollEase: 0.05,
    itemSize: 1,
    itemAspect: 0.78,
    gap: 0.26,
    wave: 1,
    fadeEdges: 0.12,
    shadow: 0.25,
    grayscale: false,
    showTitles: true,
    snap: true,
    autoScroll: 0,
    openOnClick: true,
    intro: true,
    dpr: undefined,
    class: '',
  });

  const emit = defineEmits<{
    'item-click': [item: GalleryItem, index: number];
    'active-change': [index: number];
  }>();

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const container = useTemplateRef<HTMLDivElement>('container');
  const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
  const labels = useTemplateRef<HTMLDivElement>('labels');
  const caption = useTemplateRef<HTMLDivElement>('caption');
  const buttons = useTemplateRef<HTMLButtonElement[]>('buttons');

  const active = ref(0);
  const open = ref(false);
  const reducedMotion = usePreferredReducedMotion();

  const list = computed(() =>
    props.items && props.items.length ? props.items : DEFAULT_GALLERY_ITEMS,
  );

  const settings = computed<GallerySettings>(() => ({
    items: list.value,
    bend: props.bend,
    textColor: props.textColor,
    borderRadius: clamp(props.borderRadius, 0, 0.5),
    scrollSpeed: Math.max(0, props.scrollSpeed),
    scrollEase: clamp(props.scrollEase, 0.001, 1),
    itemSize: clamp(props.itemSize, 0.2, 2),
    itemAspect: clamp(props.itemAspect, 0.2, 5),
    gap: Math.max(0, props.gap),
    wave: Math.max(0, props.wave),
    fadeEdges: clamp(props.fadeEdges, 0, 0.5),
    shadow: clamp(props.shadow, 0, 1),
    grayscale: props.grayscale,
    showTitles: props.showTitles,
    snap: props.snap,
    autoScroll: props.autoScroll,
    openOnClick: props.openOnClick,
    intro: props.intro,
    dpr: props.dpr,
  }));

  const count = computed(() => list.value.length);
  const current = computed(
    () => list.value[active.value % count.value] ?? list.value[0],
  );

  let engine: GalleryEngine | null = null;
  let resolvedFont = props.font || DEFAULT_FONT;
  let fontToken = 0;

  function loadFont() {
    const token = ++fontToken;
    resolvedFont = props.font;
    resolveFont(props.font, props.fontUrl).then((font) => {
      if (token !== fontToken) return;
      resolvedFont = font;
      engine?.wake();
    });
  }

  function labelOf(item: GalleryItem, index: number): string {
    return item.text || item.alt || `Image ${index + 1}`;
  }

  function ariaLabelOf(item: GalleryItem, index: number): string {
    return `${item.text || item.alt || 'Image'}, ${index + 1} of ${count.value}`;
  }

  function focusButton(index: number) {
    const target = buttons.value?.find(
      (button) => button.dataset.index === String(index),
    );
    target?.focus({ preventScroll: true });
  }

  function onButtonFocus(index: number) {
    engine?.focus(index);
  }

  function onButtonClick(index: number) {
    engine?.open(index);
  }

  function onClose() {
    engine?.close();
  }

  onMounted(() => {
    if (!container.value || !canvas.value || !labels.value || !caption.value) {
      return;
    }
    loadFont();
    engine = createGalleryEngine({
      container: container.value,
      canvas: canvas.value,
      labelLayer: labels.value,
      caption: caption.value,
      reduce: reducedMotion.value === 'reduce',
      getSettings: () => settings.value,
      getFont: () => resolvedFont,
      focusButton,
      onActive: (index) => {
        active.value = index;
        emit('active-change', index);
      },
      onOpen: (value) => {
        open.value = value;
      },
      onItemClick: (item, index) => emit('item-click', item, index),
    });
  });

  watch([() => props.font, () => props.fontUrl], loadFont);
  watch(settings, () => engine?.wake());
  watch(
    () => props.dpr,
    () => engine?.resize(),
  );

  useResizeObserver(container, () => engine?.resize());
  useIntersectionObserver(container, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });
  useEventListener(container, 'pointerdown', (event: PointerEvent) =>
    engine?.onPointerDown(event),
  );
  useEventListener(container, 'pointermove', (event: PointerEvent) =>
    engine?.onPointerMove(event),
  );
  useEventListener(container, 'pointerup', (event: PointerEvent) =>
    engine?.onPointerUp(event),
  );
  useEventListener(container, 'pointercancel', (event: PointerEvent) =>
    engine?.onPointerCancel(event),
  );
  useEventListener(container, 'pointerleave', () => engine?.onPointerLeave());
  useEventListener(
    container,
    'wheel',
    (event: WheelEvent) => engine?.onWheel(event),
    { passive: false },
  );
  useEventListener(container, 'keydown', (event: KeyboardEvent) =>
    engine?.onKeyDown(event),
  );
  useEventListener(container, 'focusin', (event: FocusEvent) =>
    engine?.onFocusIn(event),
  );
  useEventListener(container, 'focusout', (event: FocusEvent) =>
    engine?.onFocusOut(event),
  );
  useEventListener(defaultDocument, 'visibilitychange', () =>
    engine?.onVisibility(),
  );
  useEventListener(
    defaultDocument,
    'keydown',
    (event: KeyboardEvent) => engine?.onAnyKey(event),
    true,
  );
  useEventListener(
    defaultDocument,
    'pointerdown',
    () => engine?.onAnyPointer(),
    true,
  );

  onBeforeUnmount(() => {
    fontToken++;
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div
    ref="container"
    :class="
      cn(
        'relative size-full cursor-grab touch-pan-y overflow-hidden select-none data-dragging:cursor-grabbing data-pointer:cursor-pointer',
        props.class,
      )
    "
    :style="{ color: textColor }"
    role="region"
    aria-roledescription="carousel"
    aria-label="Image gallery"
  >
    <canvas
      ref="canvas"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
    <div
      ref="labels"
      class="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
    <div
      ref="caption"
      class="pointer-events-none absolute top-0 left-1/2 w-[min(90%,36rem)] text-center opacity-0"
      :aria-hidden="!open"
    >
      <p v-if="current?.description" class="m-0 leading-normal opacity-65">
        {{ current.description }}
      </p>
    </div>
    <button
      type="button"
      class="pointer-events-none absolute top-3 right-3 grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-inherit opacity-0 transition-opacity duration-200 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current data-visible:pointer-events-auto data-visible:opacity-80"
      data-gallery-close=""
      :data-visible="open ? '' : undefined"
      :tabindex="open ? 0 : -1"
      aria-label="Close"
      @click="onClose"
    >
      <Icon name="lucide:x" class="size-4.5" aria-hidden="true" />
    </button>
    <ul class="sr-only" data-gallery-list="">
      <li v-for="(item, index) in list" :key="`${item.image}-${index}`">
        <button
          ref="buttons"
          type="button"
          :data-index="index"
          :tabindex="index === active ? 0 : -1"
          :aria-label="ariaLabelOf(item, index)"
          :aria-current="index === active ? 'true' : undefined"
          @focus="onButtonFocus(index)"
          @click="onButtonClick(index)"
        >
          {{ labelOf(item, index) }}
        </button>
      </li>
    </ul>
    <div class="sr-only" aria-live="polite">
      {{
        open && current
          ? `${current.text || current.alt || 'Image'} opened`
          : ''
      }}
    </div>
  </div>
</template>
