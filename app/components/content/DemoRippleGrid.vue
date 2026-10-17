<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import RippleGrid from '@registry/new-york/ripple-grid/RippleGrid.vue';
  import {
    isRippleGridPreset,
    rippleGridPreset,
  } from '@registry/new-york/ripple-grid/ripple-grid-presets.ts';
  import type {
    RippleGridDemoParams,
    RippleGridPreset,
  } from '@registry/new-york/ripple-grid/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<RippleGridDemoParams>({
    preset: 'pulse',
    color: '#ffffff',
    ...rippleGridPreset('pulse'),
    opacity: 1,
    mouseInteraction: true,
    clickRipple: true,
    intro: true,
    lightMode: false,
  });

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      paneRef.value?.refresh();
    },
    { immediate: true },
  );

  function applyPreset(value: RippleGridPreset) {
    Object.assign(params, rippleGridPreset(value));
    params.preset = value;
    paneRef.value?.refresh();
  }

  function onPresetChange(event: { value: unknown }) {
    if (isRippleGridPreset(event.value)) applyPreset(event.value);
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Pulse: 'pulse',
          Floor: 'floor',
          Dots: 'dots',
          Cross: 'cross',
          Calm: 'calm',
        },
      })
      .on('change', onPresetChange);
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'variant', {
      options: { Lines: 'lines', Dots: 'dots', Cross: 'cross' },
    });
    pane.addBinding(params, 'autoRipple', {
      options: { Center: 'center', Random: 'random', None: 'none' },
    });
    pane.addBinding(params, 'cellSize', { min: 16, max: 120, step: 1 });
    pane.addBinding(params, 'lineWidth', { min: 0.5, max: 4, step: 0.25 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'rippleStrength', {
      min: 0,
      max: 2.5,
      step: 0.05,
    });
    pane.addBinding(params, 'rippleSpeed', { min: 0.2, max: 3, step: 0.05 });
    pane.addBinding(params, 'rippleSize', { min: 0.4, max: 3, step: 0.05 });
    pane.addBinding(params, 'rippleInterval', {
      min: 0.5,
      max: 8,
      step: 0.1,
    });
    pane.addBinding(params, 'tilt', { min: 0, max: 75, step: 1 });
    pane.addBinding(params, 'rotation', { min: 0, max: 90, step: 1 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'clickRipple');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import RippleGrid from '~/components/ui/ripple-grid/RippleGrid.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <RippleGrid
      color=&quot;#ffffff&quot;
      variant=&quot;lines&quot;
      :cell-size=&quot;48&quot;
      :glow=&quot;0.6&quot;
      auto-ripple=&quot;center&quot;
      :ripple-interval=&quot;2.6&quot;
      :fade=&quot;0.5&quot;
      :click-ripple=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <RippleGrid
        class="absolute inset-0 size-full"
        :color="params.color"
        :variant="params.variant"
        :cell-size="params.cellSize"
        :line-width="params.lineWidth"
        :glow="params.glow"
        :ripple-strength="params.rippleStrength"
        :ripple-speed="params.rippleSpeed"
        :ripple-size="params.rippleSize"
        :auto-ripple="params.autoRipple"
        :ripple-interval="params.rippleInterval"
        :tilt="params.tilt"
        :rotation="params.rotation"
        :mouse-interaction="params.mouseInteraction"
        :click-ripple="params.clickRipple"
        :intro="params.intro"
        :fade="params.fade"
        :opacity="params.opacity"
        :light-mode="params.lightMode"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm"
        >
          Vue ✦ nxui
        </span>
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-foreground drop-shadow-lg sm:text-5xl/tight"
        >
          Every move sends ripples through the grid
        </p>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move the cursor to leave a wake, click to send a ripple
      </p>
      <ShaderPane title="Ripple Grid" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
