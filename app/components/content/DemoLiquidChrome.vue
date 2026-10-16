<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import LiquidChrome from '@registry/new-york/liquid-chrome/LiquidChrome.vue';
  import {
    isLiquidChromePreset,
    liquidChromePreset,
  } from '@registry/new-york/liquid-chrome/liquid-chrome-presets';
  import type {
    LiquidChromeLook,
    LiquidChromePreset,
  } from '@registry/new-york/liquid-chrome/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<
    LiquidChromeLook & {
      preset: LiquidChromePreset;
      interactive: boolean;
      rippleStrength: number;
      rippleSize: number;
      tilt: number;
      lightMode: boolean;
    }
  >({
    preset: 'satin',
    ...liquidChromePreset('satin'),
    interactive: true,
    rippleStrength: 1,
    rippleSize: 1,
    tilt: 1,
    lightMode: false,
  });

  function applyPreset(value: LiquidChromePreset) {
    Object.assign(params, liquidChromePreset(value));
    params.preset = value;
    paneRef.value?.refresh();
  }

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
      paneRef.value?.refresh();
    },
    { immediate: true },
  );

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Satin: 'satin',
          Polished: 'polished',
          Velvet: 'velvet',
          Mercury: 'mercury',
          Molten: 'molten',
          Gold: 'gold',
        },
      })
      .on('change', (ev) => {
        if (isLiquidChromePreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'speed', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'amplitude', { min: 0, max: 0.8, step: 0.01 });
    pane.addBinding(params, 'frequencyX', { min: 0.5, max: 8, step: 0.1 });
    pane.addBinding(params, 'frequencyY', { min: 0.5, max: 8, step: 0.1 });
    pane.addBinding(params, 'detail', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'thickness', { min: 0.3, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'depth', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'roughness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'exposure', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'rippleStrength', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'rippleSize', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'tilt', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import LiquidChrome from '~/components/ui/liquid-chrome/LiquidChrome.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <LiquidChrome
      color=&quot;#ffffff&quot;
      :speed=&quot;0.2&quot;
      :amplitude=&quot;0.3&quot;
      :frequency-x=&quot;3&quot;
      :frequency-y=&quot;3&quot;
      :roughness=&quot;0.3&quot;
      :ripple-strength=&quot;1&quot;
      :tilt=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <LiquidChrome
        class="absolute inset-0 size-full"
        :color="params.color"
        :speed="params.speed"
        :amplitude="params.amplitude"
        :frequency-x="params.frequencyX"
        :frequency-y="params.frequencyY"
        :detail="params.detail"
        :thickness="params.thickness"
        :depth="params.depth"
        :roughness="params.roughness"
        :exposure="params.exposure"
        :interactive="params.interactive"
        :ripple-strength="params.rippleStrength"
        :ripple-size="params.rippleSize"
        :tilt="params.tilt"
        :light-mode="params.lightMode"
      />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-foreground sm:text-5xl/tight"
        >
          Swirl through a pool of liquid chrome.
        </p>
        <p class="max-w-md text-sm text-muted-foreground">
          Move the cursor to leave a wake and turn the light. Click to send a
          ripple.
        </p>
      </div>
      <ShaderPane title="Liquid Chrome" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
