<script setup lang="ts">
  // Vue wrapper around the carousel engine. All the WebGL/animation logic
  // lives in ./create-carousel — this component only owns the DOM overlay:
  // the heading, the counter, the "View" cursor label and the Close button.
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
  import { useMediaQuery } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createCarousel } from './create-carousel';
  import {
    DEFAULT_ITEMS,
    DEFAULT_CONFIG,
    DEFAULT_LENS,
    DEFAULT_FOCUS,
    DEFAULT_ENTRY,
  } from './config';
  import type {
    LiquidGlassCarouselHandle,
    LiquidGlassCarouselProps,
  } from './types';

  const props = withDefaults(defineProps<LiquidGlassCarouselProps>(), {
    items: () => DEFAULT_ITEMS,
    config: () => ({}),
    lens: () => ({}),
    focus: () => ({}),
    entry: () => ({}),
    minViewportWidth: 1025,
    class: '',
  });

  const emit = defineEmits<{
    change: [index: number];
    'focus-change': [open: boolean];
    'entry-done': [done: boolean];
  }>();

  const mountRef = ref<HTMLDivElement | null>(null);
  const cursorRef = ref<HTMLDivElement | null>(null);

  const active = ref(0);
  const focused = ref(false);
  const entryDone = ref(false);

  // The carousel is a desktop experience (wheel-driven, heavy shader work).
  // At or below minViewportWidth we show a notice instead of booting WebGL.
  const tooSmall = useMediaQuery(
    computed(() => `(max-width: ${props.minViewportWidth - 1}px)`),
  );

  const entryEnabled = computed(
    () => (props.entry.enabled ?? DEFAULT_ENTRY.enabled) === true,
  );
  const overlayVisible = computed(() => !entryEnabled.value || entryDone.value);
  const activeItem = computed(() => props.items[active.value]);
  const counter = computed(
    () =>
      `${String(active.value + 1).padStart(2, '0')}/${String(props.items.length).padStart(2, '0')}`,
  );

  let engine: LiquidGlassCarouselHandle | null = null;

  function boot() {
    if (engine || !mountRef.value || tooSmall.value) return;
    active.value = 0;
    focused.value = false;
    entryDone.value = false;
    engine = createCarousel(
      mountRef.value,
      {
        items: props.items,
        config: { ...DEFAULT_CONFIG, ...props.config },
        lens: { ...DEFAULT_LENS, ...props.lens },
        focus: { ...DEFAULT_FOCUS, ...props.focus },
        entry: { ...DEFAULT_ENTRY, ...props.entry },
      },
      {
        cursorElement: cursorRef.value,
        onActiveChange: (i) => {
          active.value = i;
          emit('change', i);
        },
        onFocusChange: (open) => {
          focused.value = open;
          emit('focus-change', open);
        },
        onEntryDone: (done) => {
          entryDone.value = done;
          emit('entry-done', done);
        },
      },
    );
  }

  function teardown() {
    engine?.destroy();
    engine = null;
  }

  /** Close an open focus session. */
  function closeFocus() {
    engine?.closeFocus();
  }
  /** Replay the entry animation. */
  function replayEntry() {
    engine?.replayEntry();
  }
  defineExpose({ closeFocus, replayEntry });

  onMounted(boot);
  onBeforeUnmount(teardown);

  watch(tooSmall, (small) => {
    if (small) teardown();
    else boot();
  });
  watch(
    [
      () => props.items,
      () => props.config,
      () => props.lens,
      () => props.focus,
      () => props.entry,
    ],
    () => {
      teardown();
      boot();
    },
    { deep: true },
  );
</script>

<template>
  <div :class="cn('relative size-full overflow-hidden bg-white', props.class)">
    <template v-if="tooSmall">
      <div class="flex size-full items-center justify-center bg-black">
        <p class="px-8 text-center text-sm text-white/70">
          This experience is designed for larger screens.
          <br />
          Please visit on a display wider than
          {{ props.minViewportWidth - 1 }}px.
        </p>
      </div>
    </template>

    <template v-else>
      <div ref="mountRef" class="absolute inset-0 size-full" />

      <div
        v-if="activeItem"
        class="pointer-events-none absolute top-[15%] left-1/2 -translate-x-1/2 px-4 text-white mix-blend-exclusion transition-opacity duration-1000"
        :class="overlayVisible ? 'opacity-100' : 'opacity-0'"
        :style="{ transform: `translate(-50%, ${focused ? '-5vh' : '0px'})` }"
      >
        <div class="flex flex-col items-center justify-center">
          <p class="text-center text-base">{{ activeItem.brand }}</p>
          <p class="text-center">{{ activeItem.desc }}</p>
        </div>
      </div>

      <div
        class="pointer-events-none absolute bottom-[15%] left-1/2 -translate-x-1/2 px-4 text-black transition-opacity duration-1000"
        :class="overlayVisible && !focused ? 'opacity-100' : 'opacity-0'"
      >
        <p class="text-center text-base">{{ counter }}</p>
      </div>

      <div
        ref="cursorRef"
        class="pointer-events-none fixed top-0 left-0 z-50 origin-top-left text-sm whitespace-nowrap text-white mix-blend-exclusion"
        style="will-change: transform"
      >
        View
      </div>

      <button
        type="button"
        aria-label="Close"
        class="absolute top-[2%] right-[4%] z-50 cursor-pointer text-sm whitespace-nowrap text-white mix-blend-exclusion transition-opacity duration-300"
        :class="focused ? 'opacity-100' : 'pointer-events-none opacity-0'"
        @click="closeFocus"
      >
        Close
      </button>
    </template>
  </div>
</template>
