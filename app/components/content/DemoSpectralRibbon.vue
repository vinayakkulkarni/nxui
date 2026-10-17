<script setup lang="ts">
  import { reactive } from 'vue';
  import SpectralRibbon from '@registry/new-york/spectral-ribbon/SpectralRibbon.vue';
  import type { Pane } from 'tweakpane';
  import type { SpectralRibbonProps } from '@registry/new-york/spectral-ribbon/types';

  const params = reactive<Required<Omit<SpectralRibbonProps, 'class'>>>({
    speed: 1,
    intensity: 1,
    thickness: 1,
    grain: 0.45,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'intensity', { min: 0.25, max: 2, step: 0.05 });
    pane.addBinding(params, 'thickness', { min: 0.5, max: 2, step: 0.05 });
    pane.addBinding(params, 'grain', { min: 0, max: 1, step: 0.05 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import SpectralRibbon from '~/components/ui/spectral-ribbon/SpectralRibbon.vue';
</script>

<template>
  <SpectralRibbon class=&quot;h-140 rounded-2xl&quot; />
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-black">
      <SpectralRibbon
        class="absolute inset-0 size-full"
        :speed="params.speed"
        :intensity="params.intensity"
        :thickness="params.thickness"
        :grain="params.grain"
      />
      <ShaderPane
        expanded
        title="Spectral Ribbon"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
