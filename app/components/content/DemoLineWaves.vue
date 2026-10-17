<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import LineWaves from '@registry/new-york/line-waves/LineWaves.vue';
  import {
    isLineWavesPreset,
    lineWavesPreset,
  } from '@registry/new-york/line-waves/line-waves-presets.ts';
  import type {
    LineWavesDemoParams,
    LineWavesPreset,
  } from '@registry/new-york/line-waves/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<LineWavesDemoParams>({
    preset: 'silk',
    ...lineWavesPreset('silk'),
    edgeFade: 0,
    enableMouseInteraction: true,
    mouseInfluence: 2,
    clickRipple: true,
    intro: true,
    lightMode: false,
    opacity: 1,
  });

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      paneRef.value?.refresh();
    },
    { immediate: true },
  );

  function applyPreset(value: LineWavesPreset) {
    Object.assign(params, lineWavesPreset(value));
    params.preset = value;
    paneRef.value?.refresh();
  }

  function onPresetChange(event: { value: unknown }) {
    if (isLineWavesPreset(event.value)) applyPreset(event.value);
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Silk: 'silk',
          Gold: 'gold',
          Arctic: 'arctic',
          Aurora: 'aurora',
          Engraving: 'engraving',
          Ribbon: 'ribbon',
          Storm: 'storm',
          Calm: 'calm',
        },
      })
      .on('change', onPresetChange);
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'colorCycleSpeed', { min: 0, max: 5, step: 0.1 });
    pane.addBinding(params, 'speed', { min: 0, max: 1.5, step: 0.01 });
    pane.addBinding(params, 'lineCount', { min: 12, max: 160, step: 1 });
    pane.addBinding(params, 'lineWidth', { min: 0.5, max: 4, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 2, step: 0.05 });
    pane.addBinding(params, 'highlight', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'highlightWidth', {
      min: 0.4,
      max: 3,
      step: 0.05,
    });
    pane.addBinding(params, 'warpIntensity', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'warpScale', { min: 0.4, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'rotation', { min: -180, max: 180, step: 1 });
    pane.addBinding(params, 'edgeFade', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'mouseInfluence', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'enableMouseInteraction', { label: 'mouse' });
    pane.addBinding(params, 'clickRipple');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import LineWaves from '~/components/ui/line-waves/LineWaves.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <LineWaves
      color1=&quot;#ffffff&quot;
      color2=&quot;#ffffff&quot;
      color3=&quot;#ffffff&quot;
      :speed=&quot;0.3&quot;
      :line-count=&quot;72&quot;
      :line-width=&quot;1.3&quot;
      :glow=&quot;0.6&quot;
      :rotation=&quot;-33&quot;
      :mouse-influence=&quot;2&quot;
      :click-ripple=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <LineWaves
        class="absolute inset-0 size-full"
        :color1="params.color1"
        :color2="params.color2"
        :color3="params.color3"
        :color-cycle-speed="params.colorCycleSpeed"
        :speed="params.speed"
        :line-count="params.lineCount"
        :line-width="params.lineWidth"
        :glow="params.glow"
        :brightness="params.brightness"
        :highlight="params.highlight"
        :highlight-width="params.highlightWidth"
        :warp-intensity="params.warpIntensity"
        :warp-scale="params.warpScale"
        :rotation="params.rotation"
        :edge-fade="params.edgeFade"
        :enable-mouse-interaction="params.enableMouseInteraction"
        :mouse-influence="params.mouseInfluence"
        :click-ripple="params.clickRipple"
        :intro="params.intro"
        :light-mode="params.lightMode"
        :opacity="params.opacity"
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
          Lines that flow like silk.
        </p>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move the cursor to part the lines, click to send a ripple
      </p>
      <ShaderPane title="Line Waves" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
