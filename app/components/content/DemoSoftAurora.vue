<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import SoftAurora from '@registry/new-york/soft-aurora/SoftAurora.vue';
  import {
    isSoftAuroraPreset,
    softAuroraPreset,
  } from '@registry/new-york/soft-aurora/soft-aurora-presets.ts';
  import type {
    SoftAuroraLook,
    SoftAuroraPreset,
  } from '@registry/new-york/soft-aurora/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<
    SoftAuroraLook & {
      preset: SoftAuroraPreset;
      enableMouseInteraction: boolean;
      mouseInfluence: number;
      clickPulse: boolean;
      intro: boolean;
      lightMode: boolean;
    }
  >({
    preset: 'classic',
    ...softAuroraPreset('classic'),
    enableMouseInteraction: true,
    mouseInfluence: 0.25,
    clickPulse: true,
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

  function applyPreset(value: SoftAuroraPreset) {
    Object.assign(params, softAuroraPreset(value, params.lightMode));
    params.preset = value;
    paneRef.value?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Borealis: 'borealis',
          Dusk: 'dusk',
          Mono: 'mono',
          Ribbon: 'ribbon',
          Halo: 'halo',
          Calm: 'calm',
        },
      })
      .on('change', (ev) => {
        if (isSoftAuroraPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'spectrum', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'colorSpeed', { min: 0, max: 5, step: 0.1 });
    pane.addBinding(params, 'scale', { min: 0.1, max: 3, step: 0.1 });
    pane.addBinding(params, 'brightness', { min: 0.1, max: 3, step: 0.05 });
    pane.addBinding(params, 'noiseFrequency', {
      min: 0.5,
      max: 10,
      step: 0.5,
    });
    pane.addBinding(params, 'noiseAmplitude', { min: 0, max: 5, step: 0.1 });
    pane.addBinding(params, 'bandHeight', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'bandSpread', { min: 0.1, max: 3, step: 0.05 });
    pane.addBinding(params, 'tilt', { min: -45, max: 45, step: 1 });
    pane.addBinding(params, 'octaveDecay', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'layerOffset', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInfluence', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'enableMouseInteraction', { label: 'mouse' });
    pane.addBinding(params, 'clickPulse');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import SoftAurora from '~/components/ui/soft-aurora/SoftAurora.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <SoftAurora
      color1=&quot;#f7f7f7&quot;
      color2=&quot;#e100ff&quot;
      :speed=&quot;0.6&quot;
      :band-height=&quot;0.5&quot;
      :click-pulse=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <SoftAurora
        class="absolute inset-0 size-full"
        :color1="params.color1"
        :color2="params.color2"
        :spectrum="params.spectrum"
        :speed="params.speed"
        :color-speed="params.colorSpeed"
        :scale="params.scale"
        :brightness="params.brightness"
        :noise-frequency="params.noiseFrequency"
        :noise-amplitude="params.noiseAmplitude"
        :band-height="params.bandHeight"
        :band-spread="params.bandSpread"
        :tilt="params.tilt"
        :octave-decay="params.octaveDecay"
        :layer-offset="params.layerOffset"
        :enable-mouse-interaction="params.enableMouseInteraction"
        :mouse-influence="params.mouseInfluence"
        :click-pulse="params.clickPulse"
        :intro="params.intro"
        :light-mode="params.lightMode"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border border-foreground/20 bg-background/40 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-foreground sm:text-5xl/tight"
        >
          A gentle glow to light your way!
        </p>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move near the band, click to send a pulse
      </p>
      <ShaderPane title="Soft Aurora" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
