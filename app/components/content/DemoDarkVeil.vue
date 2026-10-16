<script setup lang="ts">
  import { reactive, shallowRef, watch } from 'vue';
  import DarkVeil from '@registry/new-york/dark-veil/DarkVeil.vue';
  import {
    darkVeilPreset,
    isDarkVeilPreset,
  } from '@registry/new-york/dark-veil/dark-veil-presets';
  import type {
    DarkVeilLook,
    DarkVeilPreset,
  } from '@registry/new-york/dark-veil/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);

  const params = reactive<
    DarkVeilLook & {
      preset: DarkVeilPreset;
      brightness: number;
      grain: number;
      quality: number;
      fade: number;
      opacity: number;
      mouseInteraction: boolean;
      mouseStrength: number;
      intro: boolean;
      lightMode: boolean;
    }
  >({
    preset: 'veil',
    ...darkVeilPreset('veil'),
    brightness: 1,
    grain: 0.03,
    quality: 0.5,
    fade: 0,
    opacity: 1,
    mouseInteraction: true,
    mouseStrength: 1,
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

  function applyPreset(value: DarkVeilPreset) {
    Object.assign(params, darkVeilPreset(value));
    params.preset = value;
    paneRef.value?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Veil: 'veil',
          Ember: 'ember',
          Jade: 'jade',
          Silver: 'silver',
          Storm: 'storm',
        },
      })
      .on('change', (ev) => {
        if (isDarkVeilPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.5, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'rotation', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'flow', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'warp', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'variation', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'brightness', { min: 0.2, max: 2.5, step: 0.05 });
    pane.addBinding(params, 'sheen', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'glow', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'grain', { min: 0, max: 0.15, step: 0.01 });
    pane.addBinding(params, 'quality', { min: 0.25, max: 1, step: 0.05 });
    pane.addBinding(params, 'fade', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'mouseInteraction');
    pane.addBinding(params, 'mouseStrength', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import DarkVeil from '~/components/ui/dark-veil/DarkVeil.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <DarkVeil
      color=&quot;#6b12ff&quot;
      :speed=&quot;0.5&quot;
      :flow=&quot;1&quot;
      :glow=&quot;0.4&quot;
      :mouse-interaction=&quot;true&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-background">
      <DarkVeil
        class="absolute inset-0 size-full"
        :color="params.color"
        :speed="params.speed"
        :scale="params.scale"
        :rotation="params.rotation"
        :flow="params.flow"
        :warp="params.warp"
        :variation="params.variation"
        :brightness="params.brightness"
        :sheen="params.sheen"
        :glow="params.glow"
        :grain="params.grain"
        :quality="params.quality"
        :fade="params.fade"
        :opacity="params.opacity"
        :mouse-interaction="params.mouseInteraction"
        :mouse-strength="params.mouseStrength"
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
          Become emboldened by the flame of ambition
        </p>
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move the cursor to bend the veil
      </p>
      <ShaderPane title="Dark Veil" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
