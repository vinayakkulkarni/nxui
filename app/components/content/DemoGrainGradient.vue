<script setup lang="ts">
  import { reactive } from 'vue';
  import GrainGradient from '@registry/new-york/grain-gradient/GrainGradient.vue';
  import { GRAIN_GRADIENT_PALETTES } from '@registry/new-york/grain-gradient/grain-gradient-shader.ts';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    palette: 'Sea glass',
    colorLight: '#dce5df',
    colorMid: '#83b9ad',
    colorDark: '#031419',
    angle: 0,
    position: 0,
    curve: 0.48,
    softness: 0.13,
    scale: 1,
    grain: 0.32,
    grainSize: 1,
    seed: 1,
    speed: 1,
  });

  const paletteOptions = Object.fromEntries(
    GRAIN_GRADIENT_PALETTES.map((palette) => [palette.name, palette.name]),
  );

  let paneRef: Pane | null = null;

  function applyPalette(name: string) {
    const palette = GRAIN_GRADIENT_PALETTES.find(
      (entry) => entry.name === name,
    );
    if (!palette) return;
    params.colorLight = palette.colorLight;
    params.colorMid = palette.colorMid;
    params.colorDark = palette.colorDark;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'palette', { options: paletteOptions })
      .on('change', (event) => applyPalette(event.value));
    pane.addBinding(params, 'colorLight');
    pane.addBinding(params, 'colorMid');
    pane.addBinding(params, 'colorDark');
    pane.addBinding(params, 'angle', { min: -180, max: 180, step: 1 });
    pane.addBinding(params, 'position', { min: -0.7, max: 0.7, step: 0.01 });
    pane.addBinding(params, 'curve', { min: -1, max: 1, step: 0.01 });
    pane.addBinding(params, 'softness', { min: 0.01, max: 0.6, step: 0.01 });
    pane.addBinding(params, 'scale', { min: 0.25, max: 3, step: 0.05 });
    pane.addBinding(params, 'grain', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'grainSize', { min: 0.5, max: 4, step: 0.1 });
    pane.addBinding(params, 'seed', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GrainGradient from '~/components/ui/grain-gradient/GrainGradient.vue';
</script>

<template>
  <div class=&quot;relative h-140 w-full overflow-hidden rounded-2xl&quot;>
    <GrainGradient
      color-light=&quot;#dce5df&quot;
      color-mid=&quot;#83b9ad&quot;
      color-dark=&quot;#031419&quot;
      :curve=&quot;0.48&quot;
      :softness=&quot;0.13&quot;
      :grain=&quot;0.32&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <GrainGradient
        class="absolute inset-0 size-full"
        :color-light="params.colorLight"
        :color-mid="params.colorMid"
        :color-dark="params.colorDark"
        :angle="params.angle"
        :position="params.position"
        :curve="params.curve"
        :softness="params.softness"
        :scale="params.scale"
        :grain="params.grain"
        :grain-size="params.grainSize"
        :seed="params.seed"
        :speed="params.speed"
      />
      <ShaderPane
        expanded
        title="Grain Gradient"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
