<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    reactive,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useElementVisibility,
    useEventListener,
    useRafFn,
    useTimeoutFn,
  } from '@vueuse/core';
  import Magnify from '@registry/new-york/magnify/Magnify.vue';
  import type { MagnifyTheme } from '@registry/new-york/magnify/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed<MagnifyTheme>(() =>
    colorMode.value === 'dark' ? 'dark' : 'light',
  );

  const params = reactive({
    glyph: 'A',
    micro: 'a',
    zoom: 2.6,
    zoomMax: 4.2,
    lensRadius: 50,
  });

  const announce = ref('');

  function onZoomChange(next: boolean): void {
    if (stopped.value) announce.value = next ? 'Zoomed in' : 'Zoomed out';
  }

  function onPaneCreated(pane: Pane): void {
    pane.addBinding(params, 'glyph');
    pane.addBinding(params, 'micro');
    pane.addBinding(params, 'zoom', { min: 1.5, max: 6, step: 0.1 });
    pane.addBinding(params, 'zoomMax', { min: 2, max: 8, step: 0.1 });
    pane.addBinding(params, 'lensRadius', { min: 30, max: 80, step: 1 });
  }

  // Idle autoplay: the lens wanders over the letter and zooms now and then, until the first real interaction.
  const stage = useTemplateRef('stage');
  const magnify = useTemplateRef('magnify');
  const visible = useElementVisibility(stage);
  const stopped = ref(false);
  let clock = 0;
  let last = 0;

  const { pause, resume } = useRafFn(
    ({ timestamp }) => {
      const dt = last ? Math.min(0.05, (timestamp - last) / 1000) : 0;
      last = timestamp;
      clock += dt;
      const lens = magnify.value;
      if (!lens) return;
      lens.moveTo(
        250 + 120 * Math.sin(clock * 0.55),
        350 + 120 * Math.sin(clock * 0.82 + 1.1),
      );
      lens.setZoomed(clock % 6 > 4.2);
    },
    { immediate: false },
  );

  const { start: begin, stop: cancelBegin } = useTimeoutFn(
    () => {
      if (stopped.value || !visible.value) return;
      last = 0;
      resume();
    },
    2400,
    { immediate: false },
  );

  watch(
    visible,
    (isVisible) => {
      if (stopped.value) return;
      if (isVisible) begin();
      else {
        cancelBegin();
        pause();
      }
    },
    { immediate: true },
  );

  function stopAutoplay(): void {
    if (stopped.value) return;
    stopped.value = true;
    cancelBegin();
    pause();
  }

  useEventListener(
    stage,
    ['pointerdown', 'pointermove', 'keydown', 'focusin', 'wheel'],
    stopAutoplay,
    { passive: true },
  );
  onBeforeUnmount(() => {
    cancelBegin();
    pause();
  });

  const code = `<script setup lang="ts">
  import { computed } from 'vue';
  import Magnify from '~/components/ui/magnify/Magnify.vue';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));

  function onZoomChange(zoomed: boolean) {
    console.log(zoomed);
  }
\x3C/script>

<template>
  <Magnify
    glyph="A"
    micro="a"
    :zoom="2.6"
    :zoom-max="4.2"
    :lens-radius="50"
    :theme="theme"
    @zoom-change="onZoomChange"
  />
</template>`;
</script>

<template>
  <ComponentDemo :code="code">
    <div
      ref="stage"
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
    >
      <Magnify
        ref="magnify"
        :glyph="params.glyph"
        :micro="params.micro"
        :zoom="params.zoom"
        :zoom-max="params.zoomMax"
        :lens-radius="params.lensRadius"
        :theme="theme"
        @zoom-change="onZoomChange"
      />
      <p class="sr-only" aria-live="polite">
        {{ announce }}
      </p>
      <ShaderPane title="Magnify" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
