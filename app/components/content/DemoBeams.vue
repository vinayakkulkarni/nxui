<script setup lang="ts">
  import { reactive, ref, watch } from 'vue';
  import Beams from '@registry/new-york/beams/Beams.vue';
  import {
    beamsPreset,
    isBeamsPreset,
  } from '@registry/new-york/beams/beams-gl.ts';
  import type { BeamsPresetName } from '@registry/new-york/beams/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const replayKey = ref(0);

  function startPreset(): BeamsPresetName {
    return 'studio';
  }

  const params = reactive({
    preset: startPreset(),
    ...beamsPreset('studio'),
    speed: 1,
    brightness: 1.6,
    grain: 0.35,
    variation: 0,
    mouseInteraction: true,
    mouseStrength: 1,
    fade: 0,
    opacity: 1,
    intro: true,
    lightMode: false,
  });

  watch(
    () => colorMode.value,
    (mode) => {
      params.lightMode = mode === 'light';
    },
    { immediate: true },
  );

  let paneRef: Pane | null = null;

  function applyPreset(value: BeamsPresetName) {
    Object.assign(params, beamsPreset(value));
    params.preset = value;
    paneRef?.refresh();
  }

  function replay() {
    replayKey.value++;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Studio: 'studio',
          Ember: 'ember',
          Glacier: 'glacier',
          Chrome: 'chrome',
          Dawn: 'dawn',
        },
      })
      .on('change', (event) => {
        if (isBeamsPreset(event.value)) applyPreset(event.value);
      });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'beamWidth', { min: 40, max: 320, step: 2 });
    pane.addBinding(params, 'rotation', { min: -90, max: 90, step: 1 });
    pane.addBinding(params, 'waveLength', { min: 80, max: 600, step: 1 });
    pane.addBinding(params, 'depth', { min: 0.2, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'sharpness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'twist', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'fillLight', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.4, max: 3, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'grain', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'variation', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'intro').on('change', replay);
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Beams from '~/components/ui/beams/Beams.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-black&quot;>
    <Beams
      color=&quot;#ffffff&quot;
      :beam-width=&quot;140&quot;
      :rotation=&quot;30&quot;
      :wave-length=&quot;233&quot;
      :sharpness=&quot;0.6&quot;
      :brightness=&quot;1.6&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <Beams
        :key="replayKey"
        class="absolute inset-0 size-full"
        :color="params.color"
        :beam-width="params.beamWidth"
        :rotation="params.rotation"
        :speed="params.speed"
        :wave-length="params.waveLength"
        :depth="params.depth"
        :sharpness="params.sharpness"
        :twist="params.twist"
        :fill-light="params.fillLight"
        :glow="params.glow"
        :brightness="params.brightness"
        :variation="params.variation"
        :grain="params.grain"
        :mouse-interaction="params.mouseInteraction"
        :mouse-strength="params.mouseStrength"
        :intro="params.intro"
        :fade="params.fade"
        :opacity="params.opacity"
        :light-mode="params.lightMode"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center select-none"
      >
        <span
          class="inline-flex h-7 items-center rounded-full border border-foreground/15 bg-background/40 px-3 text-xs font-medium text-foreground/80 backdrop-blur-sm"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl/tight"
        >
          Radiant beams for creative user interfaces
        </p>
        <p class="max-w-md text-sm/relaxed text-foreground/75 sm:text-base">
          nxui brings motion and character to your interface, one copy-paste
          component at a time.
        </p>
        <div class="mt-2 flex flex-wrap items-center justify-center gap-2.5">
          <span
            class="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background"
          >
            Start building
            <Icon name="lucide:arrow-right" class="size-3.5" />
          </span>
          <span
            class="inline-flex h-9 items-center rounded-full border border-foreground/20 bg-background/30 px-4 text-sm font-medium text-foreground backdrop-blur-sm"
          >
            Browse components
          </span>
        </div>
      </div>

      <ShaderPane title="Beams" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
