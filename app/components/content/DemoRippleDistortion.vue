<script setup lang="ts">
  import { reactive } from 'vue';
  import RippleDistortion from '@registry/new-york/ripple-distortion/RippleDistortion.vue';
  import type { RippleDistortionProps } from '@registry/new-york/ripple-distortion/types';
  import type { Pane } from 'tweakpane';

  const DEMO_IMAGE =
    'https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?q=80&w=3416&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

  const DEFAULTS = {
    brushSize: 150,
    strength: 0.2,
    swirl: 1,
    rings: 4,
    spread: 5,
    fade: 3,
    spacing: 15,
    dispersion: 0,
    glint: 0,
    tint: '#a855f7',
    tintAmount: 0.1,
    grayscale: true,
    highlightColor: '#ffffff',
    trigger: 'hover',
    clickStrength: 2,
    quality: 'low',
    enabled: true,
  } satisfies RippleDistortionProps;

  const params = reactive({ ...DEFAULTS });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'brushSize', { min: 40, max: 260, step: 5 });
    pane.addBinding(params, 'strength', { min: 0.01, max: 0.3, step: 0.005 });
    pane.addBinding(params, 'swirl', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'rings', { min: 0, max: 5, step: 0.25 });
    pane.addBinding(params, 'spread', { min: 1, max: 10, step: 0.25 });
    pane.addBinding(params, 'fade', { min: 0.5, max: 5, step: 0.1 });
    pane.addBinding(params, 'spacing', { min: 1, max: 40, step: 1 });
    pane.addBinding(params, 'clickStrength', { min: 1, max: 4, step: 0.1 });
    pane.addBinding(params, 'dispersion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'glint', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'tintAmount', { min: 0, max: 0.6, step: 0.02 });
    pane.addBinding(params, 'tint');
    pane.addBinding(params, 'highlightColor', { label: 'highlight' });
    pane.addBinding(params, 'grayscale');
    pane.addBinding(params, 'trigger', {
      options: { Hover: 'hover', Click: 'click', Both: 'both' },
    });
    pane.addBinding(params, 'quality', {
      options: { Low: 'low', Medium: 'medium', High: 'high' },
    });
    pane.addBinding(params, 'enabled');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import RippleDistortion from '~/components/ui/ripple-distortion/RippleDistortion.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <RippleDistortion
      src=&quot;https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?w=2400&quot;
      :brush-size=&quot;150&quot;
      :strength=&quot;0.2&quot;
      :swirl=&quot;1&quot;
      :rings=&quot;4&quot;
      :spread=&quot;5&quot;
      :fade=&quot;3&quot;
      tint=&quot;#a855f7&quot;
      :tint-amount=&quot;0.1&quot;
      grayscale
      trigger=&quot;hover&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-black">
      <RippleDistortion
        class="absolute inset-0 size-full"
        :src="DEMO_IMAGE"
        :brush-size="params.brushSize"
        :strength="params.strength"
        :swirl="params.swirl"
        :rings="params.rings"
        :spread="params.spread"
        :fade="params.fade"
        :spacing="params.spacing"
        :dispersion="params.dispersion"
        :glint="params.glint"
        :tint="params.tint"
        :tint-amount="params.tintAmount"
        :grayscale="params.grayscale"
        :highlight-color="params.highlightColor"
        :trigger="params.trigger"
        :click-strength="params.clickStrength"
        :quality="params.quality"
        :enabled="params.enabled"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-white/70"
      >
        move the pointer to disturb the surface
      </p>
      <ShaderPane title="Ripple Distortion" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
