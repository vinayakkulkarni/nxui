<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import Silk from '@registry/new-york/silk/Silk.vue';
  import {
    isSilkPreset,
    silkPreset,
  } from '@registry/new-york/silk/silk-presets.ts';
  import type {
    SilkDemoParams,
    SilkPreset,
  } from '@registry/new-york/silk/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<SilkDemoParams>({
    preset: 'satin',
    ...silkPreset('satin'),
    mouseInteraction: true,
    interactionStrength: 1,
    clickRipple: true,
    intro: true,
    fade: 0,
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

  function applyPreset(value: SilkPreset) {
    Object.assign(params, silkPreset(value));
    params.preset = value;
    paneRef.value?.refresh();
  }

  function onPresetChange(event: { value: unknown }) {
    if (isSilkPreset(event.value)) applyPreset(event.value);
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Satin: 'satin',
          Classic: 'classic',
          Champagne: 'champagne',
          Midnight: 'midnight',
          Emerald: 'emerald',
          Graphite: 'graphite',
          Velvet: 'velvet',
        },
      })
      .on('change', onPresetChange);
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'sheenColor');
    pane.addBinding(params, 'sheen', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'depth', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'noiseIntensity', {
      label: 'grain',
      min: 0,
      max: 5,
      step: 0.1,
    });
    pane.addBinding(params, 'speed', { min: 0, max: 20, step: 0.1 });
    pane.addBinding(params, 'scale', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'rotation', { min: 0, max: 6.28, step: 0.01 });
    pane.addBinding(params, 'ripple', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'wave', { min: 0, max: 4, step: 0.05 });
    pane.addBinding(params, 'variation', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'interactionStrength', {
      min: 0,
      max: 2,
      step: 0.05,
    });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
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
  import Silk from '~/components/ui/silk/Silk.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Silk
      color=&quot;#5227FF&quot;
      :speed=&quot;5&quot;
      :scale=&quot;1&quot;
      :sheen=&quot;0.5&quot;
      :depth=&quot;0.5&quot;
      :glow=&quot;0.3&quot;
      :noise-intensity=&quot;1.5&quot;
      :click-ripple=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <Silk
        class="absolute inset-0 size-full"
        :color="params.color"
        :sheen-color="params.sheenColor"
        :speed="params.speed"
        :scale="params.scale"
        :rotation="params.rotation"
        :noise-intensity="params.noiseIntensity"
        :sheen="params.sheen"
        :depth="params.depth"
        :glow="params.glow"
        :ripple="params.ripple"
        :wave="params.wave"
        :variation="params.variation"
        :mouse-interaction="params.mouseInteraction"
        :interaction-strength="params.interactionStrength"
        :click-ripple="params.clickRipple"
        :intro="params.intro"
        :fade="params.fade"
        :light-mode="params.lightMode"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border border-white/25 bg-black/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
        >
          Vue ✦ nxui
        </span>
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-white drop-shadow-lg sm:text-5xl/tight"
        >
          Silk touch is a good enhancement, Steve!
        </p>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-white/80"
      >
        move the cursor to turn the light, click to ripple the fabric
      </p>
      <ShaderPane title="Silk" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
