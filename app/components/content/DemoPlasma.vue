<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import Plasma from '@registry/new-york/plasma/Plasma.vue';
  import {
    isPlasmaPreset,
    plasmaPreset,
  } from '@registry/new-york/plasma/plasma-presets.ts';
  import type {
    PlasmaDemoParams,
    PlasmaPreset,
  } from '@registry/new-york/plasma/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<PlasmaDemoParams>({
    preset: 'silver',
    ...plasmaPreset('silver'),
    direction: 'forward',
    scale: 1,
    brightness: 1,
    grain: 0.04,
    quality: 0.75,
    fade: 0,
    opacity: 1,
    mouseInteractive: true,
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

  function applyPreset(value: PlasmaPreset) {
    Object.assign(params, plasmaPreset(value));
    params.preset = value;
    paneRef.value?.refresh();
  }

  function onPresetChange(event: { value: unknown }) {
    if (isPlasmaPreset(event.value)) applyPreset(event.value);
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Silver: 'silver',
          Copper: 'copper',
          Ocean: 'ocean',
          Jade: 'jade',
          Vortex: 'vortex',
        },
      })
      .on('change', onPresetChange);
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'direction', {
      options: {
        Forward: 'forward',
        Reverse: 'reverse',
        'Ping Pong': 'pingpong',
      },
    });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.5, max: 2, step: 0.05 });
    pane.addBinding(params, 'twist', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'wave', { min: 0, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'shine', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'grain', { min: 0, max: 0.15, step: 0.01 });
    pane.addBinding(params, 'quality', { min: 0.25, max: 1, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInteractive');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Plasma from '~/components/ui/plasma/Plasma.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Plasma
      color=&quot;#a6a3b8&quot;
      :speed=&quot;1&quot;
      direction=&quot;forward&quot;
      :twist=&quot;1&quot;
      :softness=&quot;0.5&quot;
      :shine=&quot;1&quot;
      :mouse-interactive=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <Plasma
        class="absolute inset-0 size-full"
        :color="params.color"
        :speed="params.speed"
        :direction="params.direction"
        :scale="params.scale"
        :twist="params.twist"
        :wave="params.wave"
        :softness="params.softness"
        :shine="params.shine"
        :brightness="params.brightness"
        :grain="params.grain"
        :quality="params.quality"
        :mouse-interactive="params.mouseInteractive"
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
          Minimal plasma waves that soothe the eyes
        </p>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move the cursor to turn the plasma in 3D
      </p>
      <ShaderPane title="Plasma" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
