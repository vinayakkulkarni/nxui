<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import Waves from '@registry/new-york/waves/Waves.vue';
  import {
    isWavesPreset,
    wavesPreset,
  } from '@registry/new-york/waves/waves-presets.ts';
  import type {
    WavesDemoParams,
    WavesPreset,
  } from '@registry/new-york/waves/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<WavesDemoParams>({
    preset: 'classic',
    lineColor: '#ffffff',
    accentColor: '#ffffff',
    ...wavesPreset('classic'),
    opacity: 1,
    mouseInteraction: true,
    clickRipple: true,
    intro: true,
    lightMode: false,
    paused: false,
  });

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      paneRef.value?.refresh();
    },
    { immediate: true },
  );

  function applyPreset(value: WavesPreset) {
    Object.assign(params, wavesPreset(value));
    params.preset = value;
    paneRef.value?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Silk: 'silk',
          Tide: 'tide',
          Rain: 'rain',
          Dune: 'dune',
        },
      })
      .on('change', (ev) => {
        if (isWavesPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'lineColor');
    pane.addBinding(params, 'accentColor');
    pane.addBinding(params, 'lineStyle', {
      options: { Solid: 'solid', Dashed: 'dashed' },
    });
    pane.addBinding(params, 'spacing', { min: 4, max: 28, step: 1 });
    pane.addBinding(params, 'lineWidth', { min: 0.5, max: 3, step: 0.25 });
    pane.addBinding(params, 'rotation', { min: 0, max: 180, step: 1 });
    pane.addBinding(params, 'amplitude', { min: 0, max: 80, step: 1 });
    pane.addBinding(params, 'scale', { min: 0.4, max: 3, step: 0.05 });
    pane.addBinding(params, 'twist', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 4, step: 0.05 });
    pane.addBinding(params, 'variation', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'mouseRadius', { min: 60, max: 400, step: 5 });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'bounce', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'returnDuration', { min: 0.3, max: 4, step: 0.1 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'clickRipple');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
    pane.addBinding(params, 'paused');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Waves from '~/components/ui/waves/Waves.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-black&quot;>
    <Waves
      line-color=&quot;#ffffff&quot;
      accent-color=&quot;#ffffff&quot;
      :spacing=&quot;10&quot;
      :amplitude=&quot;32&quot;
      :mouse-radius=&quot;175&quot;
      :click-ripple=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <Waves
        class="absolute inset-0 size-full"
        :line-color="params.lineColor"
        :accent-color="params.accentColor"
        :line-style="params.lineStyle"
        :spacing="params.spacing"
        :line-width="params.lineWidth"
        :rotation="params.rotation"
        :amplitude="params.amplitude"
        :scale="params.scale"
        :twist="params.twist"
        :speed="params.speed"
        :variation="params.variation"
        :mouse-interaction="params.mouseInteraction"
        :mouse-radius="params.mouseRadius"
        :mouse-strength="params.mouseStrength"
        :bounce="params.bounce"
        :return-duration="params.returnDuration"
        :click-ripple="params.clickRipple"
        :intro="params.intro"
        :fade="params.fade"
        :opacity="params.opacity"
        :light-mode="params.lightMode"
        :paused="params.paused"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border border-foreground/20 bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm"
        >
          Vue ✦ nxui
        </span>
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-foreground sm:text-5xl/tight"
        >
          Make waves with every move.
        </p>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move the cursor to drag the lines, click to send a ripple
      </p>
      <ShaderPane title="Waves" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
