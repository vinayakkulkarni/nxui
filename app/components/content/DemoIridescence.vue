<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import Iridescence from '@registry/new-york/iridescence/Iridescence.vue';
  import {
    iridescencePreset,
    isIridescencePreset,
  } from '@registry/new-york/iridescence/iridescence-presets.ts';
  import type {
    IridescenceLook,
    IridescencePreset,
  } from '@registry/new-york/iridescence/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<IridescenceLook & { preset: IridescencePreset }>({
    preset: 'classic',
    ...iridescencePreset('classic'),
  });

  watch(
    () => colorMode.value,
    (mode) => {
      if (params.preset !== 'classic') return;
      params.color = mode === 'light' ? '#ffffff' : '#8099cc';
      paneRef.value?.refresh();
    },
    { immediate: true },
  );

  function applyPreset(value: IridescencePreset) {
    Object.assign(params, iridescencePreset(value));
    params.preset = value;
    paneRef.value?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Pearl: 'pearl',
          Chrome: 'chrome',
          Graphite: 'graphite',
          Oil: 'oil',
        },
      })
      .on('change', (ev) => {
        if (isIridescencePreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'hueShift', { min: -180, max: 180, step: 1 });
    pane.addBinding(params, 'saturation', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'contrast', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'detail', { min: 1, max: 16, step: 1 });
    pane.addBinding(params, 'warp', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'rotation', { min: -180, max: 180, step: 1 });
    pane.addBinding(params, 'mouseReact');
    pane.addBinding(params, 'amplitude', { min: 0, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'stir', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'sheen', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'clickSwirl');
    pane.addBinding(params, 'grain', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Iridescence from '~/components/ui/iridescence/Iridescence.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Iridescence
      color=&quot;#8099cc&quot;
      :brightness=&quot;1.5&quot;
      :stir=&quot;0.5&quot;
      :sheen=&quot;0.3&quot;
      :click-swirl=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <Iridescence
        class="absolute inset-0 size-full"
        :color="params.color"
        :hue-shift="params.hueShift"
        :saturation="params.saturation"
        :brightness="params.brightness"
        :contrast="params.contrast"
        :speed="params.speed"
        :scale="params.scale"
        :detail="params.detail"
        :warp="params.warp"
        :rotation="params.rotation"
        :mouse-react="params.mouseReact"
        :amplitude="params.amplitude"
        :stir="params.stir"
        :sheen="params.sheen"
        :click-swirl="params.clickSwirl"
        :grain="params.grain"
        :fade="params.fade"
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
          Radiant iridescence with customizable colors
        </p>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-foreground/80"
      >
        drag the cursor to stir, click to swirl
      </p>
      <ShaderPane title="Iridescence" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
